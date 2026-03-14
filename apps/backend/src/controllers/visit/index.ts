import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

import { VisitStatus } from '@/generated/prisma/enums.js';
import { getSuggestedItems } from '../customer/index.js';

export const fetchSalesVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const visitId = Number(id);
    const visit = await prisma.visits.findUnique({
      where: {
        id: visitId,
      },
      include: {
        salesPerson: true,
        customer: {
          include: {
            subgroup: true,
            sales_invoices: true,
          },
        },
        visit_items: {
          include: {
            product: true,
            visit_item_concerns: {
              include: {
                status: true,
                category: true,
              },
            }
          },
        },
        rule: true,
      },
    });

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    const suggestedItems = await getSuggestedItems(
      Number(visit.customer_id),
      visit.rule?.max_items_per_visit,
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
    const { visit_items } = req.body;

    if (!Array.isArray(visit_items)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    const visitId = Number(id);

    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
    });
    if(!visit?.start_at){
      await prisma.visits.update({
        where: { id: visitId },
        data: {
          start_at: new Date(),
          status: VisitStatus.Ongoing
        },
      })
    }
    if (visit_items[0].visitNote !== '') {
      await prisma.visits.update({
        where: { id: visitId },
        data: {
          notes: visit_items[0].visitNote,
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
      let currentVisitItemId: bigint; // Gunakan ini untuk menyimpan ID yang valid

      if (existingMap.has(item.product_id)) {
        // 1. Update data lama
        const updated = await prisma.visit_items.update({
          where: { id: existingMap.get(item.product_id)!.id },
          data: { offered: true },
        });
        currentVisitItemId = BigInt(updated.id);
      } else {
        // 2. Create data baru
        const created = await prisma.visit_items.create({
          data: {
            visit_id: visitId,
            product_id: item.product_id,
            offered: true,
          },
        });
        currentVisitItemId = BigInt(created.id);
      }

      // 3. Bersihkan data concerns lama menggunakan ID database yang valid
      await prisma.visit_item_concerns.deleteMany({
        where: { visit_item_id: currentVisitItemId },
      });

      // 4. Masukkan concerns baru
      for (const concern of item.concerns) {
        await prisma.visit_item_concerns.create({
          data: {
            visit_items: {
              connect: { id: currentVisitItemId } // Gunakan ID yang baru kita dapatkan
            },
            category: {
              connect: { id: concern.concern_id ? BigInt(concern.concern_id) : 1n }
            },
            notes: concern.note,
            status:  {
              connect: { id: concern.status_id ? BigInt(concern.status_id) : 1n }
            }
          }
        });
      }
    }


    const updatedVisit = await prisma.visits.findUnique({
      where: { id: visitId },
      include: {
        salesPerson: true,
        customer: { include: { subgroup: true } },
        visit_items: { include: { product: true, visit_item_concerns: true } },
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

    const { notes } = req.body
    await prisma.visits.update({
      where: {
        id: Number(id),
      },
      data: {
        status: VisitStatus.Completed,
        end_at: new Date(),
        notes
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
            visit_item_concerns: {
              include: {
                category: true,
                status: true,
              },
            }
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
