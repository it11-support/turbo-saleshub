import prisma from "@/libs/prisma.js";

export const getParetoProducts = async (
  customerId: number,
  excludeProductIds: Set<number> = new Set()
) => {
  const customer = await prisma.customers.findUnique({
    where: { id: customerId },
    include: { subgroup: true },
  });

  if (!customer) return [];

  const subgroupId = customer.subgroup?.IndCode;
  const hasValidCardCode = Boolean(customer.CardCode);
  const totalLimit = 20;

  // =============================
  // GET PRODUCTS (Distributor N)
  // =============================
  const productsN = await prisma.products.findMany({
    where: { Distributor: 'N' },
  });

  if (!productsN.length) return [];

  const productIdMap = new Map(
    productsN.map((p) => [p.ItemCode, p.id])
  );

  const itemCodesN = productsN.map((p) => p.ItemCode);

  // =============================
  // CUSTOMER HISTORY
  // =============================
  let boughtItemCodes = new Set<string>();

  if (hasValidCardCode) {
    const history = await prisma.sales_invoices.findMany({
      where: { CardCode: customer.CardCode! },
      select: { ItemCode: true },
      distinct: ['ItemCode'],
    });

    boughtItemCodes = new Set(history.map((c) => c.ItemCode));
  }

  // =============================
  // GLOBAL PARETO
  // =============================
  const productSalesGlobal = await prisma.sales_invoices.groupBy({
    by: ['ItemCode'],
    where: { ItemCode: { in: itemCodesN } },
    _sum: { TotalSales: true },
    orderBy: { _sum: { TotalSales: 'desc' } },
  });

  const totalMapGlobal = new Map<string, number>();
  const topGlobal: string[] = [];

  for (const p of productSalesGlobal) {
    const total = Number(p._sum.TotalSales ?? 0);

    const productId = productIdMap.get(p.ItemCode);

    const isExcluded =
      boughtItemCodes.has(p.ItemCode) ||
      (productId ? excludeProductIds.has(Number(productId)) : false);

    if (!isExcluded) {
      topGlobal.push(p.ItemCode);
      totalMapGlobal.set(p.ItemCode, total);
    }

    if (topGlobal.length >= totalLimit) break;
  }

  // =============================
  // SUBGROUP PARETO
  // =============================
  const totalMapSub = new Map<string, number>();
  const topSub: string[] = [];

  if (subgroupId && hasValidCardCode) {
    const cardCodes = (
      await prisma.customers.findMany({
        where: { IndustryC: subgroupId },
        select: { CardCode: true },
      })
    )
      .map((c) => c.CardCode)
      .filter((c): c is string => Boolean(c));

    if (cardCodes.length) {
      const salesSub = await prisma.sales_invoices.groupBy({
        by: ['ItemCode'],
        where: {
          CardCode: { in: cardCodes },
          ItemCode: { in: itemCodesN },
        },
        _sum: { TotalSales: true },
        orderBy: { _sum: { TotalSales: 'desc' } },
      });

      for (const p of salesSub) {
        const total = Number(p._sum.TotalSales ?? 0);

        const productId = productIdMap.get(p.ItemCode);

        const isExcluded =
          boughtItemCodes.has(p.ItemCode) ||
          (productId ? excludeProductIds.has(Number(productId)) : false);

        if (!isExcluded) {
          topSub.push(p.ItemCode);
          totalMapSub.set(p.ItemCode, total);
        }

        if (topSub.length >= totalLimit) break;
      }
    }
  }

  // =============================
  // FETCH PRODUCTS
  // =============================
  const allCodes = Array.from(new Set([...topSub, ...topGlobal]));

  const products = await prisma.products.findMany({
    where: { ItemCode: { in: allCodes } },
  });

  const productMap = new Map(products.map((p) => [p.ItemCode, p]));

  // =============================
  // BUILD RESULT
  // =============================
  const final: any[] = [];
  const used = new Set<string>();

  const pushItems = (codes: string[], totalMap: Map<string, number>) => {
    for (const code of codes) {
      if (used.has(code)) continue;

      const p = productMap.get(code);
      if (!p) continue;

      final.push({
        ...p,
        totalSales: totalMap.get(code) ?? 0,
        isDevelopment: false,
      });

      used.add(code);

      if (final.length >= totalLimit) return;
    }
  };

  pushItems(topSub, totalMapSub);
  pushItems(topGlobal, totalMapGlobal);

  // =============================
  // DEVELOPMENT (PRIORITY)
  // =============================
  if (final.length < totalLimit && subgroupId) {
    const dev = await prisma.products.findMany({
      where: {
        Distributor: 'N',
        product_developments: {
          some: {
            subgroup: { IndCode: subgroupId },
          },
        },
      },
      include: { product_developments: true },
      take: totalLimit,
    });

    for (const p of dev) {
      if (used.has(p.ItemCode)) continue;

      final.unshift({
        ...p,
        totalSales: 0,
        isDevelopment: true,
      });

      used.add(p.ItemCode);

      if (final.length >= totalLimit) break;
    }
  }

  // =============================
  // FALLBACK (FIX TOTAL)
  // =============================
  if (final.length < totalLimit) {
    const fallback = await prisma.products.findMany({
      where: {
        Distributor: 'N',
        ItemCode: { notIn: Array.from(used) },
      },
      take: totalLimit - final.length,
    });

    final.push(
      ...fallback.map((p) => ({
        ...p,
        totalSales: 0,
        isDevelopment: false,
      }))
    );
  }

  return final.slice(0, totalLimit);
};
