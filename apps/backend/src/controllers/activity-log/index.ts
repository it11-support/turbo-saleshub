import { user_activityWhereInput } from "@/generated/prisma/models.js";
import prisma from "@/libs/prisma.js";
import dayjs from "dayjs";
import { Request, Response } from "express";
import { handleApiError, buildSuccessResponse } from "@/utils/apiResponse.js";
import { getPaginatedQuery } from "@/utils/pagination.js";

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
    const q = req.query

    const { page, perPage, orderBy, search } = getPaginatedQuery(req)

    const salesPersonId: number | null = q.salesPersonId && !isNaN(Number(q.salesPersonId))
      ? Number(q.salesPersonId)
      : null;

    const type: string | null = typeof q.type === 'string' ? q.type : null;

    let dates: string[] | undefined = undefined;
    if (Array.isArray(q.dates)) {
      dates = q.dates.map(d => String(d));
    } else if (typeof q.dates === 'string') {
      dates = [q.dates];
    }

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
        limit: Number(perPage),
        includePageCount: true,
      })

    buildSuccessResponse(res, activityLogs, page, perPage, meta.totalCount)
  } catch (error) {
    return handleApiError(error, res)
  }
}


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
    return handleApiError(error, res)
  }
}
