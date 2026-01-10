import dayjs from 'dayjs';
import prisma from '@/libs/prisma.js';
import { Request, Response } from 'express';

export const mtdSummary = async (req: Request, res: Response) => {
  try {
    const today = dayjs();
    const startCurrent = today.startOf('month').toDate();
    const endCurrent = today.toDate();
    const startLast = today.subtract(1, 'month').startOf('month').toDate();
    const endLast = today.subtract(1, 'month').date(today.date()).toDate();

    const { salesPersonId } = req.query;

    // Helper untuk hitung MTD (current + last)
    const calcMTD = (current: number, last: number) => {
      const diff = current - last;
      const growthPercent = last === 0 ? null : (diff / last) * 100;
      return { current, last, diff, growthPercent };
    };

    // =====================
    // REVENUE
    // =====================
    const revenueCurrent = await prisma.sales_invoices.aggregate({
      _sum: { TotalSales: true },
      where: {
        DocDate: {
          gte: startCurrent,
          lte: endCurrent,
        },
        ...(salesPersonId
          ? {
              customer: {
                sales_person: {
                  id: Number(salesPersonId),
                },
              },
            }
          : {}),
      },
    });

    const revenueLast = await prisma.sales_invoices.aggregate({
      _sum: { TotalSales: true },
      where: {
        DocDate: { gte: startLast, lte: endLast },
        ...(salesPersonId
          ? {
              customer: {
                sales_person: {
                  id: Number(salesPersonId),
                },
              },
            }
          : {}),
      },
    });

    const revenue = calcMTD(
      Number(revenueCurrent._sum.TotalSales || 0),
      Number(revenueLast._sum.TotalSales || 0)
    );

    // =====================
    // ORDERS → distinct DocNum
    // =====================
    const ordersCurrent = await prisma.orders.groupBy({
      by: ['DocNum'],
      where: {
        DocDate: { gte: startCurrent, lte: endCurrent },
        ...(salesPersonId
          ? {
              customer: {
                sales_person: {
                  id: Number(salesPersonId),
                },
              },
            }
          : {}),
      },
    });

    const ordersLast = await prisma.orders.groupBy({
      by: ['DocNum'],
      where: {
        DocDate: { gte: startLast, lte: endLast },
        ...(salesPersonId
          ? {
              customer: {
                sales_person: {
                  id: Number(salesPersonId),
                },
              },
            }
          : {}),
      },
    });

    const orders = calcMTD(ordersCurrent.length, ordersLast.length);

    // =====================
    // ACTIVE CUSTOMERS → distinct CardCode
    // =====================
    const customersCurrent = await prisma.sales_invoices.groupBy({
      by: ['CardCode'],
      where: {
        DocDate: { gte: startCurrent, lte: endCurrent },
        ...(salesPersonId
          ? {
              customer: {
                sales_person: {
                  id: Number(salesPersonId),
                },
              },
            }
          : {}),
      },
    });

    const customersLast = await prisma.sales_invoices.groupBy({
      by: ['CardCode'],
      where: {
        DocDate: { gte: startLast, lte: endLast },
        ...(salesPersonId
          ? {
              customer: {
                sales_person: {
                  id: Number(salesPersonId),
                },
              },
            }
          : {}),
      },
    });

    const customers = calcMTD(customersCurrent.length, customersLast.length);

    // =====================
    // AOV (AVERAGE ORDER VALUE)
    // =====================
    // AOV = Total Revenue / Total Orders

    const ordersCurrentCount = ordersCurrent.length;
    const ordersLastCount = ordersLast.length;

    const aovCurrent =
      ordersCurrentCount > 0
        ? ((revenueCurrent._sum.TotalSales ?? 0) as number) / ordersCurrentCount
        : 0;

    const aovLast =
      ordersLastCount > 0 ? ((revenueLast._sum.TotalSales ?? 0) as number) / ordersLastCount : 0;

    const aov = calcMTD(aovCurrent, aovLast);

    return res.status(200).json({
      message: 'Success',
      data: { revenue, orders, customers, aov },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
