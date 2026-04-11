

import prisma from '@/libs/prisma.js'
import { calcGrowth } from '@/utils/statsFunctions.js'
import { SummaryResult } from '@saleshub-tsm/types'


export const getSalesSummary = async (salesPersonId?: number | null) => {
  const [mtd, ytd] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT
        SUM(CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date <= CURDATE()
              THEN s.revenue ELSE 0 END) AS revenue_current,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date <= CURDATE()
              THEN s.orders ELSE 0 END) AS orders_current,

        COUNT(DISTINCT CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date <= CURDATE()
              THEN s.CardCode END) AS customers_current,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND s.date <= LEAST(
                DATE_ADD(
                  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                  INTERVAL DAY(CURDATE()) - 1 DAY
                ),
                LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              )
              THEN s.revenue ELSE 0 END) AS revenue_previous,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND s.date <= LEAST(
                DATE_ADD(
                  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                  INTERVAL DAY(CURDATE()) - 1 DAY
                ),
                LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              )
              THEN s.orders ELSE 0 END) AS orders_previous,

        COUNT(DISTINCT CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
              AND s.date <= LEAST(
                DATE_ADD(
                  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'),
                  INTERVAL DAY(CURDATE()) - 1 DAY
                ),
                LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              )
              THEN s.CardCode END) AS customers_previous

      FROM daily_sales_summary_view s
      WHERE (${salesPersonId} IS NULL OR s.sales_person_id = ${salesPersonId});
    `,

    prisma.$queryRaw<any[]>`
    SELECT
      -- CURRENT YTD
      SUM(CASE
            WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
            AND s.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            THEN s.revenue ELSE 0 END) AS revenue_current,

      SUM(CASE
            WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
            AND s.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            THEN s.orders ELSE 0 END) AS orders_current,

      COUNT(DISTINCT CASE
            WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
            AND s.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            THEN s.CardCode END) AS customers_current,


      -- LAST YEAR YTD (FIXED)
      SUM(CASE
            WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-01-01')
            AND s.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY)
            THEN s.revenue ELSE 0 END) AS revenue_previous,

      SUM(CASE
            WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-01-01')
            AND s.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY)
            THEN s.orders ELSE 0 END) AS orders_previous,

      COUNT(DISTINCT CASE
            WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-01-01')
            AND s.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY)
            THEN s.CardCode END) AS customers_previous

    FROM daily_sales_summary_view s
    WHERE (${salesPersonId} IS NULL OR s.sales_person_id = ${salesPersonId});
  `
  ])

  const mapResult = (row: any): SummaryResult => {
    const currentRevenue = Number(row.revenue_current ?? 0)
    const currentOrders = Number(row.orders_current ?? 0)
    const currentCustomers = Number(row.customers_current ?? 0)
    const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0

    const prevRevenue = Number(row.revenue_previous ?? 0)
    const prevOrders = Number(row.orders_previous ?? 0)
    const prevCustomers = Number(row.customers_previous ?? 0)
    const prevAOV = prevOrders > 0 ? prevRevenue / prevOrders : 0

    return {
      current: {
        revenue: currentRevenue,
        orders: currentOrders,
        customers: currentCustomers,
        aov: currentAOV
      },
      previous: {
        revenue: prevRevenue,
        orders: prevOrders,
        customers: prevCustomers,
        aov: prevAOV
      },
      growth: {
        revenue: calcGrowth(currentRevenue, prevRevenue),
        orders: calcGrowth(currentOrders, prevOrders),
        customers: calcGrowth(currentCustomers, prevCustomers),
        aov: calcGrowth(currentAOV, prevAOV)
      }
    }
  }

  return {
    mtd: mapResult(mtd[0]),
    ytd: mapResult(ytd[0])
  }
}
