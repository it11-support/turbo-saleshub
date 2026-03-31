import { createCategory, createStatus, deleteCategory, deleteStatus, getConcerns, getConcernStatuses, updateCategory, updateStatus } from "@/services/index.js";
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

export const createNewCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await createCategory({ name, description });
    return res.status(200).json({ message: "Success", data: category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const updateConcernCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid concern category id" });
    }

    const { name, description } = req.body;
    const category = await updateCategory(id, { name, description });
    return res.status(200).json({ message: "Success", data: category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteConcernCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid concern category id" });
    }

    const category = await deleteCategory(id);
    return res.status(200).json({ message: "Success", data: category });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchConcernStatuses = async (req: Request, res: Response) => {
  try {
    const concernStatuses = await getConcernStatuses();
    return res.status(200).json({ message: "Concern statuses fetched successfully", data: { concernStatuses } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const createNewStatus = async (req: Request, res: Response) => {
  try {
    const { status, level, icon, requires_action } = req.body;
    const statusData = await createStatus({ status, level, icon, requires_action });
    return res.status(200).json({ message: "Success", data: statusData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const updateConcernStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid concern status id" });
    }

    const { status, level, icon, requires_action } = req.body;
    const  newStatus = await updateStatus(id, { status, level, icon, requires_action });
    return res.status(200).json({ message: "Success", data: newStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteConcernStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid concern status id" });
    }
    const status = await deleteStatus(id);
    return res.status(200).json({ message: "Success", data: status });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

