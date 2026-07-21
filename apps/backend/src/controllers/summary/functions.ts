

import prisma from '@/libs/prisma.js'
import { calcGrowth } from '@/utils/statsFunctions.js'
import { RevenueByCategory, SummaryResult } from '@saleshub-tsm/types'
import dayjs from 'dayjs'


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


export const getNooVsExisting = async (
  salesPersonId: number | null,
  period: number,
) => {
  const start = dayjs()
    .startOf('month')
    .subtract(period - 1, 'month')
    .toDate()

  const result = await prisma.$queryRaw<any[]>`
    WITH all_invoices AS (
      SELECT s.CardCode, s.DocDate
      FROM sales_invoices s
      LEFT JOIN customers c ON c.CardCode = s.CardCode
      LEFT JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
      WHERE (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
    ),

    first_purchase AS (
      SELECT CardCode, MIN(DocDate) AS first_date
      FROM all_invoices
      GROUP BY CardCode
    ),

    qualifying_invoices AS (
      SELECT s.CardCode, s.DocNum, s.DocDate
      FROM sales_invoices s
      LEFT JOIN retur_invoices r
        ON r.DocNum = s.DocNum AND r.LineNum = s.LineNum
      LEFT JOIN customers c ON c.CardCode = s.CardCode
      LEFT JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
      WHERE (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
      GROUP BY s.CardCode, s.DocNum, s.DocDate
      HAVING SUM(COALESCE(s.QtyKg, 0) - COALESCE(r.QtyKg, 0)) > 0
    )

    SELECT
      COUNT(DISTINCT CASE
        WHEN fp.first_date >= ${start}
        THEN qi.CardCode
      END) AS new_customer,

      COUNT(DISTINCT CASE
        WHEN fp.first_date < ${start}
        THEN qi.CardCode
      END) AS existing_customer

    FROM qualifying_invoices qi
    JOIN first_purchase fp
      ON fp.CardCode = qi.CardCode

    WHERE qi.DocDate >= ${start}
      AND qi.DocDate < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  `

  return {
    newCustomer: Number(result[0].new_customer),
    existingCustomer: Number(result[0].existing_customer),
  }
}

export const getActiveCustomers = async (salesPersonId: number | null) => {
  const [baseRows, activeRows] = await Promise.all([
    // Query Base: Customer yang pernah transaksi Jan 2025 - Bulan lalu
    prisma.$queryRaw<any[]>`
      SELECT
        c.id,
        v.CardCode,
        c.CardName,
        c.City,
        c.SalesName,
        c.GroupName,
        c.Phone1,
        c.Cellular,
        c.SlpCode,
        MAX(v.date) as lastTransactionDate,
        SUM(v.revenue) / 12 AS avgRevenuePerMonth,
        Max(i.totalItems) AS totalItems

      FROM daily_sales_summary_view v

      LEFT JOIN customers c
        ON v.CardCode = c.CardCode

      LEFT JOIN sales_persons sp
        ON c.SlpCode = sp.SlpCode

      LEFT JOIN (
        SELECT
          CardCode,
          COUNT(DISTINCT ItemCode) AS totalItems
        FROM customer_item_monthly_raw
        WHERE month >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 12 MONTH)
          AND month < DATE_FORMAT(CURDATE(), '%Y-%m-01')
        GROUP BY CardCode
      ) i
        ON i.CardCode = v.CardCode

      WHERE v.date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 12 MONTH)
        AND v.date < DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND (${salesPersonId} IS NULL OR v.sales_person_id = ${salesPersonId})
        AND (sp.SlpName IS NULL OR sp.SlpName NOT IN ('Langganan Kantor', 'Kontan Kantor'))

      GROUP BY v.CardCode
    `,
    // Query Active: Customer yang transaksi bulan ini (MTD)
    prisma.$queryRaw<any[]>`
      SELECT v.CardCode
      FROM daily_sales_summary_view v
      LEFT JOIN sales_persons sp
        ON v.sales_person_id = sp.id
      WHERE v.date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND v.date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND (${salesPersonId} IS NULL OR v.sales_person_id = ${salesPersonId})
        AND (sp.SlpName IS NULL OR sp.SlpName NOT IN ('Langganan Kantor', 'Kontan Kantor'))
      GROUP BY v.CardCode
    `
  ]);

  // 1. Ambil set CardCode yang sudah aktif bulan ini untuk komparasi cepat
  const activeSet = new Set(activeRows.map(r => r.CardCode));

  // 2. Filter Non-Active: Ada di baseRows tapi TIDAK ADA di activeSet
  const nonActiveCustomers = baseRows.filter(customer => !activeSet.has(customer.CardCode));

  const baseTotal = baseRows.length;
  const activeTotal = activeRows.length;
  const penetration = baseTotal > 0 ? (activeTotal / baseTotal) * 100 : 0;

  return {
    baseCustomer: {
      total: baseTotal,
    },
    activeThisMonth: {
      total: activeTotal,
      penetration,
    },
    nonActive: {
      total: nonActiveCustomers.length,
      customers: nonActiveCustomers,
    }
  };
};


