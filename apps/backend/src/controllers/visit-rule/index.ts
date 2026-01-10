import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type VisitRuleRequestType = {
  sales_person_id: number;
  customer_id: number;
  day_of_week: DayOfWeek;
  visit_weeks: number[];
  max_items_per_visit: number;
};

export const createVisitRules = async (
  req: Request<{}, {}, VisitRuleRequestType>,
  res: Response
) => {
  try {
    const { sales_person_id, customer_id, day_of_week, max_items_per_visit, visit_weeks } =
      req.body;
    const existing = await prisma.sales_visit_rules.findFirst({
      where: {
        sales_person_id: sales_person_id,
        customer_id: customer_id,
        day_of_week: day_of_week,
      },
    });

    if (existing) {
      throw new Error('Rule with same sales_id, customer_id and day_of_week already exists.');
    }

    const visit_rule = await prisma.sales_visit_rules.create({
      data: {
        sales_person_id: sales_person_id,
        customer_id: customer_id,
        day_of_week: day_of_week,
        visit_weeks: visit_weeks,
        max_items_per_visit: max_items_per_visit,
      },
      include: {
        salesPerson: true,
        customer: true,
      },
    });

    return res.status(200).json({ message: 'Success', data: { visit_rule } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const visitRules = async (req: Request, res: Response) => {
  try {
    const { sales_person_id } = req.query;

    let where = {};

    if (sales_person_id) {
      where = {
        sales_person_id: Number(sales_person_id),
      };
    }
    const visit_rules = await prisma.sales_visit_rules.findMany({
      where,
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
    });

    return res.status(200).json({ message: 'Success', data: { visit_rules } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const syncVisitRules = async (req: Request, res: Response) => {
  const { sales_person_id, dayFilter, data } = req.body;
  const spId = Number(sales_person_id);

  await prisma.$transaction(async (tx) => {
    for (const [cid, weeksArr] of Object.entries(data)) {
      const customerId = Number(cid);

      const weeks = (weeksArr as boolean[])
        .map((v, i) => (v ? i + 1 : null))
        .filter(Boolean) as number[];

      // Default → hapus rule
      if (!weeks.length || (weeks.length === 1 && weeks[0] === 0)) {
        await tx.sales_visit_rules.deleteMany({
          where: {
            sales_person_id: spId,
            customer_id: customerId,
            day_of_week: dayFilter,
          },
        });
        continue;
      }

      const existing = await tx.sales_visit_rules.findFirst({
        where: {
          sales_person_id: spId,
          customer_id: customerId,
          day_of_week: dayFilter,
        },
      });

      if (existing) {
        await tx.sales_visit_rules.update({
          where: { id: existing.id },
          data: {
            visit_weeks: weeks,
            updated_at: new Date(),
          },
        });
      } else {
        await tx.sales_visit_rules.create({
          data: {
            sales_person_id: spId,
            customer_id: customerId,
            day_of_week: dayFilter,
            visit_weeks: weeks,
            active: true,
            max_items_per_visit: 15,
            created_at: new Date(),
          },
        });
      }
    }
  });

  return res.json({ ok: true });
};
