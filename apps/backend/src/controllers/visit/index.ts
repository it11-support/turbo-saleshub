import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

import { VisitStatus } from '@/generated/prisma/enums.js';
import { formatDate } from 'date-fns';
import { getSuggestedItems } from '../customer/index.js';

export const fetchSalesVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sales_visit_rules = await prisma.sales_visit_rules.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        salesPerson: true,
        customer: {
          include: {
            subgroup: true,
            sales_invoices: true,
          },
        },
      },
    });

    // Cek jika start_at , customer_id dan sales_person_id ada
    if (!sales_visit_rules) {
      return res.status(404).json({ message: 'Sales visit rule not found' });
    }

    const today = formatDate(new Date(), 'yyyy-MM-dd');

    let visit = await prisma.visits.findUnique({
      where: {
        unique_daily_visit: {
          customer_id: sales_visit_rules.customer_id,
          sales_person_id: sales_visit_rules.sales_person_id,
          rule_id: Number(id),
          visit_date: today,
        },
      },
      include: {
        salesPerson: true,
        customer: {
          include: {
            subgroup: true,
          },
        },
        visit_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!visit) {
      const now = formatDate(new Date(), 'yyyy-MM-dd');
      visit = await prisma.visits.create({
        data: {
          customer_id: sales_visit_rules.customer_id,
          sales_person_id: sales_visit_rules.sales_person_id,
          rule_id: Number(id),
          start_at: new Date(),
          visit_date: now,
          status: VisitStatus.Planned,
        },
        include: {
          salesPerson: true,
          customer: {
            include: {
              subgroup: true,
            },
          },
          visit_items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    const suggestedItems = await getSuggestedItems(
      Number(visit?.customer_id),
      sales_visit_rules.max_items_per_visit,
      true
    );

    const data = {
      ...visit,
      suggestedItems,
    };
    return res.status(200).json({ message: 'Success', data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const syncSalesVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { visit_items, visit_note } = req.body;

    if (!Array.isArray(visit_items)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    const visitId = Number(id);

    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
    });

    if (visit_note !== '') {
      await prisma.visits.update({
        where: { id: visitId },
        data: {
          notes: visit_note,
        },
      });
    }

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    const existing = await prisma.visit_items.findMany({
      where: { visit_id: visitId },
    });

    const existingMap = new Map(existing.map((i) => [i.product_id, i]));

    // UPSERT ITEMS
    for (const item of visit_items) {
      if (existingMap.has(item.product_id)) {
        await prisma.visit_items.update({
          where: { id: existingMap.get(item.product_id)!.id },
          data: {
            offered: item.offered,
            notes: item.notes || null,
          },
        });
      } else {
        await prisma.visit_items.create({
          data: {
            visit_id: visitId,
            product_id: item.product_id,
            offered: item.offered,
            notes: item.notes || null,
          },
        });
      }
    }

    const incomingIds = visit_items.map((i) => i.product_id);

    // DELETE REMOVED ITEMS
    await prisma.visit_items.deleteMany({
      where: {
        visit_id: visitId,
        product_id: { notIn: incomingIds },
      },
    });

    // SET ONGOING & START_AT ONLY ON FIRST SYNC
    await prisma.visits.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.Ongoing,
        ...(visit.start_at === null && { start_at: new Date() }),
      },
    });

    const updatedVisit = await prisma.visits.findUnique({
      where: { id: visitId },
      include: {
        salesPerson: true,
        customer: { include: { subgroup: true } },
        visit_items: { include: { product: true } },
      },
    });

    return res.status(200).json({ message: 'Success', data: updatedVisit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const completeSalesVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.visits.update({
      where: {
        id: Number(id),
      },
      data: {
        status: VisitStatus.Completed,
        end_at: new Date(),
      },
    });
    return res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const visitDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salesVisit = await prisma.visits.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        salesPerson: true,
        customer: {
          include: {
            subgroup: true,
          },
        },
        visit_items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({ message: 'Success', data: salesVisit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
