import dayjs from 'dayjs'
import prisma from '@/libs/prisma.js'
import { Request, Response } from 'express'
import { calcMTD, getCRR, getMtdDates, getRFM, getRPR } from '@/utils/statsFunctions.js'

type MonthlySummary = {
  year: number
  month: number
  revenue: number
  orders: number
  customers: number
}

type MtdValue = {
  revenue: number
  orders: number
  customers: number
  aov: number
}

type GrowthValue = {
  revenue: number // %
  orders: number  // %
  customers: number // %
  aov: number // %
}

export type MtdResult = {
  current: MtdValue
  previous: MtdValue
  growth: GrowthValue
}

type MtdRaw = {
  revenue_current: number | null
  orders_current: number | null
  customers_current: number | null

  revenue_last_month: number | null
  orders_last_month: number | null
  customers_last_month: number | null
}


export const mtdSummary = async (req: Request, res: Response) => {
  try {
    const { mtdStart, mtdEnd } = getMtdDates()

    const now = dayjs()

    const months: string[] = []

    let cursor = dayjs(now)
      .startOf('month')
      .subtract(11, 'month')

    for (let i = 0; i < 12; i++) {
      months.push(cursor.format('YYYY-MM'))
      cursor = cursor.add(1, 'month')
    }

    // =====================
    // DATE RANGE
    // =====================

    const trendStart = now
      .subtract(11, 'month')
      .startOf('month')
      .toDate()

    const trendEnd = mtdEnd // ⬅️ PENTING: MTD, bukan endOfMonth

    const { salesPersonId } = req.query

    const salesFilter = salesPersonId
      ? {
        customer: {
          sales_person: {
            id: Number(salesPersonId),
          },
        },
      }
      : {}


    // =====================
    // REVENUE TREND (12 MONTHS, MTD)
    // =====================
    const revenueTrendRaw = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { gte: trendStart, lte: trendEnd },
        ...salesFilter,
      },
      select: {
        DocNum: true,
        DocDate: true,
        TotalSales: true
      },
    })

    const docNums = revenueTrendRaw.map(s => s.DocNum)

    const returTrendRaw = await prisma.retur_invoices.findMany({
      where: {
        DocNum: { in: docNums },
        ...salesFilter,
      },
      select: {
        DocNum: true,
        DocDate: true,
        TotalSales: true,
      },
    })

    const revenueMap = new Map()
    revenueTrendRaw.forEach((s) => {
      const key = s.DocNum

      const existing = revenueMap.get(key) || {
        sales: 0,
        retur: 0,
        date: s.DocDate,
      }

      existing.sales += Number(s.TotalSales || 0)

      revenueMap.set(key, existing)
    })

    returTrendRaw.forEach((r) => {
      const key = r.DocNum

      const existing = revenueMap.get(key) || {
        sales: 0,
        retur: 0,
        date: r.DocDate,
      }

      existing.retur += Number(r.TotalSales || 0)

      revenueMap.set(key, existing)
    })


    // Ambil semua invoice dalam 12 bulan terakhir
    const aovSalesRaw = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { gte: trendStart, lte: trendEnd },
        ...salesFilter,
      },
      select: {
        DocDate: true,
        TotalSales: true,
        DocNum: true,
      },
    })

    const aovDocNums = [...new Set(aovSalesRaw.map(s => s.DocNum))]

    const aovReturRaw = await prisma.retur_invoices.findMany({
      where: {
        DocNum: { in: aovDocNums },
        ...salesFilter,
      },
      select: {
        TotalSales: true,
        DocNum: true,
      },
    })

    /* -------------------------
       1️⃣ Map Invoice
    ------------------------- */

    const invoiceMap = new Map<number, { date: Date; netSales: number }>()

    aovSalesRaw.forEach((s) => {
      if (!s.DocNum || !s.DocDate) return

      invoiceMap.set(s.DocNum, {
        date: s.DocDate,
        netSales: Number(s.TotalSales ?? 0),
      })
    })

    /* -------------------------
       2️⃣ Tambahkan Retur
    ------------------------- */

    aovReturRaw.forEach((r) => {
      const inv = invoiceMap.get(r.DocNum)

      if (!inv) return

      // retur sudah negatif
      inv.netSales += Number(r.TotalSales ?? 0)
    })

    /* -------------------------
       3️⃣ Group by Month
    ------------------------- */

    const aovMap: Record<string, { totalSales: number; orders: number }> = {}

    invoiceMap.forEach((inv) => {

      const period = dayjs(inv.date).format('YYYY-MM')

      if (!aovMap[period]) {
        aovMap[period] = { totalSales: 0, orders: 0 }
      }

      aovMap[period].totalSales += inv.netSales
      aovMap[period].orders += 1
    })

    /* -------------------------
       4️⃣ Build Trend
    ------------------------- */


    const invoices = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        ...salesFilter,
      },
      include: {
        customer: {
          include: {
            sales_person: true,
          },
        }
      },
    })

    const invDocNums = [...new Set(invoices.map(inv => inv.DocNum))]

    const returTotals = await prisma.retur_invoices.groupBy({
      by: ['DocNum'],
      _sum: {
        TotalSales: true,
      },
      where: {
        DocNum: { in: invDocNums },
        ...salesFilter,
      },
    })

    const returMap = new Map<number, number>(
      returTotals.map(r => [r.DocNum, Number(r._sum.TotalSales ?? 0)])
    )


    const revenueBySales: Record<string, number> = {}

    invoices.forEach(inv => {

      const slp = inv.customer?.sales_person?.SlpName ?? 'Unknown'

      const totalInvoice = Number(inv.TotalSales ?? 0)

      const totalRetur = returMap.get(inv.DocNum) ?? 0

      const netRevenue = totalInvoice + totalRetur // retur sudah negatif

      revenueBySales[slp] = (revenueBySales[slp] ?? 0) + netRevenue
    })

    const slpRevenue = Object.entries(revenueBySales)
      .map(([slp, revenue]) => ({ slp, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const topItemsSalesDistributor = await prisma.sales_invoices.groupBy({
      by: ['ItemCode'],
      _sum: { TotalSales: true },
      _count: { DocNum: true },
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        product: { Distributor: 'Y' },
        ...salesFilter,
      },
    })

    const topItemsReturDistributor = await prisma.retur_invoices.groupBy({
      by: ['ItemCode'],
      _sum: { TotalSales: true },
      _count: { DocNum: true },
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        product: { Distributor: 'Y' },
        ...salesFilter,
      },
    })

    const topItemsMapDistributor = new Map<string, { sales: number; count: number }>()

    topItemsSalesDistributor.forEach(item => {
      topItemsMapDistributor.set(item.ItemCode, {
        sales: Number(item._sum.TotalSales ?? 0),
        count: item._count.DocNum,
      })
    })

    const topItemsDistributor = Array.from(topItemsMapDistributor.entries())
      .map(([ItemCode, data]) => ({ ItemCode, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)


    topItemsReturDistributor.forEach(item => {
      const existing = topItemsMapDistributor.get(item.ItemCode) || { sales: 0, count: 0 }
      existing.sales += Number(item._sum.TotalSales ?? 0)
      existing.count += item._count.DocNum
      topItemsMapDistributor.set(item.ItemCode, existing)
    })

    const topItemsSalesGrocery = await prisma.sales_invoices.groupBy({
      by: ['ItemCode'],
      _sum: { TotalSales: true },
      _count: { DocNum: true },
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        product: {
          Distributor: 'N'
        },
        ...salesFilter,
      },
    })

    const topItemsReturGrocery = await prisma.retur_invoices.groupBy({
      by: ['ItemCode'],
      _sum: { TotalSales: true },
      _count: { DocNum: true },
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        product: { Distributor: 'N' },
        ...salesFilter,
      },
    })


    const topItemsMapGrocery = new Map<string, { sales: number; count: number }>()

    topItemsSalesGrocery.forEach(item => {
      topItemsMapGrocery.set(item.ItemCode, {
        sales: Number(item._sum.TotalSales ?? 0),
        count: item._count.DocNum,
      })
    })

    topItemsReturGrocery.forEach(item => {
      const existing = topItemsMapGrocery.get(item.ItemCode) || { sales: 0, count: 0 }
      existing.sales += Number(item._sum.TotalSales ?? 0)
      existing.count += item._count.DocNum
      topItemsMapGrocery.set(item.ItemCode, existing)
    })


    const topItemsGrocery = Array.from(topItemsMapGrocery.entries())
      .map(([ItemCode, data]) => ({ ItemCode, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)


    const itemCodesDistributor: string[] = topItemsDistributor.map(i => i.ItemCode).filter((code) => code !== null)
    const itemCodesGrocery: string[] = topItemsGrocery.map(i => i.ItemCode).filter((code) => code !== null)

    const productDistributor = await prisma.products.findMany({
      where: { ItemCode: { in: itemCodesDistributor } },
      select: { ItemCode: true, ItemName: true },
    })

    const productGrocery = await prisma.products.findMany({
      where: { ItemCode: { in: itemCodesGrocery } },
      select: { ItemCode: true, ItemName: true },
    })

    const productRevenueDistributor = topItemsDistributor.map(i => {
      const retur = topItemsReturDistributor.find(r => r.ItemCode === i.ItemCode)?._sum.TotalSales ?? 0;
      const totalRevenue = Number(i.sales ?? 0) + Number(retur);

      return {
        ItemName: productDistributor.find(p => p.ItemCode === i.ItemCode)?.ItemName ?? i.ItemCode,
        revenue: totalRevenue,
        orders: i.count,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const productRevenueGrocery = topItemsGrocery.map(i => ({
      ItemName: productGrocery.find(p => p.ItemCode === i.ItemCode)?.ItemName ?? i.ItemCode,
      revenue: Number(i.sales ?? 0),
      orders: i.count,
    })).sort((a, b) => b.revenue - a.revenue)

    // New Vs Returning
    const monthStart = dayjs().subtract(3, 'month').startOf('month').toDate()
    const monthEnd = dayjs().toDate()


    const currentInvoices = await prisma.sales_invoices.groupBy({
      by: ['CardCode'],
      where: {
        DocDate: { gte: monthStart, lte: monthEnd },
        ...salesFilter
      }
    });
    const currentCustomerCodes = currentInvoices.map(i => i.CardCode);

    const existingBefore = await prisma.sales_invoices.groupBy({
      by: ['CardCode'],
      where: {
        DocDate: { lt: monthStart },
        CardCode: { in: currentCustomerCodes },
        ...salesFilter
      }
    });

    const returningSet = new Set(existingBefore.map(i => i.CardCode));
    const returningCustomerCount = returningSet.size;
    const newCustomerCount = currentCustomerCodes.length - returningCustomerCount;

    const newVsReturning = {
      newCustomer: newCustomerCount,
      returningCustomer: returningCustomerCount
    };

    // ========== CRR ==========
    const CRR = await getCRR(salesFilter)

    const RPR = await getRPR(salesFilter)

    const RFM = await getRFM(salesFilter)


    const monthlyTrendRaw = await prisma.$queryRaw<MonthlySummary[]>`
      SELECT
        YEAR(s.date) AS year,
        MONTH(s.date) AS month,
        SUM(s.revenue) AS revenue,
        SUM(s.orders) AS orders,
        COUNT(DISTINCT s.CardCode) AS customers

      FROM daily_sales_summary_view s

      JOIN customers c
        ON c.CardCode = s.CardCode

      JOIN sales_persons sp
        ON sp.SlpCode = c.SlpCode

      WHERE s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')
      AND s.date <= LAST_DAY(CURDATE())

      AND (
          ${salesPersonId} IS NULL
          OR sp.id = ${salesPersonId}
        )

      GROUP BY
        YEAR(s.date),
        MONTH(s.date)

      ORDER BY
        YEAR(s.date),
        MONTH(s.date);
    `

    const monthlyTrend = monthlyTrendRaw.map(r => ({
      year: r.year,
      month: r.month,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
      customers: Number(r.customers ?? 0),
    }))

    const mtdCalc = await prisma.$queryRaw<MtdRaw[]>`
      SELECT
        SUM(CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date <= CURDATE()
              THEN s.revenue
              ELSE 0
            END) AS revenue_current,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date <= CURDATE()
              THEN s.orders
              ELSE 0
            END) AS orders_current,

        COUNT(DISTINCT CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date <= CURDATE()
              THEN s.CardCode
            END) AS customers_current,


        -- LAST MONTH MTD (CLAMPED)
        SUM(CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND s.date <= LEAST(
                    DATE_ADD(
                      DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                      INTERVAL DAY(CURDATE()) - 1 DAY
                    ),
                    LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                  )
              THEN s.revenue
              ELSE 0
            END) AS revenue_last_month,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND s.date <= LEAST(
                    DATE_ADD(
                      DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                      INTERVAL DAY(CURDATE()) - 1 DAY
                    ),
                    LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                  )
              THEN s.orders
              ELSE 0
            END) AS orders_last_month,

        COUNT(DISTINCT CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND s.date <= LEAST(
                    DATE_ADD(
                      DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                      INTERVAL DAY(CURDATE()) - 1 DAY
                    ),
                    LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                  )
              THEN s.CardCode
            END) AS customers_last_month

      FROM daily_sales_summary_view s

      WHERE (
        ${salesPersonId} IS NULL
        OR s.sales_person_id = ${salesPersonId}
      );
    `

      const mtdRow = mtdCalc[0]
      const currentRevenue = Number(mtdRow.revenue_current ?? 0)
      const currentOrders = Number(mtdRow.orders_current ?? 0)
      const currentCustomers = Number(mtdRow.customers_current ?? 0)
      const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0

      const lastMonthRevenue = Number(mtdRow.revenue_last_month ?? 0)
      const lastMonthOrders = Number(mtdRow.orders_last_month ?? 0)
      const lastMonthCustomers = Number(mtdRow.customers_last_month ?? 0)
      const lastMonthAOV = lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0

      const revenueMtd = calcMTD(currentRevenue, lastMonthRevenue)
      const ordersMtd = calcMTD(currentOrders, lastMonthOrders)
      const customersMtd = calcMTD(currentCustomers, lastMonthCustomers)
      const aovMtd = calcMTD(currentAOV, lastMonthAOV)


    // =====================
    // RESPONSE
    // =====================
    return res.status(200).json({
      message: 'Success',
      data: {
        slpRevenue,
        productRevenueDistributor,
        productRevenueGrocery,
        newVsReturning,
        CRR,
        RPR,
        RFM,
        monthlyTrend,
        revenueMtd,
        ordersMtd,
        customersMtd,
        aovMtd,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : error })
  }
}
