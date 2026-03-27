import prisma from "@/libs/prisma.js";
import { IInquiry } from "@saleshub-tsm/types";
import { Request, Response } from "express";

export const getInquiries = async(req: Request, res: Response) => {
  try {
    const {id} = req.params
    const inquiries = await prisma.inquiries.findMany({
      where: {
        visit_id: Number(id)
      }
    })
    return res.status(200).json({ message: "Success", data: { inquiries } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const syncInquiries = async (req: Request, res: Response) => {
  const { inquiries, visit_id } = req.body

  await prisma.$transaction(async (tx) => {
    // hapus lama
    await tx.inquiries.deleteMany({
      where: { visit_id: Number(visit_id) },
    })

    // insert baru
    await tx.inquiries.createMany({
      data: inquiries.map((item: IInquiry) => ({
        visit_id: Number(visit_id),
        product_id: item.product_id,
        product_name: item.product_name,
        notes: item.notes,
      })),
    })
  })
   const result = await prisma.inquiries.findMany({
    where: { visit_id: Number(visit_id) }
  })

  res.json({ success: true, data: { inquiries: result } })
}
