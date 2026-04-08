import prisma from "@/libs/prisma.js";

export const getParetoProducts = async (customerId: number) => {
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

  const itemCodesN = productsN.map((p) => p.ItemCode);
  if (itemCodesN.length === 0) return [];

  // =============================
  // GLOBAL PARETO
  // =============================
  const productSalesGlobal = await prisma.sales_invoices.groupBy({
    by: ['ItemCode'],
    where: {
      ItemCode: { in: itemCodesN },
    },
    _sum: { TotalSales: true },
    orderBy: { _sum: { TotalSales: 'desc' } },
  });

  if (productSalesGlobal.length === 0) return [];

  const grandTotalGlobal = productSalesGlobal.reduce(
    (sum, p) => sum + Number(p._sum.TotalSales ?? 0),
    0
  );

  let runningTotalGlobal = 0;
  const topParetoGlobalItemCodes: string[] = [];
  const totalMapGlobal = new Map<string, number>();

  for (const p of productSalesGlobal) {
    const total = Number(p._sum.TotalSales ?? 0);
    runningTotalGlobal += total;

    topParetoGlobalItemCodes.push(p.ItemCode);
    totalMapGlobal.set(p.ItemCode, total);

    if (runningTotalGlobal / grandTotalGlobal >= 0.8) break;
  }

  // =============================
  // SUBGROUP PARETO (optional)
  // =============================
  let topParetoSubgroupItemCodes: string[] = [];
  const totalMapSubgroup = new Map<string, number>();

  if (subgroupId && hasValidCardCode) {
    const cardCodes = (
      await prisma.customers.findMany({
        where: { IndustryC: subgroupId },
        select: { CardCode: true },
      })
    )
      .map((c) => c.CardCode)
      .filter((c): c is string => Boolean(c));

    if (cardCodes.length > 0) {
      const productSalesSubgroup = await prisma.sales_invoices.groupBy({
        by: ['ItemCode'],
        where: {
          CardCode: { in: cardCodes },
          ItemCode: { in: itemCodesN },
        },
        _sum: { TotalSales: true },
        orderBy: { _sum: { TotalSales: 'desc' } },
      });

      if (productSalesSubgroup.length > 0) {
        const grandTotalSubgroup = productSalesSubgroup.reduce(
          (sum, p) => sum + Number(p._sum.TotalSales ?? 0),
          0
        );

        let runningTotalSubgroup = 0;

        for (const p of productSalesSubgroup) {
          const total = Number(p._sum.TotalSales ?? 0);
          runningTotalSubgroup += total;

          topParetoSubgroupItemCodes.push(p.ItemCode);
          totalMapSubgroup.set(p.ItemCode, total);

          if (runningTotalSubgroup / grandTotalSubgroup >= 0.8) break;
        }
      }
    }
  }

  // =============================
  // CUSTOMER HISTORY (optional)
  // =============================
  let boughtItemCodes = new Set<string>();

  if (hasValidCardCode) {
    const customerHistory = await prisma.sales_invoices.findMany({
      where: { CardCode: customer.CardCode! },
      select: { ItemCode: true },
      distinct: ['ItemCode'],
    });

    boughtItemCodes = new Set(customerHistory.map((c) => c.ItemCode));
  }

  // =============================
  // FILTER SUGGESTION
  // =============================
  const productToSuggestSubgroup = hasValidCardCode
    ? topParetoSubgroupItemCodes.filter((ic) => !boughtItemCodes.has(ic))
    : [];

  const productToSuggestGlobal = hasValidCardCode
    ? topParetoGlobalItemCodes.filter((ic) => !boughtItemCodes.has(ic))
    : topParetoGlobalItemCodes; // fallback for customer baru

  const allSuggestedItemCodes = Array.from(
    new Set([...productToSuggestSubgroup, ...productToSuggestGlobal])
  );

  const suggestedProducts =
    allSuggestedItemCodes.length > 0
      ? await prisma.products.findMany({
          where: { ItemCode: { in: allSuggestedItemCodes } },
        })
      : [];

  const productByCode = new Map(
    suggestedProducts.map((p) => [p.ItemCode, p])
  );

  // =============================
  // DEVELOPMENT PRODUCTS
  // =============================
  const productDevelopments = subgroupId
    ? await prisma.products.findMany({
        where: {
          Distributor: 'N',
          product_developments: {
            some: {
              subgroup: { IndCode: subgroupId },
            },
          },
          ...(hasValidCardCode && {
            ItemCode: { notIn: Array.from(boughtItemCodes) },
          }),
        },
        include: { product_developments: true },
      })
    : [];

  const devItems = productDevelopments
    .map((p) => ({
      ...p,
      totalSales:
        totalMapSubgroup.get(p.ItemCode) ??
        totalMapGlobal.get(p.ItemCode) ??
        0,
      isDevelopment: true,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  const subgroupItems = productToSuggestSubgroup
    .map((code) => productByCode.get(code))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      ...p,
      totalSales: totalMapSubgroup.get(p.ItemCode) ?? 0,
      isDevelopment: false,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  const globalItems = productToSuggestGlobal
    .map((code) => productByCode.get(code))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      ...p,
      totalSales: totalMapGlobal.get(p.ItemCode) ?? 0,
      isDevelopment: false,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // =============================
  // MERGE RESULT
  // =============================
  const mergedProductsMap = new Map<string, any>();
  const finalSuggestedProducts: any[] = [];

  const addToResult = (items: any[], limit: number) => {
    let added = 0;
    for (const item of items) {
      if (mergedProductsMap.has(item.ItemCode)) continue;

      mergedProductsMap.set(item.ItemCode, item);
      finalSuggestedProducts.push(item);

      added++;
      if (added >= limit) break;
    }
  };

  addToResult(devItems, totalLimit);
  addToResult(subgroupItems, totalLimit - finalSuggestedProducts.length);
  addToResult(globalItems, totalLimit - finalSuggestedProducts.length);

  return finalSuggestedProducts.slice(0, totalLimit);
};
