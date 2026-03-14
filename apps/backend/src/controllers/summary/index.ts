import dayjs from 'dayjs'
import prisma from '@/libs/prisma.js'
import { Request, Response } from 'express'
import { calcMTD, calcNetRevenue, getCRR, getMtdDates, getRFM, getRPR } from '@/utils/statsFunctions.js'
export const mtdSummary = async (req: Request, res: Response) => {
  try {
    const { mtdStart, mtdEnd, prevMtdStart, prevMtdEnd } = getMtdDates()

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
    // REVENUE
    // =====================
    const [revenueCurrent, revenueLast] = await Promise.all([

      prisma.sales_invoices.findMany({
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          ...salesFilter
        },
        select: {
          DocNum: true,
          TotalSales: true,
          returs: {
            select: {
              TotalSales: true
            }
          }
        }
      }),

      prisma.sales_invoices.findMany({
        where: {
          DocDate: { gte: prevMtdStart, lte: prevMtdEnd },
          ...salesFilter
        },
        select: {
          DocNum: true,
          TotalSales: true,
          returs: {
            select: {
              TotalSales: true
            }
          }
        }
      })

    ])

    const totalRevCurrent = calcNetRevenue(revenueCurrent)
    const totalRevLast = calcNetRevenue(revenueLast)

    const revenue = calcMTD(totalRevCurrent, totalRevLast)

    // =====================
    // ORDERS (CURRENT & LAST)
    // =====================
    const [ordersCurrent, ordersLast] = await Promise.all([
      prisma.orders.groupBy({
        by: ['DocNum'],
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          ...salesFilter,
        },
      }),
      prisma.orders.groupBy({
        by: ['DocNum'],
        where: {
          DocDate: {
            gte: prevMtdStart,
            lte: prevMtdEnd,
          },
          ...salesFilter,
        },
      }),
    ])

    const orders = calcMTD(ordersCurrent.length, ordersLast.length)

    // =====================
    // ACTIVE CUSTOMERS
    // =====================
    const [customersCurrent, customersLast] = await Promise.all([
      prisma.sales_invoices.groupBy({
        by: ['CardCode'],
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          ...salesFilter,
        },
      }),
      prisma.sales_invoices.groupBy({
        by: ['CardCode'],
        where: {
          DocDate: {
            gte: prevMtdStart,
            lte: prevMtdEnd,
          },
          ...salesFilter,
        },
      }),
    ])

    const customers = calcMTD(
      customersCurrent.length,
      customersLast.length
    )

    // =====================
    // AOV
    // =====================
    const aov = calcMTD(
      ordersCurrent.length
        ? totalRevCurrent / ordersCurrent.length
        : 0,
      ordersLast.length
        ? totalRevLast / ordersLast.length
        : 0
    )

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

    const revenueByMonth = Array.from(revenueMap.values()).reduce<Record<string, number>>(
      (acc, cur) => {

        if (!cur.date) return acc

        const period = dayjs(cur.date).format('YYYY-MM')

        const net = cur.sales + cur.retur

        acc[period] = (acc[period] ?? 0) + net

        return acc
      },
      {}
    )

    const revenueTrend = Object.entries(revenueByMonth)
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // =====================
    // ORDER TREND (12 MONTHS)
    // =====================
    const ordersTrendRaw = await prisma.orders.findMany({
      where: {
        DocDate: { gte: trendStart, lte: trendEnd },
        ...salesFilter,
      },
      select: {
        DocDate: true,
        DocNum: true,
      },
    })

    const ordersMap = ordersTrendRaw.reduce<Record<string, Set<number>>>(
      (acc, cur) => {
        if (!cur.DocDate || cur.DocNum == null) return acc
        const period = dayjs(cur.DocDate).format('YYYY-MM')
        acc[period] ??= new Set()
        acc[period].add(cur.DocNum)
        return acc
      },
      {}
    )

    const currentPeriod = now.format('YYYY-MM')

    const orderTrend = months.map((period) => ({
      period,
      order:
        period === currentPeriod
          ? ordersCurrent.length
          : ordersMap[period]?.size ?? 0,
    }))

    const customerTrendRaw = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { gte: trendStart, lte: trendEnd },
        ...salesFilter,
      },
      distinct: ['DocNum'],
      select: {
        DocDate: true,
        CardCode: true,
      },
    })

    const customerMap = customerTrendRaw.reduce<Record<string, Set<string>>>(
      (acc, cur) => {
        if (!cur.DocDate || !cur.CardCode) return acc

        const period = dayjs(cur.DocDate).format('YYYY-MM')
        acc[period] ??= new Set()
        acc[period].add(cur.CardCode)
        return acc
      },
      {}
    )
    const customerTrend = Object.entries(customerMap)
      .map(([period, set]) => ({
        period,
        activeCustomers: set.size,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

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

    const aovTrend = Object.entries(aovMap)
      .map(([period, data]) => ({
        period,
        aov: data.orders > 0
          ? data.totalSales / data.orders
          : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))


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


    const invoicesCurrent = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { gte: monthStart, lte: monthEnd },
        ...salesFilter
      },
      select: { CardCode: true },
    })

    const invoicesBefore = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { lt: monthStart },
        ...salesFilter
      },
      select: { CardCode: true },
    })

    const beforeSet = new Set(invoicesBefore.map(i => i.CardCode))
    const currentSet = new Set(invoicesCurrent.map(i => i.CardCode))

    let newCustomerCount = 0
    let returningCustomerCount = 0

    currentSet.forEach(card => {
      if (beforeSet.has(card)) returningCustomerCount += 1
      else newCustomerCount += 1
    })

    const newVsReturning = {
      newCustomer: newCustomerCount,
      returningCustomer: returningCustomerCount
    }

    // ========== CRR ==========
    const CRR = await getCRR(salesFilter)

    const RPR = await getRPR(salesFilter)

    const RFM = await getRFM(salesFilter)



    // =====================
    // RESPONSE
    // =====================
    return res.status(200).json({
      message: 'Success',
      data: {
        revenue,
        orders,
        customers,
        aov,
        revenueTrend,
        customerTrend,
        orderTrend,
        aovTrend,
        slpRevenue,
        productRevenueDistributor,
        productRevenueGrocery,
        newVsReturning,
        CRR,
        RPR,
        RFM
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
