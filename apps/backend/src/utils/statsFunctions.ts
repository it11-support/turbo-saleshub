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
  const baseStart = dayjs().subtract(3, 'month').startOf('month').toDate();
  const endPeriod = dayjs().endOf('month').toDate();

  const xbaseCustomers = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: {
        gte: dayjs(baseStart).subtract(1, 'year').toDate(),
        lt: baseStart
      },
      ...salesFilter,
    },
  });

  const activeInPeriod = await prisma.orders.groupBy({
    by: ['CardCode'],
    where: {
      DocDate: { gte: baseStart, lte: endPeriod },
      ...salesFilter,
    },
  });


  const S = xbaseCustomers.length;

  const xbaseSet = new Set(xbaseCustomers.map(c => c.CardCode));

  const xretained = activeInPeriod.filter(c => xbaseSet.has(c.CardCode)).length;

  const xCRR = S === 0 ? 0 : (xretained / S) * 100;

  return xCRR
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

  const repeatCustomersCount = rawRepeatCustomer.filter(
    (r) => r._count.DocNum >= 2
  ).length;

  const RPR = totalCustomers === 0
    ? 0
    : parseFloat(((repeatCustomersCount / totalCustomers) * 100).toFixed(2));

  return RPR;
};

export const getRFM = async (salesFilter: any) => {
  const now = dayjs();

  // 1. Ambil snapshot bulan berjalan saja (MTD)
  // Ini mencegah satu user terhitung berkali-kali jika ada history di tabel RFM
  const fromDate = now.startOf('month').toDate();

  // 2. Gunakan groupBy agar DB yang menghitung (Jauh lebih cepat dari .findMany + loop)
  const rfmGroups = await prisma.customer_rfm.groupBy({
    by: ['segment'],
    where: {
      lastCalculated: { gte: fromDate },
      ...salesFilter,
    },
    _count: {
      segment: true,
    },
  });

  // 3. Inisialisasi struktur default (agar segmen yang 0 tetap muncul)
  const defaultCounts: Record<string, number> = {
    VIP: 0,
    LOYAL: 0,
    POTENTIAL: 0,
    AT_RISK: 0,
    LOST: 0,
  };

  // 4. Masukkan hasil dari DB ke dalam struktur default
  rfmGroups.forEach((group) => {
    if (group.segment && defaultCounts[group.segment] !== undefined) {
      defaultCounts[group.segment] = group._count.segment;
    }
  });

  // 5. Format return (konsisten sesuai permintaan Anda)
  const RFM = Object.keys(defaultCounts).map((key) => ({
    segment: key,
    count: defaultCounts[key],
  }));

  return RFM;
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
