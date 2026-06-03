import { PER_PAGE } from "@/constants/index.js";
import { visitsWhereInput } from "@/generated/prisma/models.js";
import prisma from "@/libs/prisma.js";
import { convertToPrismaOrderBy, sortOptionsParser } from "@/utils/sortOptionsParser.js";
import dayjs from "dayjs";
import { Request, Response } from "express";

export const fetchVisitsWithFollowUps = async (req: Request, res: Response) => {
  try {
    const { per_page = PER_PAGE, page = 1, sort, order } = req.query;
    const salesPersonId = Number(req.query.salesPersonId) || null;

    const sort_options = [{ key: sort, order: Number(order) === 1 ? 'asc' : 'desc' }];
    const dates = req.query.dates as string[] | undefined;

    const sortOptions = sortOptionsParser(sort_options);
    const orderBy = convertToPrismaOrderBy(sortOptions);

    const where: visitsWhereInput = {
      visit_items: {
        some: {
          visit_item_concerns: {
            some: {
              OR: [
                { status: { status: { notIn: ['Done', 'Closed'] } } },
                { follow_ups: { some: { concern_status: { status: { notIn: ['Done', 'Closed'] } } } } }
              ]
            }
          }
        }
      },
      ...(salesPersonId ? { salesPerson: { id: salesPersonId } } : {}),
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

    const [visitsWithFollowUps, meta] = await prisma.visits
      .paginate({
        where,
        orderBy,
        include: {
          customer: { include: { sales_visit_rules: true } },
          salesPerson: true,
          visit_items: {
            include: {
              product: true,
              visit_item_concerns: {
                include: {
                  status: true,
                  follow_ups: {
                    orderBy: { created_at: 'desc' },
                    include: {
                      concern_status: true
                    }
                  }
                }
              }
            }
          }
        }
      })
      .withPages({
        limit: Number(per_page),
        page: Number(page),
        includePageCount: true,
      });

    const excludedStatuses = ['Done', 'Closed'];

    const result = visitsWithFollowUps
      .map((visit) => {
        let totalOpenIssuesForThisVisit = 0;

        const mappedVisitItems = visit.visit_items.map((item) => {
          item.visit_item_concerns.forEach((concern) => {
            const followUps = concern.follow_ups;
            const latestStatus = (followUps && followUps.length > 0)
              ? followUps[0]?.concern_status?.status
              : concern.status?.status;

            if (latestStatus && !excludedStatuses.includes(latestStatus)) {
              totalOpenIssuesForThisVisit++;
            }
          });
          return item;
        });

        return {
          ...visit,
          visit_items: mappedVisitItems,
          openIssuesCount: totalOpenIssuesForThisVisit,
        };
      })

      .filter((visit) => visit.openIssuesCount > 0)
      .map((visit) => ({
        id: visit.id,
        sales_person_id: visit.sales_person_id,
        customer_id: visit.customer_id,
        visit_date: visit.visit_date,
        status: visit.status,
        is_virtual: false,
        max_items_per_visit: visit.customer.sales_visit_rules[0]?.max_items_per_visit ?? null,
        visits: visit,
      }));

    res.status(200).json({
      message: 'Visit with follow up fetched successfully',
      data: {
        items: result,
        totalRecords: meta.totalCount ?? 0,
        currentPage: meta.currentPage,
        perPage: Number(per_page),
        totalPages: meta.pageCount ?? 1,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', data: { items: [], totalRecords: 0 } });
  }
};
