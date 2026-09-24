import { Request, Response } from 'express'
import prisma from '@/libs/prisma.js'
import {
  AuthenticatedRequest,
  VisitRuleRequestType,
} from '@saleshub-tsm/types'
import { activityLogger } from '@/services/logs/index.js'
import { handleApiError } from '@/utils/apiResponse.js'
import {
  cacheDeletePattern,
  cacheGet,
  cacheSet,
} from '@/libs/cache.js'

// =====================================================
// CACHE INVALIDATION
// =====================================================

export const invalidateVisitRuleCache = async () => {
  await Promise.all([
    cacheDeletePattern(
      'saleshub:visit-rules:*'
    ),
    cacheDeletePattern(
      'saleshub:schedule-list:*'
    ),
  ])
}

// =====================================================
// CREATE VISIT RULE
// =====================================================

export const createVisitRules = async (
  req: AuthenticatedRequest<
    {},
    VisitRuleRequestType
  >,
  res: Response
) => {
  try {
    const {
      sales_person_id,
      customer_id,
      day_of_week,
      max_items_per_visit,
      visit_weeks,
    } = req.body

    const existing =
      await prisma.sales_visit_rules.findFirst({
        where: {
          sales_person_id,
          customer_id,
          day_of_week,
        },
      })

    if (existing) {
      activityLogger({
        req,
        actionType: 'Visit Rule',
        description:
          'Rule with same sales_id, customer_id and day_of_week already exists.',
        status: 'FAILED',
      })

      throw new Error(
        'Rule with same sales_id, customer_id and day_of_week already exists.'
      )
    }

    const visit_rule =
      await prisma.sales_visit_rules.create({
        data: {
          sales_person_id,
          customer_id,
          day_of_week,
          visit_weeks,
          max_items_per_visit,
        },

        include: {
          salesPerson: true,
          customer: true,
        },
      })

    // DB sudah berhasil → cache lama tidak valid
    await invalidateVisitRuleCache()

    activityLogger({
      req,
      actionType: 'Visit Rule',
      description:
        'Visit rule created successfully.',
      status: 'SUCCESS',
    })

    return res.status(200).json({
      message: 'Success',
      data: {
        visit_rule,
      },
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}

// =====================================================
// GET VISIT RULES
// =====================================================

export const visitRules = async (
  req: Request,
  res: Response
) => {
  try {
    const { sales_person_id } = req.query

    let salesPersonId: number | undefined

    if (sales_person_id) {
      salesPersonId =
        Number(sales_person_id)

      if (
        !Number.isInteger(salesPersonId) ||
        salesPersonId <= 0
      ) {
        return res.status(400).json({
          message:
            'Invalid sales person ID',
        })
      }
    }

    // ---------------------------------
    // CACHE KEY
    // ---------------------------------

    const cacheKey =
      salesPersonId !== undefined
        ? `saleshub:visit-rules:sales:${salesPersonId}`
        : 'saleshub:visit-rules:all'

    const cached =
      await cacheGet(cacheKey)

    if (cached) {
      return res.status(200).json({
        message: 'Success',
        data: cached,
      })
    }

    // ---------------------------------
    // DATABASE
    // ---------------------------------

    const visit_rules =
      await prisma.sales_visit_rules.findMany({
        where:
          salesPersonId !== undefined
            ? {
              sales_person_id:
                salesPersonId,
            }
            : {},

        include: {
          salesPerson: true,

          customer: {
            include: {
              sales_visit_rules: true,
            },
          },
        },

        orderBy: {
          created_at: 'desc',
        },
      })

    // ---------------------------------
    // CACHE 30 MINUTES
    // ---------------------------------

    await cacheSet(
      cacheKey,
      visit_rules,
      1800
    )

    return res.status(200).json({
      message: 'Success',
      data: visit_rules,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}

// =====================================================
// SYNC VISIT RULES
// =====================================================

export const syncVisitRules = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      sales_person_id,
      dayFilter,
      data,
    } = req.body

    const spId =
      Number(sales_person_id)

    if (
      !Number.isInteger(spId) ||
      spId <= 0
    ) {
      return res.status(400).json({
        message:
          'Invalid sales person ID',
      })
    }

    if (
      !data ||
      typeof data !== 'object'
    ) {
      return res.status(400).json({
        message:
          'Invalid visit rule data',
      })
    }

    // ---------------------------------
    // TRANSACTION
    // ---------------------------------

    await prisma.$transaction(
      async (tx) => {
        for (
          const [cid, weeksArr]
          of Object.entries(data)
        ) {
          const customerId =
            Number(cid)

          if (
            !Number.isInteger(customerId) ||
            customerId <= 0
          ) {
            continue
          }

          const weeks =
            (weeksArr as boolean[])
              .map(
                (value, index) =>
                  value
                    ? index + 1
                    : null
              )
              .filter(
                (value):
                  value is number =>
                  value !== null
              )

          // =========================
          // EMPTY → DELETE RULE
          // =========================

          if (weeks.length === 0) {
            await tx.sales_visit_rules
              .deleteMany({
                where: {
                  sales_person_id:
                    spId,

                  customer_id:
                    customerId,

                  day_of_week:
                    dayFilter,
                },
              })

            continue
          }

          // =========================
          // EXISTING RULE
          // =========================

          const existing =
            await tx.sales_visit_rules
              .findFirst({
                where: {
                  sales_person_id:
                    spId,

                  customer_id:
                    customerId,

                  day_of_week:
                    dayFilter,
                },
              })

          if (existing) {
            await tx.sales_visit_rules
              .update({
                where: {
                  id: existing.id,
                },

                data: {
                  visit_weeks:
                    weeks,

                  updated_at:
                    new Date(),
                },
              })
          } else {
            // =========================
            // CREATE RULE
            // =========================

            await tx.sales_visit_rules
              .create({
                data: {
                  sales_person_id:
                    spId,

                  customer_id:
                    customerId,

                  day_of_week:
                    dayFilter,

                  visit_weeks:
                    weeks,

                  active:
                    true,

                  max_items_per_visit:
                    15,

                  created_at:
                    new Date(),
                },
              })
          }
        }
      }
    )

    // Transaction sukses.
    // Baru invalidasi cache.
    await invalidateVisitRuleCache()

    activityLogger({
      req,
      actionType: 'Visit Rule',
      description:
        'Visit rule synced successfully.',
      status: 'SUCCESS',
    })

    return res.status(200).json({
      message: 'Success',
      ok: true,
    })
  } catch (error) {
    activityLogger({
      req,
      actionType: 'Visit Rule',
      description:
        'Failed to sync visit rules.',
      status: 'FAILED',
    })

    return handleApiError(
      error,
      res
    )
  }
}
