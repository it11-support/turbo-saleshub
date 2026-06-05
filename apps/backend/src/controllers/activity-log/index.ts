import { user_activityWhereInput } from "@/generated/prisma/models.js";
import prisma from "@/libs/prisma.js";
import { convertToPrismaOrderBy, sortOptionsParser } from "@/utils/sortOptionsParser.js";
import dayjs from "dayjs";
import { Request, Response } from "express";

interface FetchActivityLogsQuery {
  page: number;
  per_page: number;
  search?: string;
  salesPersonId: number | null;
  type: string | null;
  dates?: string[];
  sort: string | null;
  order: string | null;
}

export const fetchActivityLogs = async (req: Request<{}, {}, {}, FetchActivityLogsQuery>, res: Response) => {
  try {
    const { page, per_page, search, salesPersonId, type, dates, sort, order } = req.query

    const sort_options = sort
      ? [{ key: sort, order: Number(order) === 1 ? 'asc' : 'desc' }]
      : [{ key: 'created_at', order: 'desc' }]

    const where: user_activityWhereInput = {
      ...(salesPersonId ? { user: { sales_person_id: salesPersonId } } : {}),
      ...(type ? { action_type: type } : {}),
      ...(search
        ? {
          OR: [
            {
              user: {
                username: { contains: search },
              },
            },
            {
              user: {
                email: { contains: search },
              },
            },
            {
              description: { contains: search },
            },
            {
              user: {
                sales_person: {
                  SlpName: { contains: search },
                },
              },
            },
          ],
        }
        : {}),
    }

    if (Array.isArray(dates)) {
      const [start, end] = dates;

      const dateFilters: any[] = [];

      if (start && dayjs(start).isValid()) {
        dateFilters.push({
          created_at: { gte: dayjs(start).startOf('day').toISOString() },
        });
      }

      if (end && dayjs(end).isValid()) {
        dateFilters.push({
          created_at: { lte: dayjs(end).endOf('day').toISOString() },
        });
      }

      if (dateFilters.length) {
        where.AND = dateFilters;
      }
    }

    const sortOptions = sortOptionsParser(sort_options);
    const orderBy = convertToPrismaOrderBy(sortOptions);

    const [activityLogs, meta] = await prisma.user_activity
      .paginate({
        where,
        include: {
          user: {
            include: {
              sales_person: true
            }
          },
        },
        orderBy,
      })
      .withPages({
        page: Number(page),
        limit: Number(per_page),
        includePageCount: true,
      });

    const result = {
      data: {
        items: activityLogs,
        totalRecords: meta.totalCount,
        currentPage: page,
        perPage: per_page,
        totalPages: meta.pageCount
      }
    }

    res.status(200).json({ message: 'Success', ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const fetchActivityActionTypes = async (req: Request, res: Response) => {
  try {
    const activityActionTypes = await prisma.user_activity.findMany({
      select: {
        action_type: true,
      },
      distinct: ['action_type'],
    });
    res.status(200).json({ message: 'Activity action types fetched successfully', data: activityActionTypes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
