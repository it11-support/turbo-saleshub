import prisma from "@/libs/prisma.js";
import { Request, Response } from "express";

export const fetchCompetitors = async (req: Request, res: Response) => {
  try {
    const competitors = await prisma.competitors.findMany();
    res.status(200).json({ message: "Competitors fetched successfully", data: competitors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const fetchCompetitorsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params // visit id
    const competitors = await prisma.visit_competitors.findMany({
      where: { visit_id: Number(id) },
      include: { competitors: true, competitor_products: true }
    });
    res.status(200).json({ message: "Competitor fetched successfully", data: competitors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const syncCompetitors = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const competitors = req.body;

    if (!Array.isArray(competitors)) {
      return res.status(400).json({
        message: 'competitors must be an array',
      })
    }


    if (Array.isArray(id) || !id) {
      res.status(400).json({ message: "Invalid ID parameter" });
      return;
    }


    const result = await prisma.$transaction(async (tx) => {

      const oldVisitCompetitors = await tx.visit_competitors.findMany({
        where: { visit_id: BigInt(id) },
        select: { id: true }
      });

      const oldIds = oldVisitCompetitors.map(vc => vc.id);

      await tx.competitor_products.deleteMany({
        where: { visit_competitor_id: { in: oldIds } }
      });

      await tx.visit_competitors.deleteMany({
        where: {
          visit_id: Number(id)
        }
      })

      const syncData = await Promise.all(competitors.map(async (item: any) => {
        const competitor = await prisma.competitors.upsert({
          where: { name: item.name },
          update: {},
          create: { name: item.name },
        })

        return tx.visit_competitors.create({
          data: {
            visit_id: Number(id),
            competitor_id: competitor.id,
            competitor_products: {
              create: item.products.map((product: any) => ({
                product_name: product.product_name,
                brand: product.brand,
                price: product.price,
                monthly_usage: product.monthly_usage,
                unit: product.unit,
                is_promo: product.is_promo,
                notes: product.notes,
                stock_status: product.stock_status,
              }))
            }
          }
        })
      }))

      return syncData
    })

    res.status(200).json({ message: 'Competitors synced successfully', data: result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