export const getCustomerTrend = async (salesPersonId: number | null) => {
  const [yearlyRaw, monthlyRaw] = await Promise.all([
    // =====================
    // YEARLY: NOO vs Existing per tahun
    // (2025 penuh, 2026 dihitung sampai CURDATE / YTD)
    // =====================
    prisma.$queryRaw<any[]>`
      WITH RECURSIVE all_invoices AS (
        SELECT s.CardCode, s.DocDate
        FROM sales_invoices s
        LEFT JOIN customers c ON c.CardCode = s.CardCode
        LEFT JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
        WHERE (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
      ),

      first_purchase AS (
        SELECT CardCode, MIN(DocDate) AS first_date
        FROM all_invoices
        GROUP BY CardCode
      ),

      qualifying_invoices AS (
        SELECT s.CardCode, s.DocNum, s.DocDate
        FROM sales_invoices s
        LEFT JOIN retur_invoices r
          ON r.DocNum = s.DocNum AND r.LineNum = s.LineNum
        LEFT JOIN customers c ON c.CardCode = s.CardCode
        LEFT JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
        WHERE (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
        GROUP BY s.CardCode, s.DocNum, s.DocDate
        HAVING SUM(COALESCE(s.TotalSales, 0) + COALESCE(r.TotalSales, 0)) > 0
      ),

      years AS (
        SELECT YEAR(CURDATE()) - 2 AS yr
        UNION ALL
        SELECT yr + 1 FROM years WHERE yr < YEAR(CURDATE())
      ),

      windowed AS (
        SELECT
          y.yr AS yr,
          qi.CardCode,
          fp.first_date
        FROM years y
        JOIN qualifying_invoices qi
          ON qi.DocDate >= MAKEDATE(y.yr, 1)
         AND qi.DocDate <= LEAST(MAKEDATE(y.yr + 1, 1) - INTERVAL 1 DAY, CURDATE())
        JOIN first_purchase fp
          ON fp.CardCode = qi.CardCode
        GROUP BY y.yr, qi.CardCode, fp.first_date
      )

      SELECT
        yr,
        COUNT(DISTINCT CASE
          WHEN first_date >= MAKEDATE(yr, 1)
           AND first_date <= LEAST(MAKEDATE(yr + 1, 1) - INTERVAL 1 DAY, CURDATE())
          THEN CardCode
        END) AS noo,

        COUNT(DISTINCT CASE
          WHEN first_date < MAKEDATE(yr, 1)
          THEN CardCode
        END) AS existing

      FROM windowed
      GROUP BY yr
      ORDER BY yr
    `,

    // =====================
    // MONTHLY: MTD NOO vs Existing per bulan
    // membandingkan tahun berjalan (2026) vs sebelumnya (2025)
    // selama 12 bulan (Jan - Des)
    // =====================
    prisma.$queryRaw<any[]>`
      WITH RECURSIVE all_invoices AS (
        SELECT s.CardCode, s.DocDate
        FROM sales_invoices s
        LEFT JOIN customers c ON c.CardCode = s.CardCode
        LEFT JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
        WHERE (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
      ),

      first_purchase AS (
        SELECT CardCode, MIN(DocDate) AS first_date
        FROM all_invoices
        GROUP BY CardCode
      ),

      qualifying_invoices AS (
        SELECT s.CardCode, s.DocNum, s.DocDate
        FROM sales_invoices s
        LEFT JOIN retur_invoices r
          ON r.DocNum = s.DocNum AND r.LineNum = s.LineNum
        LEFT JOIN customers c ON c.CardCode = s.CardCode
        LEFT JOIN sales_persons sp ON sp.SlpCode = c.SlpCode
        WHERE (${salesPersonId} IS NULL OR sp.id = ${salesPersonId})
        GROUP BY s.CardCode, s.DocNum, s.DocDate
        HAVING SUM(COALESCE(s.TotalSales, 0) + COALESCE(r.TotalSales, 0)) > 0
      ),

      months AS (
        SELECT MAKEDATE(YEAR(CURDATE()) - 1, 1) AS m_start
        UNION ALL
        SELECT DATE_ADD(m_start, INTERVAL 1 MONTH)
        FROM months
        WHERE m_start < MAKEDATE(YEAR(CURDATE()) + 1, 1)
      ),

      windowed AS (
        SELECT
          YEAR(m.m_start) AS yr,
          MONTH(m.m_start) AS mo,
          m.m_start AS m_start,
          CASE
            WHEN YEAR(m.m_start) = YEAR(CURDATE()) - 1
             AND MONTH(m.m_start) = MONTH(CURDATE())
            THEN LEAST(LAST_DAY(m.m_start), DATE_SUB(CURDATE(), INTERVAL 1 YEAR))
            ELSE LEAST(LAST_DAY(m.m_start), CURDATE())
          END AS m_end,
          qi.CardCode,
          fp.first_date
        FROM months m
        JOIN qualifying_invoices qi
          ON qi.DocDate >= m.m_start
         AND qi.DocDate <= CASE
            WHEN YEAR(m.m_start) = YEAR(CURDATE()) - 1
             AND MONTH(m.m_start) = MONTH(CURDATE())
            THEN LEAST(LAST_DAY(m.m_start), DATE_SUB(CURDATE(), INTERVAL 1 YEAR))
            ELSE LEAST(LAST_DAY(m.m_start), CURDATE())
          END
        JOIN first_purchase fp
          ON fp.CardCode = qi.CardCode
        GROUP BY yr, mo, m_start, m_end, qi.CardCode, fp.first_date
      )

      SELECT
        yr,
        mo,
        COUNT(DISTINCT CASE
          WHEN first_date >= m_start AND first_date <= m_end
          THEN CardCode
        END) AS noo,

        COUNT(DISTINCT CASE
          WHEN first_date < m_start
          THEN CardCode
        END) AS existing

      FROM windowed
      GROUP BY yr, mo
      ORDER BY yr, mo
    `,
  ])

  const yearly: Record<number, { noo: number; existing: number }> = {}
  yearlyRaw.forEach(r => {
    yearly[Number(r.yr)] = {
      noo: Number(r.noo ?? 0),
      existing: Number(r.existing ?? 0),
    }
  })

  const monthly: Record<number, Record<number, { noo: number; existing: number }>> = {}
  monthlyRaw.forEach(r => {
    const yr = Number(r.yr)
    const mo = Number(r.mo)

    if (!monthly[yr]) monthly[yr] = {}

    monthly[yr][mo] = {
      noo: Number(r.noo ?? 0),
      existing: Number(r.existing ?? 0),
    }
  })

  return {
    yearly,
    monthly,
  }
}

