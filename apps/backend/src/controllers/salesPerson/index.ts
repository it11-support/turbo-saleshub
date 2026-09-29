import { IResSingle, ISalesPerson } from '@saleshub-tsm/types';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';
import { handleApiError } from '@/utils/apiResponse.js';
import { cacheGet, cacheSet } from '@/libs/cache.js';

const CACHE_TTL = 600
export const salesPersons = async (
  req: Request,
  res: Response<IResSingle<ISalesPerson>>
) => {
  try {
    const { withFilterUser } = req.query

    const withUser =
      String(withFilterUser) === '1' ||
      String(withFilterUser) === 'true'

    // =========================================
    // CACHE
    // =========================================
    const cacheKey =
      `saleshub:master:sales-persons:${withUser ? 'withUser' : 'all'}`

    const cached =
      await cacheGet<ISalesPerson[]>(cacheKey)

    if (cached) {
      return res.status(200).json({
        message: 'Sales person data fetched successfully',
        data: cached,
      })
    }

    // =========================================
    // SALES PERSONS
    // =========================================
    const salesPersons =
      await prisma.sales_persons.findMany({
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
      })

    const formattedSalesPersons =
      salesPersons.map(sp => ({
        ...sp,
        user: sp.user ?? undefined,
      }))

    // =========================================
    // CACHE SET
    // =========================================
    await cacheSet(
      cacheKey,
      formattedSalesPersons,
      CACHE_TTL
    )

    return res.status(200).json({
      message: 'Sales person data fetched successfully',
      data: formattedSalesPersons,
    })
  } catch (error) {
    return handleApiError(
      error,
      res,
      'Internal server error',
      []
    )
  }
}
