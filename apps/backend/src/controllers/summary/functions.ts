

import prisma from '@/libs/prisma.js'
import { calcGrowth } from '@/utils/statsFunctions.js'
import { SummaryResult } from '@saleshub-tsm/types'


export const getSalesSummary = async (salesPersonId?: number | null) => {
  const [mtd, ytd] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT
        -- CURRENT MTD
        SUM(CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              THEN s.revenue ELSE 0 END) AS revenue_current,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              THEN s.orders ELSE 0 END) AS orders_current,

        COUNT(DISTINCT CASE
              WHEN s.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              THEN s.CardCode END) AS customers_current,

        -- PREVIOUS YEAR MTD (YoY)
        SUM(CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-%m-01')
              AND s.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY)
              THEN s.revenue ELSE 0 END) AS revenue_previous,

        SUM(CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-%m-01')
              AND s.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY)
              THEN s.orders ELSE 0 END) AS orders_previous,

        COUNT(DISTINCT CASE
              WHEN s.date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-%m-01')
              AND s.date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), INTERVAL 1 DAY)
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

        -- PREVIOUS YEAR YTD
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

    const prevRevenue = Number(row.revenue_previous ?? 0)
    const prevOrders = Number(row.orders_previous ?? 0)
    const prevCustomers = Number(row.customers_previous ?? 0)

    return {
      current: {
        revenue: currentRevenue,
        orders: currentOrders,
        customers: currentCustomers,
      },
      previous: {
        revenue: prevRevenue,
        orders: prevOrders,
        customers: prevCustomers,
      },
      growth: {
        revenue: calcGrowth(currentRevenue, prevRevenue),
        orders: calcGrowth(currentOrders, prevOrders),
        customers: calcGrowth(currentCustomers, prevCustomers),
      }
    }
  }

  return {
    mtd: mapResult(mtd[0]),
    ytd: mapResult(ytd[0])
  }
}


export const getNooVsExisting = async (salesPersonId: number | null) => {
  const result = await prisma.$queryRaw<any[]>`
    WITH first_purchase AS (
      SELECT
        CardCode,
        MIN(date) AS first_date
      FROM daily_sales_summary_view
      GROUP BY CardCode
    ),

    base AS (
      SELECT DISTINCT
        CardCode,
        date,
        sales_person_id
      FROM daily_sales_summary_view
      WHERE date IS NOT NULL
    )

    SELECT
      -- ================= MTD =================
      COUNT(DISTINCT CASE
        WHEN b.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND b.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND fp.first_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND (${salesPersonId} IS NULL OR b.sales_person_id = ${salesPersonId})
        THEN b.CardCode END) AS mtd_new,

      COUNT(DISTINCT CASE
        WHEN b.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND b.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND fp.first_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND (${salesPersonId} IS NULL OR b.sales_person_id = ${salesPersonId})
        THEN b.CardCode END) AS mtd_existing,

      -- ================= YTD =================
      COUNT(DISTINCT CASE
        WHEN b.date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
         AND b.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND fp.first_date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
         AND (${salesPersonId} IS NULL OR b.sales_person_id = ${salesPersonId})
        THEN b.CardCode END) AS ytd_new,

      COUNT(DISTINCT CASE
        WHEN b.date >= DATE_FORMAT(CURDATE(), '%Y-01-01')
         AND b.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND fp.first_date < DATE_FORMAT(CURDATE(), '%Y-01-01')
         AND (${salesPersonId} IS NULL OR b.sales_person_id = ${salesPersonId})
        THEN b.CardCode END) AS ytd_existing

    FROM base b
    JOIN first_purchase fp ON fp.CardCode = b.CardCode;
  `

  const row = result[0] ?? {}

  const mtdNew = Number(row.mtd_new ?? 0)
  const mtdExisting = Number(row.mtd_existing ?? 0)
  const ytdNew = Number(row.ytd_new ?? 0)
  const ytdExisting = Number(row.ytd_existing ?? 0)

  return {
    mtd: {
      newCustomer: mtdNew,
      existingCustomer: mtdExisting,
    },
    ytd: {
      newCustomer: ytdNew,
      existingCustomer: ytdExisting,
    }
  }
}
