import prisma from "@/libs/prisma.js";
import { cacheGet, cacheSet } from "@/libs/cache.js";

type ProductWithDevelopments = Awaited<
  ReturnType<typeof prisma.products.findMany>
>[number] & {
  product_developments: Awaited<
    ReturnType<typeof prisma.product_developments.findMany>
  >;
};

export type ParetoProduct = ProductWithDevelopments & {
  totalSales: number;
  isDevelopment: boolean;
};

export const getParetoProducts = async (
  customerId: number,
  excludeProductIds: Set<number> = new Set()
): Promise<ParetoProduct[]> => {
  // =========================================
  // CACHE
  // =========================================
  const excludeKey = Array.from(excludeProductIds)
    .sort((a, b) => a - b)
    .join(",");

  const cacheKey =
    `saleshub:pareto-products:${customerId}:${excludeKey || "none"}`;

  const cached = await cacheGet<ParetoProduct[]>(cacheKey);

  if (cached) {
    return cached;
  }

  // =========================================
  // CUSTOMER
  // =========================================
  const customer = await prisma.customers.findUnique({
    where: {
      id: customerId,
    },
    include: {
      subgroup: true,
    },
  });

  if (!customer) {
    return [];
  }

  const subgroupId = customer.subgroup?.IndCode;
  const hasValidCardCode = Boolean(customer.CardCode);
  const totalLimit = 20;

  // =========================================
  // PRODUCTS (Distributor N)
  // =========================================
  const productsN = await prisma.products.findMany({
    where: {
      Distributor: "N",
    },
  });

  if (!productsN.length) {
    return [];
  }

  const productIdMap = new Map(
    productsN.map((product) => [
      product.ItemCode,
      product.id,
    ])
  );

  const itemCodesN = productsN.map(
    (product) => product.ItemCode
  );

  // =========================================
  // CUSTOMER HISTORY
  // =========================================
  let boughtItemCodes = new Set<string>();

  if (hasValidCardCode) {
    const history = await prisma.sales_invoices.findMany({
      where: {
        CardCode: customer.CardCode!,
      },
      select: {
        ItemCode: true,
      },
      distinct: ["ItemCode"],
    });

    boughtItemCodes = new Set(
      history.map((item) => item.ItemCode)
    );
  }

  // =========================================
  // GLOBAL PARETO
  // =========================================
  const productSalesGlobal =
    await prisma.sales_invoices.groupBy({
      by: ["ItemCode"],
      where: {
        ItemCode: {
          in: itemCodesN,
        },
      },
      _sum: {
        TotalSales: true,
      },
      orderBy: {
        _sum: {
          TotalSales: "desc",
        },
      },
    });

  const totalMapGlobal = new Map<string, number>();
  const topGlobal: string[] = [];

  for (const product of productSalesGlobal) {
    const total = Number(
      product._sum.TotalSales ?? 0
    );

    const productId = productIdMap.get(
      product.ItemCode
    );

    const isExcluded =
      boughtItemCodes.has(product.ItemCode) ||
      (
        productId !== undefined &&
        excludeProductIds.has(Number(productId))
      );

    if (!isExcluded) {
      topGlobal.push(product.ItemCode);
      totalMapGlobal.set(
        product.ItemCode,
        total
      );
    }

    if (topGlobal.length >= totalLimit) {
      break;
    }
  }

  // =========================================
  // SUBGROUP PARETO
  // =========================================
  const totalMapSub = new Map<string, number>();
  const topSub: string[] = [];

  if (subgroupId && hasValidCardCode) {
    const subgroupCustomers =
      await prisma.customers.findMany({
        where: {
          IndustryC: subgroupId,
        },
        select: {
          CardCode: true,
        },
      });

    const cardCodes = subgroupCustomers
      .map((customer) => customer.CardCode)
      .filter(
        (cardCode): cardCode is string =>
          Boolean(cardCode)
      );

    if (cardCodes.length) {
      const salesSub =
        await prisma.sales_invoices.groupBy({
          by: ["ItemCode"],
          where: {
            CardCode: {
              in: cardCodes,
            },
            ItemCode: {
              in: itemCodesN,
            },
          },
          _sum: {
            TotalSales: true,
          },
          orderBy: {
            _sum: {
              TotalSales: "desc",
            },
          },
        });

      for (const product of salesSub) {
        const total = Number(
          product._sum.TotalSales ?? 0
        );

        const productId = productIdMap.get(
          product.ItemCode
        );

        const isExcluded =
          boughtItemCodes.has(product.ItemCode) ||
          (
            productId !== undefined &&
            excludeProductIds.has(
              Number(productId)
            )
          );

        if (!isExcluded) {
          topSub.push(product.ItemCode);

          totalMapSub.set(
            product.ItemCode,
            total
          );
        }

        if (topSub.length >= totalLimit) {
          break;
        }
      }
    }
  }

  // =========================================
  // FETCH PRODUCTS
  // =========================================
  const allCodes = Array.from(
    new Set([
      ...topSub,
      ...topGlobal,
    ])
  );

  // IMPORTANT:
  // product_developments harus selalu tersedia
  const products = await prisma.products.findMany({
    where: {
      ItemCode: {
        in: allCodes,
      },
    },
    include: {
      product_developments: true,
    },
  });

  const productMap = new Map(
    products.map((product) => [
      product.ItemCode,
      product,
    ])
  );

  // =========================================
  // BUILD RESULT
  // =========================================
  const final: ParetoProduct[] = [];
  const used = new Set<string>();

  const pushItems = (
    codes: string[],
    totalMap: Map<string, number>
  ) => {
    for (const code of codes) {
      if (used.has(code)) {
        continue;
      }

      const product = productMap.get(code);

      if (!product) {
        continue;
      }

      final.push({
        ...product,

        totalSales:
          totalMap.get(code) ?? 0,

        isDevelopment:
          product.product_developments.length > 0,
      });

      used.add(code);

      if (final.length >= totalLimit) {
        return;
      }
    }
  };

  // Subgroup punya priority
  pushItems(
    topSub,
    totalMapSub
  );

  pushItems(
    topGlobal,
    totalMapGlobal
  );

  // =========================================
  // DEVELOPMENT PRIORITY
  // =========================================
  if (
    final.length < totalLimit &&
    subgroupId
  ) {
    const developmentProducts =
      await prisma.products.findMany({
        where: {
          Distributor: "N",

          product_developments: {
            some: {
              subgroup: {
                IndCode: subgroupId,
              },
            },
          },
        },

        include: {
          product_developments: true,
        },

        take: totalLimit,
      });

    for (const product of developmentProducts) {
      if (used.has(product.ItemCode)) {
        continue;
      }

      final.unshift({
        ...product,
        totalSales: 0,
        isDevelopment: true,
      });

      used.add(product.ItemCode);

      if (final.length >= totalLimit) {
        break;
      }
    }
  }

  // =========================================
  // FALLBACK
  // =========================================
  if (final.length < totalLimit) {
    const fallback =
      await prisma.products.findMany({
        where: {
          Distributor: "N",

          ItemCode: {
            notIn: Array.from(used),
          },
        },

        include: {
          product_developments: true,
        },

        take:
          totalLimit - final.length,
      });

    final.push(
      ...fallback.map(
        (product): ParetoProduct => ({
          ...product,

          totalSales: 0,

          isDevelopment:
            product.product_developments.length > 0,
        })
      )
    );
  }

  // =========================================
  // FINAL
  // =========================================
  const result = final.slice(
    0,
    totalLimit
  );

  await cacheSet(
    cacheKey,
    result,
    600
  );

  return result;
};
