import prisma from "@/libs/prisma.js";
import { activityLogger } from "@/services/logs/index.js";
import { handleApiError } from "@/utils/apiResponse.js";
import { AuthenticatedRequest, IInquiry } from "@saleshub-tsm/types";
import { Request, Response } from "express";

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const inquiries = await prisma.inquiries.findMany({
      where: {
        visit_id: Number(id)
      }
    })
    res.status(200).json({ message: "Success", data: { inquiries } });
  } catch (error) {
    return handleApiError(error, res)
  }
}

export const syncInquiries = async (req: AuthenticatedRequest, res: Response) => {
  const { inquiries, visit_id } = req.body

  const parsedVisitId = Number(visit_id);
  if (!visit_id || isNaN(parsedVisitId)) {
    res.status(400).json({
      message: 'Invalid visit_id',
      errors: { visit_id: 'visit_id should be a valid number' }
    });
  }

  if (!Array.isArray(inquiries)) {
    res.status(400).json({
      message: 'Invalid inquiries',
      errors: { inquiries: 'inquiries should be an array.' }
    });
  }

  await prisma.$transaction(async (tx) => {
    // hapus lama
    await tx.inquiries.deleteMany({
      where: { visit_id: parsedVisitId },
    })

    // insert baru
    await tx.inquiries.createMany({
      data: inquiries.map((item: IInquiry) => ({
        visit_id: parsedVisitId,
        product_id:
          item.product_id == null ? null : Number(item.product_id),
        product_name: String(item?.product_name || ''),
        notes: item?.notes ? String(item.notes) : null,
      })),
    })
  })
  const result = await prisma.inquiries.findMany({
    where: { visit_id: parsedVisitId }
  })

  activityLogger({
    req,
    actionType: "Product Inquiries",
    description: "Inquiries synced",
    status: "SUCCESS",
  });

  res.json({ success: true, data: { inquiries: result } })
}
