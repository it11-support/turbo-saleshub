import dayjs from 'dayjs'
import prisma from '@/libs/prisma.js'
import { Request, Response } from 'express'
import { CustomerSegment } from '@/generated/prisma/enums.js'

export const mtdSummary = async (req: Request, res: Response) => {
  try {


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
    const mtdStart = now.startOf('month').toDate()
    const mtdEnd = now.toDate()

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

    const calcMTD = (current: number, last: number) => {
      const diff = current - last
      const growthPercent = last === 0 ? null : (diff / last) * 100
      return { current, last, diff, growthPercent }
    }

    // =====================
    // REVENUE
    // =====================
    const [revenueCurrent, revenueLast] = await Promise.all([
      prisma.sales_invoices.aggregate({
        _sum: { TotalSales: true },
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          ...salesFilter,
        },
      }),
      prisma.sales_invoices.aggregate({
        _sum: { TotalSales: true },
        where: {
          DocDate: {
            gte: now.subtract(1, 'month').startOf('month').toDate(),
            lte: now.subtract(1, 'month').date(now.date()).toDate(),
          },
          ...salesFilter,
        },
      }),
    ])

    const revenue = calcMTD(
      Number(revenueCurrent._sum.TotalSales || 0),
      Number(revenueLast._sum.TotalSales || 0)
    )

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
            gte: now.subtract(1, 'month').startOf('month').toDate(),
            lte: now.subtract(1, 'month').date(now.date()).toDate(),
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
            gte: now.subtract(1, 'month').startOf('month').toDate(),
            lte: now.subtract(1, 'month').date(now.date()).toDate(),
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
        ? Number(revenueCurrent._sum.TotalSales || 0) / ordersCurrent.length
        : 0,
      ordersLast.length
        ? Number(revenueLast._sum.TotalSales || 0) / ordersLast.length
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
        DocDate: true,
        TotalSales: true,
      },
    })

    const revenueByMonth = revenueTrendRaw.reduce<Record<string, number>>(
      (acc, cur) => {
        if (!cur.DocDate) return acc
        const period = dayjs(cur.DocDate).format('YYYY-MM')
        acc[period] = (acc[period] ?? 0) + Number(cur.TotalSales)
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
        activeCustomers:
          period === currentPeriod
            ? customersCurrent.length // ⬅️ konsisten dengan KPI MTD
            : set.size,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    // Ambil semua invoice dalam 12 bulan terakhir
    const aovTrendRaw = await prisma.sales_invoices.findMany({
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

    // Group by month
    const aovMap = aovTrendRaw.reduce<Record<string, { totalSales: number; orders: Set<number> }>>(
      (acc, cur) => {
        if (!cur.DocDate || !cur.DocNum) return acc

        const period = dayjs(cur.DocDate).format('YYYY-MM')

        if (!acc[period]) acc[period] = { totalSales: 0, orders: new Set<number>() }

        acc[period].totalSales += Number(cur.TotalSales ?? 0)
        acc[period].orders.add(cur.DocNum)

        return acc
      },
      {}
    )


    const aovTrend = Object.entries(aovMap)
      .map(([period, data]) => ({
        period,
        aov:
          period === currentPeriod
            ? aov.current // ⬅️ konsisten dengan KPI AOV bulan ini
            : data.orders.size > 0
              ? data.totalSales / data.orders.size
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
        },
      },
    })
    const revenueBySales: Record<string, number> = {}

    invoices.forEach(inv => {
      const slp = inv.customer?.sales_person?.SlpName ?? 'Unknown'
      revenueBySales[slp] = (revenueBySales[slp] ?? 0) + Number(inv.TotalSales ?? 0)
    })

    const slpRevenue = Object.entries(revenueBySales)
      .map(([slp, revenue]) => ({ slp, revenue }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    const topItemsDistributor = await prisma.sales_invoices.groupBy({
      by: ['ItemCode'],
      _sum: { TotalSales: true },
      _count: { DocNum: true },
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        product: {
          ItemName: { contains: 'LIVI' },
        },
        ...salesFilter,
      },
      orderBy: { _sum: { TotalSales: 'desc' } },
      take: 10,
    })

    const topItemsGrocery = await prisma.sales_invoices.groupBy({
      by: ['ItemCode'],
      _sum: { TotalSales: true },
      _count: { DocNum: true },
      where: {
        DocDate: { gte: mtdStart, lte: mtdEnd },
        product: {
          ItemName: {
            not: { contains: 'LIVI' },
          }
        },
        ...salesFilter,
      },
      orderBy: { _sum: { TotalSales: 'desc' } },
      take: 10,
    })

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

    const productRevenueDistributor = topItemsDistributor.map(i => ({
      ItemName: productDistributor.find(p => p.ItemCode === i.ItemCode)?.ItemName ?? i.ItemCode,
      revenue: Number(i._sum.TotalSales ?? 0),
      orders: i._count.DocNum,
    })).sort((a, b) => b.revenue - a.revenue)

    const productRevenueGrocery = topItemsGrocery.map(i => ({
      ItemName: productGrocery.find(p => p.ItemCode === i.ItemCode)?.ItemName ?? i.ItemCode,
      revenue: Number(i._sum.TotalSales ?? 0),
      orders: i._count.DocNum,
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


    const CRRPeriodStart = dayjs().subtract(3, 'month').startOf('month').toDate(); // 3 bulan lalu
    const CRRPeriodEnd = dayjs().endOf('month').toDate(); // akhir bulan ini

    const RPRPeriodStart = dayjs().startOf('month').toDate(); // awal bulan ini
    const RPRPeriodEnd = dayjs().endOf('month').toDate();

    // Pelanggan periode sebelumnya (bulan lalu)
    const previousPeriodStart = dayjs(CRRPeriodStart).subtract(1, 'month').startOf('month').toDate();
    const previousPeriodEnd = dayjs(CRRPeriodEnd).subtract(1, 'day').endOf('day').toDate();

    const existingCustomers = await prisma.orders.findMany({
      where: {
        DocDate: { gte: previousPeriodStart, lte: previousPeriodEnd },
        ...salesFilter
      },
      select: { CardCode: true },
      distinct: ['CardCode']
    });

    const activeCustomers = await prisma.orders.findMany({
      where: {
        DocDate: { gte: CRRPeriodStart, lte: CRRPeriodEnd },
        ...salesFilter
      },
      select: { CardCode: true },
      distinct: ['CardCode']
    });

    const existingSet = new Set(existingCustomers.map(c => c.CardCode));
    const retained = activeCustomers.filter(c => existingSet.has(c.CardCode));

    const CRR = existingCustomers.length === 0
      ? 0
      : (retained.length / existingCustomers.length) * 100;


    const rawRepeatCustomer = await prisma.orders.groupBy({
      by: ['CardCode'],
      where: {
        DocDate: { gte: RPRPeriodStart, lte: RPRPeriodEnd },
        ...salesFilter
      },
      _count: { CardCode: true }
    })

    const totalRepeatCustomers = rawRepeatCustomer.length
    const repeatCustomer = rawRepeatCustomer.filter(ro => ro._count.CardCode > 1).length

    const RPR = totalRepeatCustomers === 0 ? 0 : (repeatCustomer / totalRepeatCustomers) * 100


    // RFM
    const fromDate = dayjs().subtract(12, "month").toDate()

    const frmRaw = await prisma.customer_rfm.findMany({
      where: {
        lastCalculated: { gte: fromDate },
        ...salesFilter
      },
      select: {
        segment: true
      }
    })

    if (!frmRaw) return []

    const counts: Record<CustomerSegment, number> = {
      VIP: 0,
      LOYAL: 0,
      POTENTIAL: 0,
      AT_RISK: 0,
      LOST: 0
    }

    for (const r of frmRaw) {
      if (r.segment) counts[r.segment] += 1
    }
    const RFM = Object.entries(counts).map(([segment, count]) => ({ segment, count }))

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
