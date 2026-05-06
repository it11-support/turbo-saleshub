import prisma from "@/libs/prisma.js";
import { Request, Response } from "express";

export const fetchNotifications = async (req: Request, res: Response) => {
  try {
    const {userId} = req.query
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: Number(userId),
        is_read: false
      }
    })
    return res.status(200).json({
      message: "Success",
      data: {
        notifications
      }
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
