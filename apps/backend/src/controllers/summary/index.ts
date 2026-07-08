import dayjs from 'dayjs'
import prisma from '@/libs/prisma.js'
import { Request, Response } from 'express'
import { getCRR, getMtdDates, getRFM } from '@/utils/statsFunctions.js'
import { getActiveCustomers, getNooVsExisting, getPeriodRange, getRevenueByCategory, getSalesSummary } from './functions.js'
import { MonthlySummary } from '@saleshub-tsm/types'
import { CUSTOMER_INSIGHT_PERIODS } from '@/constants/index.js'

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


    const [
      revenueTrendRaw,
      invoices
    ] = await Promise.all([
      prisma.sales_invoices.findMany({
        where: {
          DocDate: { gte: trendStart, lte: trendEnd },
          ...salesFilter,
        },
        select: {
          DocNum: true,
          DocDate: true,
          TotalSales: true
        },
      }),

      prisma.sales_invoices.findMany({
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          ...salesFilter,
        },
        include: {
          customer: {
            include: { sales_person: true },
          },
        },
      })
    ])

    const docNums = revenueTrendRaw.map(s => s.DocNum)
    const invDocNums = [...new Set(invoices.map(inv => inv.DocNum))]

    const [
      returTrendRaw,
      returTotals
    ] = await Promise.all([
      prisma.retur_invoices.findMany({
        where: {
          DocNum: { in: docNums },
          ...salesFilter,
        },
        select: {
          DocNum: true,
          DocDate: true,
          TotalSales: true,
        },
      }),

      prisma.retur_invoices.groupBy({
        by: ['DocNum'],
        _sum: { TotalSales: true },
        where: {
          DocNum: { in: invDocNums },
          ...salesFilter,
        },
      })
    ])

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

    const [
      topItemsSalesDistributor,
      topItemsReturDistributor,
      topItemsSalesGrocery,
      topItemsReturGrocery,
      monthlyTrendRaw,
      summary,
    ] = await Promise.all([

      prisma.sales_invoices.groupBy({
        by: ['ItemCode'],
        _sum: { TotalSales: true },
        _count: { DocNum: true },
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          product: { Distributor: 'Y' },
          ...salesFilter,
        },
      }),

      prisma.retur_invoices.groupBy({
        by: ['ItemCode'],
        _sum: { TotalSales: true },
        _count: { DocNum: true },
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          product: { Distributor: 'Y' },
          ...salesFilter,
        },
      }),

      prisma.sales_invoices.groupBy({
        by: ['ItemCode'],
        _sum: { TotalSales: true },
        _count: { DocNum: true },
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          product: { Distributor: 'N' },
          ...salesFilter,
        },
      }),

      prisma.retur_invoices.groupBy({
        by: ['ItemCode'],
        _sum: { TotalSales: true },
        _count: { DocNum: true },
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          product: { Distributor: 'N' },
          ...salesFilter,
        },
      }),

      prisma.$queryRaw<MonthlySummary[]>`
        SELECT
          YEAR(s.date) AS year,
          MONTH(s.date) AS month,
          SUM(s.revenue) AS revenue,
          SUM(s.orders) AS orders,
          COUNT(DISTINCT s.CardCode) AS customers
        FROM daily_sales_summary_view s
        JOIN customers c ON c.CardCode = s.CardCode
        JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
        WHERE s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')
          AND s.date <= LAST_DAY(CURDATE())
          AND (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
        GROUP BY YEAR(s.date), MONTH(s.date)
        ORDER BY YEAR(s.date), MONTH(s.date)
      `,

      getSalesSummary(salesPersonId ? Number(salesPersonId) : null),
    ])


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

    const [productDistributor, productGrocery] = await Promise.all([
      prisma.products.findMany({
        where: { ItemCode: { in: topItemsDistributor.map(i => i.ItemCode) } },
        select: { ItemCode: true, ItemName: true },
      }),
      prisma.products.findMany({
        where: { ItemCode: { in: topItemsGrocery.map(i => i.ItemCode) } },
        select: { ItemCode: true, ItemName: true },
      }),
    ])

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

    const monthlyTrend = monthlyTrendRaw.map(r => ({
      year: r.year,
      month: r.month,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
      customers: Number(r.customers ?? 0),
    }))

    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: 'Success',
      data: {
        slpRevenue,
        productRevenueDistributor,
        productRevenueGrocery,
        monthlyTrend,
        summary,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : error })
  }
}

export const customerLoyalty = async (req: Request, res: Response) => {
  try {
    const { salesPersonId } = req.query;

    const salesFilter = salesPersonId
      ? {
        customer: {
          sales_person: {
            id: Number(salesPersonId),
          },
        },
      }
      : {};

    const [retentionIndex, nooVsExisting, rfmResults] = await Promise.all([
      Promise.all(
        CUSTOMER_INSIGHT_PERIODS.map(async (period) => ({
          period,
          data: await getCRR(salesFilter, period),
        })),
      ),

      Promise.all(
        CUSTOMER_INSIGHT_PERIODS.map(async (period) => ({
          period,
          data: await getNooVsExisting(
            salesPersonId ? Number(salesPersonId) : null,
            period,
          ),
        })),
      ),

      Promise.all(
        CUSTOMER_INSIGHT_PERIODS.map(async (period) => ({
          period,
          data: await getRFM(salesFilter, period),
        })),
      ),
    ]);

    const CRR = Object.fromEntries(
      retentionIndex.map(({ period, data }) => [period, data])
    );
    const RFM = Object.fromEntries(
      rfmResults.map(({ period, data }) => [period, data])
    );

    res.status(200).json({
      message: 'Success',
      data: {
        CRR,
        nooVsExisting,
        RFM,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const fetchActiveCustomers = async (req: Request, res: Response) => {
  const { salesPersonId } = req.query
  try {
    const activeCustomers = await getActiveCustomers(salesPersonId ? Number(salesPersonId) : null)
    res.status(200).json({
      message: 'Success',
      data: {
        activeCustomers
      },
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

}

export const fetchCustomersByRangeItem = async (req: Request, res: Response) => {
  try {
    const { start, end } = getPeriodRange(12)
    const customersByRangeItem = await prisma.customer_item_range_monthly.findMany({
      where: {
        period: {
          gte: start,
          lte: end
        },
      },
      orderBy: {
        period: 'asc'
      }
    })
    res.status(200).json({
      message: 'Success',
      data: {
        customersByRangeItem
      },
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const fetchRevenueByCategory = async (req: Request, res: Response) => {
  try {
    const revenueByCategory = await getRevenueByCategory()
    res.status(200).json({
      message: 'Success',
      data: {
        revenueByCategory
      },
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
