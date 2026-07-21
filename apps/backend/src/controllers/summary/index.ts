import prisma from '@/libs/prisma.js'
import { Request, Response } from 'express'
import { getCRR, getMtdDates, getRFM } from '@/utils/statsFunctions.js'
import { buildProductRevenue, getActiveCustomers, getCustomerTrend, getNooVsExisting, getPeriodRange, getRevenueByAccountCategory, getRevenueByCategory, getSalesSummary, normalizeItems } from './functions.js'
import { MonthlySummary } from '@saleshub-tsm/types'
import { CUSTOMER_INSIGHT_PERIODS } from '@/constants/index.js'
import { handleApiError } from '@/utils/apiResponse.js'

export const mtdSummary = async (req: Request, res: Response) => {
  try {
    const { mtdStart, mtdEnd } = getMtdDates()

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
        WHERE s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 23 MONTH), '%Y-%m-01')
          AND s.date <= CASE
            WHEN YEAR(s.date) = YEAR(CURDATE()) - 1
             AND MONTH(s.date) = MONTH(CURDATE())
            THEN DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
            ELSE LAST_DAY(s.date)
          END
          AND (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
        GROUP BY YEAR(s.date), MONTH(s.date)
        ORDER BY YEAR(s.date), MONTH(s.date)
      `,

      getSalesSummary(salesPersonId ? Number(salesPersonId) : null),
    ])

    const distributorItems = normalizeItems(
      topItemsSalesDistributor,
      topItemsReturDistributor
    )

    const groceryItems = normalizeItems(
      topItemsSalesGrocery,
      topItemsReturGrocery
    )

    const topItemsDistributor = distributorItems.slice(0, 10)

    const topItemsGrocery = groceryItems.slice(0, 10)

    const topItemsAll = [...distributorItems, ...groceryItems]
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)


    const itemCodes = [
      ...topItemsDistributor.map(i => i.ItemCode),
      ...topItemsGrocery.map(i => i.ItemCode),
      ...topItemsAll.map(i => i.ItemCode),
    ]

    const products = await prisma.products.findMany({
      where: {
        ItemCode: {
          in: [...new Set(itemCodes)],
        },
      },
      select: {
        ItemCode: true,
        ItemName: true,
      },
    })


    const productMap = new Map(
      products.map(p => [p.ItemCode, p.ItemName])
    )

    const productRevenueDistributor = buildProductRevenue(
      topItemsDistributor,
      productMap
    )

    const productRevenueGrocery = buildProductRevenue(
      topItemsGrocery,
      productMap
    )

    const productRevenueAll = buildProductRevenue(
      topItemsAll,
      productMap
    )

    const monthlyTrendData = monthlyTrendRaw.map(r => ({
      year: Number(r.year),
      month: Number(r.month),
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
      customers: Number(r.customers ?? 0),
    }))

    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1

      const result: Record<string | number, any> = {}
      monthlyTrendData
        .filter(x => x.month === month)
        .forEach(({ year, month: _month, ...rest }) => {
          result[year] = rest
        })

      return {
        [month]: result
      }
    })
    // =====================
    // RESPONSE
    // =====================
    res.status(200).json({
      message: 'Success',
      data: {
        productRevenueDistributor,
        productRevenueGrocery,
        productRevenueAll,
        summary,
        monthlyTrends
      },
    })
  } catch (error) {
    return handleApiError(error, res, 'Internal server error', [])
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
    return handleApiError(error, res)
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
    return handleApiError(error, res)
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
    return handleApiError(error, res)
  }
}

export const customerTrend = async (req: Request, res: Response) => {
  try {
    const { salesPersonId } = req.query

    const trend = await getCustomerTrend(
      salesPersonId ? Number(salesPersonId) : null
    )

    res.status(200).json({
      message: 'Success',
      data: {
        customerTrend: trend
      },
    })
  } catch (error) {
    return handleApiError(error, res)
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
    return handleApiError(error, res)
  }
}

export const fetchRevenueByAccountCategory = async (req: Request, res: Response) => {
  try {
    const revenueByAccountCategory = await getRevenueByAccountCategory()
    res.status(200).json({
      message: 'Success',
      data: {
        revenueByAccountCategory
      },
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}