export const getPeriodRange = (months = 12) => {
  return {
    start: dayjs()
      .subtract(months - 1, 'month')
      .format('YYYY-MM'),

    end: dayjs().format('YYYY-MM'),
  }
}

export const getRevenueByCategory = async (): Promise<RevenueByCategory[]> => {
  const mtdStart = dayjs().startOf('month').toDate()
  const mtdEnd = dayjs().toDate()
  const ytdStart = dayjs().startOf('year').toDate()

  const [mtdSales, mtdRetur, ytdSales, ytdRetur] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT
        p.ProductCategory,
        SUM(s.TotalSales) AS revenue
      FROM sales_invoices s
      JOIN products p ON p.ItemCode = s.ItemCode
      WHERE s.DocDate >= ${mtdStart}
        AND s.DocDate <= ${mtdEnd}
        AND p.ProductCategory IS NOT NULL
      GROUP BY p.ProductCategory
    `,

    prisma.$queryRaw<any[]>`
      SELECT
        p.ProductCategory,
        SUM(r.TotalSales) AS revenue
      FROM retur_invoices r
      JOIN products p ON p.ItemCode = r.ItemCode
      WHERE r.DocDate >= ${mtdStart}
        AND r.DocDate <= ${mtdEnd}
        AND p.ProductCategory IS NOT NULL
      GROUP BY p.ProductCategory
    `,

    prisma.$queryRaw<any[]>`
      SELECT
        p.ProductCategory,
        SUM(s.TotalSales) AS revenue
      FROM sales_invoices s
      JOIN products p ON p.ItemCode = s.ItemCode
      WHERE s.DocDate >= ${ytdStart}
        AND s.DocDate <= ${mtdEnd}
        AND p.ProductCategory IS NOT NULL
      GROUP BY p.ProductCategory
    `,

    prisma.$queryRaw<any[]>`
      SELECT
        p.ProductCategory,
        SUM(r.TotalSales) AS revenue
      FROM retur_invoices r
      JOIN products p ON p.ItemCode = r.ItemCode
      WHERE r.DocDate >= ${ytdStart}
        AND r.DocDate <= ${mtdEnd}
        AND p.ProductCategory IS NOT NULL
      GROUP BY p.ProductCategory
    `
  ])

  const mapCategory = (rows: any[]) => {
    const map = new Map<string, number>()
    rows.forEach(r => {
      map.set(r.ProductCategory, Number(r.revenue ?? 0))
    })
    return map
  }

  const mtdSalesMap = mapCategory(mtdSales)
  const mtdReturMap = mapCategory(mtdRetur)
  const ytdSalesMap = mapCategory(ytdSales)
  const ytdReturMap = mapCategory(ytdRetur)

  const categories = new Set([
    ...mtdSalesMap.keys(),
    ...mtdReturMap.keys(),
    ...ytdSalesMap.keys(),
    ...ytdReturMap.keys()
  ])

  const result = Array.from(categories).map(category => ({
    category,
    mtd: Number(((mtdSalesMap.get(category) || 0) + (mtdReturMap.get(category) || 0)).toFixed(2)),
    ytd: Number(((ytdSalesMap.get(category) || 0) + (ytdReturMap.get(category) || 0)).toFixed(2))
  }))

  return result
}

export const normalizeItems = <
  T extends {
    ItemCode: string
    _sum: { TotalSales: unknown }
    _count: { DocNum: number }
  }
>(
  sales: T[],
  retur: T[]
) => {
  const map = new Map<
    string,
    {
      ItemCode: string
      sales: number
      count: number
    }
  >()

  for (const item of sales) {
    map.set(item.ItemCode, {
      ItemCode: item.ItemCode,
      sales: Number(item._sum.TotalSales ?? 0),
      count: item._count.DocNum,
    })
  }

  for (const item of retur) {
    const existing = map.get(item.ItemCode)

    if (existing) {
      existing.sales += Number(item._sum.TotalSales ?? 0)
      existing.count += item._count.DocNum
    } else {
      map.set(item.ItemCode, {
        ItemCode: item.ItemCode,
        sales: Number(item._sum.TotalSales ?? 0),
        count: item._count.DocNum,
      })
    }
  }

  return [...map.values()].sort((a, b) => b.sales - a.sales)
}


export const buildProductRevenue = (
  items: {
    ItemCode: string
    sales: number
    count: number
  }[],
  productMap: Map<string, string | null>
) => {
  return items.map(i => ({
    ItemName: productMap.get(i.ItemCode) ?? i.ItemCode,
    revenue: i.sales,
    orders: i.count,
  }))
}

export const getRevenueByAccountCategory = async () => {
  const [yearlyRaw, monthlyRaw] = await Promise.all([
    prisma.$queryRaw<any[]>`
      WITH RECURSIVE years AS (
        SELECT YEAR(CURDATE()) - 4 AS yr
        UNION ALL
        SELECT yr + 1
        FROM years
        WHERE yr < YEAR(CURDATE())
      )
      SELECT
        y.yr AS year,
        d.acct_name AS acctName,
        COALESCE(SUM(d.revenue), 0) AS revenue
      FROM years y
      LEFT JOIN revenue_category_daily d
        ON YEAR(d.date) = y.yr
       AND d.date >= MAKEDATE(y.yr, 1)
       AND d.date <= MAKEDATE(y.yr, DAYOFYEAR(CURDATE()))
      GROUP BY
        y.yr,
        d.acct_name
      ORDER BY
        y.yr,
        d.acct_name
    `,

    prisma.$queryRaw<any[]>`
      WITH RECURSIVE months AS (
        SELECT 1 AS mo
        UNION ALL
        SELECT mo + 1
        FROM months
        WHERE mo < MONTH(CURDATE())
      ),
      years AS (
        SELECT YEAR(CURDATE()) - 1 AS yr
        UNION ALL
        SELECT YEAR(CURDATE())
      ),
      categories AS (
        SELECT DISTINCT AcctName
        FROM products
      )
      SELECT
        y.yr AS year,
        m.mo AS month,
        c.AcctName AS acctName,
        COALESCE(SUM(d.revenue), 0) AS revenue
      FROM years y
      CROSS JOIN months m
      CROSS JOIN categories c
      LEFT JOIN revenue_category_daily d
        ON YEAR(d.date) = y.yr
       AND MONTH(d.date) = m.mo
       AND d.acct_name = c.AcctName
       AND (
            m.mo < MONTH(CURDATE())
            OR (
                m.mo = MONTH(CURDATE())
                AND DAY(d.date) <= DAY(CURDATE())
            )
       )
      GROUP BY
        y.yr,
        m.mo,
        c.AcctName
      ORDER BY
        m.mo,
        y.yr,
        c.AcctName
    `
  ])

  const yearlyMap = new Map<
    number,
    {
      year: number
      data: {
        acctName: string
        revenue: number
        previous: number
        growth: number
      }[]
    }
  >()

  yearlyRaw.forEach(r => {
    const year = Number(r.year)

    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, {
        year,
        data: [],
      })
    }

    yearlyMap.get(year)!.data.push({
      acctName: r.acctName,
      revenue: Number(r.revenue ?? 0),
      previous: 0,
      growth: 0,
    })
  })

  const yearly = [...yearlyMap.values()].sort((a, b) => a.year - b.year)

  // Hitung growth yearly vs tahun sebelumnya (YoY) per akun
  yearly.forEach((curr, idx) => {
    const prev = idx > 0 ? yearly[idx - 1] : null

    curr.data.forEach(item => {
      const prevItem = prev?.data.find(p => p.acctName === item.acctName)
      const previous = prevItem ? prevItem.revenue : 0

      item.previous = previous
      item.growth = previous > 0
        ? parseFloat((((item.revenue - previous) / previous) * 100).toFixed(2))
        : item.revenue > 0 ? 100 : 0
    })
  })

  const monthlyMap = new Map<
    number,
    {
      month: number
      data: {
        year: number
        acctName: string
        revenue: number
        previous: number
        growth: number
      }[]
    }
  >()

  monthlyRaw.forEach(r => {
    const month = Number(r.month)

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        data: [],
      })
    }

    monthlyMap.get(month)!.data.push({
      year: Number(r.year),
      acctName: r.acctName,
      revenue: Number(r.revenue ?? 0),
      previous: 0,
      growth: 0,
    })
  })

  const monthly = [...monthlyMap.values()].sort((a, b) => a.month - b.month)

  // Hitung growth monthly vs bulan yang sama tahun lalu (YoY / MTD) per akun
  monthly.forEach(curr => {
    curr.data.forEach(item => {
      if (item.year !== Math.max(...curr.data.map(d => d.year))) return

      const prevYear = item.year - 1
      const prevItem = curr.data.find(
        p => p.year === prevYear && p.acctName === item.acctName
      )
      const previous = prevItem ? prevItem.revenue : 0

      item.previous = previous
      item.growth = previous > 0
        ? parseFloat((((item.revenue - previous) / previous) * 100).toFixed(2))
        : item.revenue > 0 ? 100 : 0
    })
  })

  return { yearly, monthly }
}
