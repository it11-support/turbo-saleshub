import { getConcerns } from "@/services/index.js";
import { Request, Response } from "express";

export const fetchConcernCategories = async (req: Request, res: Response) => {
  try {
    const concernCategories = await getConcerns();
    return res.status(200).json({ message: "Concern categories fetched successfully", data: { concernCategories } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
