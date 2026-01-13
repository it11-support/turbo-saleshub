import { ISalesPerson } from '@saleshub-tsm/types';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

export type SalsePersonResponseType = {
  message: string;
  data?: {
    salesPersons: ISalesPerson[];
  };
};
export const salesPersons = async (req: Request, res: Response<SalsePersonResponseType>) => {
  try {
    const { withFilterUser } = req.query;
    let where: any = {
      Active: 'Y',
      Locked: 'N',
      SlpCode: { gt: 0 },
    };

    const withUser = String(withFilterUser) === '1' || String(withFilterUser) === 'true';

    if (withUser) {
      where.user = null;
      where.customers = { some: {} };
    } else {
      where.user = { isNot: null };
      where.customers = { some: {} };
    }
    const salesPersons = await prisma.sales_persons.findMany({
      where,
      distinct: ['SlpCode'],
      include: { customers: true },
    });
    return res
      .status(200)
      .json({ message: 'Sales person data fetched successfully', data: { salesPersons } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
