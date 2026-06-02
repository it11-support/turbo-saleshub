import {
  createCategory,
  createStatus,
  deleteCategory,
  deleteStatus,
  getConcerns,
  getConcernStatuses,
  updateCategory,
  updateStatus
} from "@/services/index.js";
import { activityLogger } from "@/services/logs/index.js";
import { AuthenticatedRequest } from "@saleshub-tsm/types";
import { Request, Response } from "express";

export const fetchConcernCategories = async (req: Request, res: Response) => {
  try {
    const concernCategories = await getConcerns();
    res.status(200).json({ message: "Concern categories fetched successfully", data: { concernCategories } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const createNewCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await createCategory({ name, description });
    activityLogger({
      req,
      actionType: 'Concern Category',
      description: `New category created: ${name}`,
      status: 'SUCCESS'
    });
    res.status(200).json({ message: "Success", data: category });
  } catch (error) {
    console.error(error);
    const errorMessage = (error as Error).message;
    activityLogger({
      req,
      actionType: 'Concern Category',
      description: `New category created: ${errorMessage}`,
      status: 'FAILED'
    });
    res.status(500).json({ message: "Internal server error" });
  }
}

export const updateConcernCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid concern category id" });
    }

    const { name, description } = req.body;
    const category = await updateCategory(id, { name, description });
    activityLogger({
      req,
      actionType: 'Concern Category',
      description: `Category Updated: ${name}`,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: "Success", data: category });
  } catch (error) {
    console.error(error);
    const errorMessage = (error as Error).message;
    activityLogger({
      req,
      actionType: 'Concern Category',
      description: `Concern Category Updated: ${errorMessage}`,
      status: 'FAILED'
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteConcernCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Invalid concern category id" });
      return;
    }

    const category = await deleteCategory(id);
    activityLogger({
      req,
      actionType: 'Concern Category',
      description: `Category Category Deleted: ${category.name}`,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: "Success", data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchConcernStatuses = async (req: Request, res: Response) => {
  try {
    const concernStatuses = await getConcernStatuses();
    res.status(200).json({ message: "Concern statuses fetched successfully", data: { concernStatuses } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const createNewStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, level, icon, requires_action } = req.body;
    const statusData = await createStatus({ status, level, icon, requires_action });
    activityLogger({
      req,
      actionType: 'Concern Status',
      description: 'New status created',
      status: 'SUCCESS'
    });
    res.status(200).json({ message: "Success", data: statusData });
  } catch (error) {
    console.error(error);
    activityLogger({
      req,
      actionType: 'Concern Status',
      description: 'Create status failed',
      status: 'FAILED'
    });

    res.status(500).json({ message: "Internal server error" });
  }
}

export const updateConcernStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { status, level, icon, requires_action } = req.body;

  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Invalid concern status id" });
      return;
    }

    const newStatus = await updateStatus(id, { status, level, icon, requires_action });

    activityLogger({
      req,
      actionType: 'Concern Status',
      description: `Status updated: ${status} `,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: "Success", data: newStatus });
  } catch (error) {
    console.error(error);
    activityLogger({
      req,
      actionType: 'Concern Status',
      description: `Failed to update status: ${status} `,
      status: 'FAILED'
    });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteConcernStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: "Invalid concern status id" });
      return;
    }
    const status = await deleteStatus(id);
    res.status(200).json({ message: "Success", data: status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

