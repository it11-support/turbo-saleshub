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

    // const calcMTD = (current: number, last: number) => {
    //   const diff = current - last
    //   const growthPercent = last === 0 ? null : (diff / last) * 100
    //   return { current, last, diff, growthPercent }
    // }

    const calcMTD = (current: number, last: number) => {
      const today = new Date();

      // 1. Ambil jumlah hari yang sudah berjalan di bulan ini (misal: tanggal 4)
      const currentDayCount = today.getDate();

      // 2. Ambil total hari di bulan sebelumnya (misal: Februari = 28)
      const prevDayCount = new Date(today.getFullYear(), today.getMonth(), 0).getDate();

      // 3. Hitung rata-rata harian
      const currentAvg = current / currentDayCount;
      const lastAvg = last / prevDayCount;

      // 4. Hitung selisih dan persentase pertumbuhan rata-rata
      const diff = currentAvg - lastAvg;

      // Hindari pembagian dengan nol jika data bulan lalu kosong
      const growthPercent = lastAvg === 0 ? 0 : (diff / lastAvg) * 100;

      return {
        current,
        last,
        diff,
        growthPercent: parseFloat(growthPercent.toFixed(2)) // Dibulatkan agar rapi
      };
    }

    // =====================
    // REVENUE
    // =====================
    const [revenueCurrent, returCurrent, revenueLast, returLast] = await Promise.all([
      prisma.sales_invoices.aggregate({
        _sum: { TotalSales: true },
        where: {
          DocDate: { gte: mtdStart, lte: mtdEnd },
          ...salesFilter,
        },
      }),
      prisma.retur_invoices.aggregate({
        _sum: {
          TotalSales: true,
        },
        where: {
          sales: {
            DocDate: {
              gte: mtdStart,
              lte: mtdEnd,
            }
          },
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

      prisma.retur_invoices.aggregate({
        _sum: { TotalSales: true },
        where: {
          sales: {
            DocDate: {
              gte: now.subtract(1, 'month').startOf('month').toDate(),
              lte: now.subtract(1, 'month').date(now.date()).toDate(),
            },
          },
          ...salesFilter
        },
      }),

    ])

    const totalRevCurrent = Number(revenueCurrent._sum.TotalSales || 0) + Number(returCurrent._sum.TotalSales || 0)
    const totalRevLast = Number(revenueLast._sum.TotalSales || 0) + Number(returLast._sum.TotalSales || 0)

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
        ?  (Number(revenueCurrent._sum.TotalSales || 0) + Number(returCurrent._sum.TotalSales || 0)) / ordersCurrent.length
        : 0,
      ordersLast.length
        ? (Number(revenueLast._sum.TotalSales || 0) + Number(returLast._sum.TotalSales || 0)) / ordersLast.length
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
        returs: {
          select: {
            TotalSales: true,
          },
        }
      },
    })

    const revenueByMonth = revenueTrendRaw.reduce<Record<string, number>>(
      (acc, cur) => {
        if (!cur.DocDate) return acc

        const period = dayjs(cur.DocDate).format('YYYY-MM')

        const sales = Number(cur.TotalSales ?? 0)

        const retur = cur.returs.reduce(
          (sum, r) => sum + Number(r.TotalSales ?? 0),
          0
        )

        const net = sales + retur

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
        returs: {
          select: {
            TotalSales: true,
          },
        }
      },
    })

    // Group by month
    const aovMap = aovTrendRaw.reduce<Record<string, { totalSales: number; orders: Set<number> }>>((acc, cur) => {
      if (!cur.DocDate || !cur.DocNum) return acc

      const period = dayjs(cur.DocDate).format('YYYY-MM')

      if (!acc[period]) {
        acc[period] = {
          totalSales: 0,
          orders: new Set<number>(),
        }
      }

      const sales = Number(cur.TotalSales ?? 0)

      const retur = cur.returs.reduce(
        (sum, r) => sum + Number(r.TotalSales ?? 0),
        0
      )

      const netSales = sales + retur

      acc[period].totalSales += netSales
      acc[period].orders.add(cur.DocNum)

      return acc
    }, {})


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
        returs: true
      },
    })
    const revenueBySales: Record<string, number> = {}

    invoices.forEach(inv => {
      const slp = inv.customer?.sales_person?.SlpName ?? 'Unknown'

      // Total invoice + total retur
      const totalRetur = inv.returs?.reduce((sum, r) => sum + Number(r.TotalSales ?? 0), 0) ?? 0
      const totalInvoice = Number(inv.TotalSales ?? 0)

      revenueBySales[slp] = (revenueBySales[slp] ?? 0) + totalInvoice + totalRetur
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
      select: { CardCode: true, returs: true },
    })

    const invoicesBefore = await prisma.sales_invoices.findMany({
      where: {
        DocDate: { lt: monthStart },
        ...salesFilter
      },
      select: { CardCode: true, returs: true },
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
    const baseStart = dayjs().subtract(3, 'month').startOf('month').toDate();
    const baseEnd = dayjs().subtract(3, 'month').endOf('month').toDate();

    const currentStart = dayjs().startOf('month').toDate();
    const currentEnd = dayjs().endOf('month').toDate();

    const baseCustomers = await prisma.orders.findMany({
      where: {
        DocDate: { gte: baseStart, lte: baseEnd },
        ...salesFilter,
      },
      distinct: ['CardCode'],
      select: { CardCode: true },
    });

    const currentCustomersCRR = await prisma.orders.findMany({
      where: {
        DocDate: { gte: currentStart, lte: currentEnd },
        ...salesFilter,
      },
      distinct: ['CardCode'],
      select: { CardCode: true },
    });

    const baseSet = new Set(baseCustomers.map(c => c.CardCode));

    const retained = currentCustomersCRR.filter(c =>
      baseSet.has(c.CardCode)
    );

    const CRR =
      baseCustomers.length === 0
        ? 0
        : (retained.length / baseCustomers.length) * 100;


    // ========== RPR ==========
    const threeMonthStart = dayjs()
      .subtract(2, 'month')
      .startOf('month')
      .toDate();

    const threeMonthEnd = dayjs()
      .endOf('month')
      .toDate();

    const rawRepeatCustomer = await prisma.orders.groupBy({
      by: ['CardCode'],
      where: {
        DocDate: { gte: threeMonthStart, lte: threeMonthEnd },
        ...salesFilter,
      },
      _count: { CardCode: true },
    });

    const totalCustomers = rawRepeatCustomer.length;

    const repeatCustomers = rawRepeatCustomer.filter(
      r => r._count.CardCode >= 2
    ).length;

    const RPR =
      totalCustomers === 0
        ? 0
        : (repeatCustomers / totalCustomers) * 100;



    // RFM
    const fromDate = dayjs()
      .subtract(3, "month")
      .startOf("month")
      .toDate()

    const frmRaw = await prisma.customer_rfm.findMany({
      where: {
        lastCalculated: {
          gte: fromDate
        },
        ...salesFilter
      },
      select: {
        segment: true
      }
    })

    const counts: Record<CustomerSegment, number> = {
      VIP: 0,
      LOYAL: 0,
      POTENTIAL: 0,
      AT_RISK: 0,
      LOST: 0
    }

    // Hitung
    for (const r of frmRaw) {
      if (r.segment && counts[r.segment] !== undefined) {
        counts[r.segment]++
      }
    }

    // Format return (konsisten)
    const RFM = Object.keys(counts).map((key) => ({
      segment: key as CustomerSegment,
      count: counts[key as CustomerSegment]
    }))



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
