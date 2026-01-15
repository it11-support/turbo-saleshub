import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { VisitStatus } from '@/generated/prisma/enums.js';
import { visitsWhereInput } from '@/generated/prisma/models.js';
import prisma from '@/libs/prisma.js';
import { convertToPrismaOrderBy, sortOptionsParser } from '@/utils/sortOptionsParser.js';

export const getScheduleList = async (req: Request, res: Response) => {
  try {
    const salesPersonId = Number(req.query.salesPersonId);
    const dates = req.query.dates as string[] | undefined;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const sort_options = req.query.sort_options as
      | { key: string; order: 'asc' | 'desc' }[]
      | undefined;

    const parsedSalesPersonId = Number(salesPersonId);

    const where: visitsWhereInput = {
      status: { in: [VisitStatus.Ongoing, VisitStatus.Completed] },
      visit_date: { not: null },
      ...(!Number.isNaN(parsedSalesPersonId)
        ? { sales_person_id: BigInt(parsedSalesPersonId) }
        : {}),
    };

    if (Array.isArray(dates)) {
      const [start, end] = dates;

      const dateFilters: any[] = [];

      if (start && dayjs(start).isValid()) {
        dateFilters.push({
          visit_date: { gte: dayjs(start).startOf('day').toDate() },
        });
      }

      if (end && dayjs(end).isValid()) {
        dateFilters.push({
          visit_date: { lte: dayjs(end).endOf('day').toDate() },
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
