import { IResSingle, ISalesPerson } from '@saleshub-tsm/types';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

export const salesPersons = async (req: Request, res: Response<IResSingle<ISalesPerson>>) => {
  try {
    const { withFilterUser } = req.query;

    const withUser =
      String(withFilterUser) === '1' || String(withFilterUser) === 'true';

    const salesPersons = await prisma.sales_persons.findMany({
      where: {
        Active: 'Y',
        Locked: 'N',
        SlpCode: { gt: 0 },

        ...(withUser && {
          user: null,
        }),
      },

      include: {
        user: true,
        customers: true,
      },

      distinct: ['SlpCode'],
    });

    const formattedSalesPersons = salesPersons.map(sp => ({
      ...sp,
      user: sp.user ?? undefined,
    }));

    return res
      .status(200)
      .json({ message: 'Sales person data fetched successfully', data: formattedSalesPersons });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', data: []});
  }
};
