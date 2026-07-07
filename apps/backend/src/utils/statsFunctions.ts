import dayjs from "dayjs";
import prisma from '@/libs/prisma.js'
import { CustomerInsightPeriod, ICalcNetRevParams } from "@saleshub-tsm/types";
import { CUSTOMER_INSIGHT_PERIODS } from "@/constants/index.js";

export const calcMTD = (current: number, last: number) => {
  const growth = ((current - last) / last) * 100
  const diff = current - last
  return {
    current,
    last,
    diff,
    growthPercent: parseFloat(growth.toFixed(2)) // Dibulatkan agar rapi
  };
}


export const getMtdDates = () => {
  const now = dayjs()
  const mtdStart = now.startOf('month').toDate()
  const mtdEnd = now.toDate()
  const prevMtdStart = now.subtract(1, 'month').startOf('month').toDate()
  const prevMtdEnd = now.subtract(1, 'month').date(now.date()).toDate()

  return {
    mtdStart,
    mtdEnd,
    prevMtdStart,
    prevMtdEnd
  }
}

export const getCRR = async (
  salesFilter: any,
  period: CustomerInsightPeriod,
) => {
  const currentEnd = dayjs().endOf('month');

  const currentStart = currentEnd
    .subtract(period - 1, 'month')
    .startOf('month');

  const baseEnd = currentStart
    .subtract(1, 'day')
    .endOf('day');

  const baseStart = baseEnd
    .subtract(period - 1, 'month')
    .startOf('month');

  const baseCustomers = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: {
        gte: baseStart.toDate(),
        lte: baseEnd.toDate(),
      },
      ...salesFilter,
    },
  });

  const baseCodes = baseCustomers.map(c => c.CardCode);

  if (!baseCodes.length) {
    return {
      retention: 0,
      baseCustomers: 0,
      retainedCustomers: 0,
    };
  }

  const retainedCustomers = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: {
        gte: currentStart.toDate(),
        lte: currentEnd.toDate(),
      },
      CardCode: {
        in: baseCodes,
      },
      ...salesFilter,
    },
  });

  return {
    retention: Number(
      ((retainedCustomers.length / baseCodes.length) * 100).toFixed(2),
    ),
    baseCustomers: baseCodes.length,
    retainedCustomers: retainedCustomers.length,
  };
};


export const getRFM = async (
  salesFilter: any,
  periodMonth: typeof CUSTOMER_INSIGHT_PERIODS[number] = 1
) => {
  const rfmGroups = await prisma.customer_rfm.groupBy({
    by: ['segment'],
    where: {
      period_month: periodMonth,
      ...salesFilter,
    },
    _count: {
      segment: true,
    },
  });

  const defaultCounts: Record<string, number> = {
    VIP: 0,
    LOYAL: 0,
    POTENTIAL: 0,
    AT_RISK: 0,
    LOST: 0,
  };

  rfmGroups.forEach((group) => {
    if (group.segment) {
      defaultCounts[group.segment] = Number(group._count.segment);
    }
  });

  return Object.entries(defaultCounts).map(([segment, count]) => ({
    segment,
    count,
  }));
};


export const calcNetRevenue = (invoices: ICalcNetRevParams[]) => {
  return invoices.reduce((sum, inv) => {

    const sales = Number(inv.TotalSales ?? 0)

    const retur = inv.returs?.reduce(
      (r, x) => r + Number(x.TotalSales ?? 0),
      0
    ) ?? 0

    return sum + (sales - retur)

  }, 0)
}

export const calcGrowth = (current: number, previous: number): number => {
  if (!previous) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
