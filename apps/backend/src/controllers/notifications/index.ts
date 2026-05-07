import { notificationsWhereInput } from "@/generated/prisma/models.js";
import prisma from "@/libs/prisma.js";
import { convertToPrismaOrderBy, sortOptionsParser } from "@/utils/sortOptionsParser.js";
import { Request, Response } from "express";

export const fetchNotifications = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 10;
    const userId = Number(req.query.userId);
    const status = req.query.status;

    const sort = req.query.sort || null;
    const order = req.query.order || null;

    const sort_options = sort
      ? [{ key: sort, order: Number(order) === 1 ? 'asc' : 'desc' }]
      : [{ key: 'created_at', order: 'desc' }]

    const sortOptions = sortOptionsParser(sort_options);
    const orderBy = convertToPrismaOrderBy(sortOptions);

    const where: notificationsWhereInput = {
      ...(userId ? { user_id: userId } : {}),
      ...(status === 'read' ? { is_read: true } : {}),
      ...(status === 'unread' ? { is_read: false } : {}),
    };

    const [notifications, meta] = await prisma.notifications.paginate({
      where,
      orderBy,
    }).withPages({
      page: Number(page),
      limit: Number(per_page),
      includePageCount: true,
    });

    return res.status(200).json({
      message: "Success",
      data: {
        items: notifications,
        totalRecords: meta.totalCount,
        currentPage: page,
        perPage: per_page,
        totalPages: meta.pageCount
      }
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const unreadNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: Number(req.query.userId),
        is_read: false
      }
    });
    return res.status(200).json({ message: "Success", data: notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const updateReadStatus = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }
    const notification = await prisma.notifications.update({
      where: {
        id
      },
      data: {
        is_read: true
      }
    });
    return res.status(200).json({ message: "Success", data: notification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
