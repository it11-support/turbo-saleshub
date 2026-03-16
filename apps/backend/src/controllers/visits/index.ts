import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { VisitStatus } from '@/generated/prisma/enums.js';
import { visitsWhereInput } from '@/generated/prisma/models.js';
import prisma from '@/libs/prisma.js';
import { convertToPrismaOrderBy, sortOptionsParser } from '@/utils/sortOptionsParser.js';

export const getScheduleList = async (req: Request, res: Response) => {
  try {
    const salesPersonId = Number(req.query.salesPersonId);
    const status = req.query.status as undefined | VisitStatus;
    const dates = req.query.dates as string[] | undefined;
    const page = Number(req.query.page || 1);
    const needFollowUp = req.query.needFollowUp === 'true';
    const limit = Number(req.query.limit || 20);
    const sort_options = req.query.sort_options as
      | { key: string; order: 'asc' | 'desc' }[]
      | undefined;

    const parsedSalesPersonId = Number(salesPersonId);

    const where: visitsWhereInput = {
      visit_date: { not: null },
      ...(!Number.isNaN(parsedSalesPersonId)
        ? { sales_person_id: BigInt(parsedSalesPersonId) }
        : {}),
      ...(status ? { status } : {
        status: {
          in: [VisitStatus.Ongoing, VisitStatus.Completed, VisitStatus.Missed]
        }
      }),
      ...(needFollowUp ? {
        status: {
          in: [VisitStatus.Completed]
        },
        visit_items: {
          some: {
            visit_item_concerns: {
              some: {
                status: {
                  status: {
                    in: ['Pending', 'Follow Up']
                  }
                }
              }
            }
          }
        }
      } : {})
    };

    if (Array.isArray(dates)) {
      const [start, end] = dates;

      const dateFilters: any[] = [];

      if (start && dayjs(start).isValid()) {
        dateFilters.push({
          visit_date: { gte: dayjs(start).startOf('day').toISOString() },
        });
      }

      if (end && dayjs(end).isValid()) {
        dateFilters.push({
          visit_date: { lte: dayjs(end).endOf('day').toISOString() },
        });
      }

      if (dateFilters.length) {
        where.AND = dateFilters;
      }
    }

    const sortOprtions = sortOptionsParser(sort_options || []);
    const orderBy = convertToPrismaOrderBy(sortOprtions);

    const [data, total] = await prisma.$transaction([
      prisma.visits.findMany({
        where,
        include: {
          visit_items: {
            include: {
              product: true,
            },
          },
          customer: {
            include: {
              subgroup: true,
              sales_visit_rules: {
                where: {
                  ...(!Number.isNaN(parsedSalesPersonId) && { sales_person_id: salesPersonId }),
                  active: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visits.count({
        where,
      }),
    ]);

    const result = data.map((visit) => ({
      id: visit.id,
      sales_person_id: visit.sales_person_id,
      customer_id: visit.customer_id,
      visit_date: visit.visit_date,
      status: visit.status,
      is_virtual: false,
      max_items_per_visit: visit.customer.sales_visit_rules[0]?.max_items_per_visit ?? null,
      visits: visit,
    }));

    return res.status(200).json({
      message: 'Success',
      data: {
        data: result,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const exportVisits = async (req: Request, res: Response) => {
  let dates = req.query.dates as string[] | undefined;
  let salesPersonId = req.query.salesPersonId as string | undefined;

  try {
    // Normalisasi dates
    if (!dates) dates = [];
    else if (!Array.isArray(dates)) dates = [dates];

    const [start, end] = dates;

    // Validasi ketat
    const isStartValid =
      typeof start === 'string' &&
      start.trim() !== '' &&
      dayjs(start).isValid();

    const isEndValid =
      typeof end === 'string' &&
      end.trim() !== '' &&
      dayjs(end).isValid();

    // Convert salesPersonId ke BigInt (AMAN)
    const salesId = salesPersonId
      ? BigInt(salesPersonId)
      : undefined;

    // Build where condition
    const where: visitsWhereInput = {
      ...(salesId && { sales_person_id: salesId }),

      ...(isStartValid && !isEndValid && {
        visit_date: dayjs(start).format('YYYY-MM-DD'),
      }),

      ...(isStartValid && isEndValid && {
        visit_date: {
          gte: dayjs(start).format('YYYY-MM-DD'),
          lte: dayjs(end).format('YYYY-MM-DD'),
        },
      }),
    };

    // Query
    const visitItems = await prisma.visit_items.findMany({
      where: {
        visit: where,
      },
      include: {
        product: true,
        visit: {
          include: {
            customer: true,
            salesPerson: true,
          },
        },
      },
    });

    // Grouping by product_id
    const data = visitItems.reduce((acc, item) => {
      const key = Number(item.product_id);

      if (!acc[key]) acc[key] = [];

      acc[key].push({
        ...item,

        // convert bigint → string (biar JSON aman)
        id: item.id.toString(),
        visit_id: item.visit_id.toString(),
      });

      return acc;
    }, {} as Record<number, any[]>);

    return res.status(200).json({
      message: 'Success',
      data,
    });
  } catch (error) {
    console.error('EXPORT ERROR:', error);

    return res.status(500).json({
      message: 'Export failed',
    });
  }
};
