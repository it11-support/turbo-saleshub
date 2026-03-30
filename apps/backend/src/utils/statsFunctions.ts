import dayjs from "dayjs";
import prisma from '@/libs/prisma.js'
import { Decimal } from "@prisma/client/runtime/client";

interface ICalcNetRevParams {
  DocNum: number
  TotalSales: Decimal | null
  returs?: {
    TotalSales: Decimal | null
  }[]
}
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

export const getCRR = async (salesFilter: any) => {
  const currentStart = dayjs().subtract(2, 'month').startOf('month').toDate();
  const currentEnd = dayjs().endOf('month').toDate();

  const baseStart = dayjs(currentStart).subtract(3, 'month').toDate();
  const baseEnd = dayjs(currentStart).subtract(1, 'day').endOf('day').toDate();

  const baseCustomers = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: { gte: baseStart, lte: baseEnd },
      ...salesFilter,
    },
  });

  const baseCodes = baseCustomers.map(c => c.CardCode);
  const S = baseCodes.length;

  if (S === 0) return 0;

  const retainedCount = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: { gte: currentStart, lte: currentEnd },
      CardCode: { in: baseCodes },
      ...salesFilter,
    },
  });

  const xretained = retainedCount.length;
  const xCRR = (xretained / S) * 100;

  return Number(xCRR.toFixed(2));
}


export const getRPR = async (salesFilter: any) => {
  const now = dayjs();
  const threeMonthStart = now.subtract(2, 'month').startOf('month').toDate();
  const threeMonthEnd = now.endOf('day').toDate();

  const rawRepeatCustomer = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: { gte: threeMonthStart, lte: threeMonthEnd },
      ...salesFilter,
    },
    _count: {
      DocNum: true
    },
  });

  const totalCustomers = rawRepeatCustomer.length;
  if (totalCustomers === 0) return 0;

  const repeatCustomersCount = rawRepeatCustomer.filter(
    (r) => Number(r._count.DocNum) >= 2
  ).length;

  const RPR = (repeatCustomersCount / totalCustomers) * 100;

  return Number(RPR.toFixed(2));
}

export const getRFM = async (salesFilter: any) => {
  const now = dayjs();
  const fromDate = now.startOf('month').toDate();

  const rfmGroups = await prisma.customer_rfm.groupBy({
    by: ['segment'],
    where: {
      lastCalculated: { gte: fromDate },
      ...salesFilter, // Pastikan salesFilter sesuai dengan kolom di customer_rfm
    },
    _count: {
      segment: true,
    },
  });

  // Struktur default agar segmen tetap urut dan muncul meski 0
  const defaultCounts: Record<string, number> = {
    VIP: 0,
    LOYAL: 0,
    POTENTIAL: 0,
    AT_RISK: 0,
    LOST: 0,
  };

  rfmGroups.forEach((group) => {
    const segmentName = group.segment?.toUpperCase();

    if (segmentName && Object.prototype.hasOwnProperty.call(defaultCounts, segmentName)) {
      defaultCounts[segmentName] = Number(group._count.segment);
    }
  });


  // Kembalikan dalam format Array agar mudah di-map di Frontend (misal untuk Chart)
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
