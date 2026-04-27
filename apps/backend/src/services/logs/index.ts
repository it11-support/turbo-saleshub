import prisma from '@/libs/prisma.js';
import { TActivityLogger } from "@saleshub-tsm/types";

export const activityLogger = async <T>(payload: TActivityLogger<T>) => {
  const { req, actionType, description, status, username } = payload;

  try {

    const {user} = req;

    const finalUserId = Number(user?.id) || null;
    const finalUsername = user?.username || username || null;

    await prisma.user_activity.create({
      data: {
        user_id: finalUserId,
        username: finalUsername,
        action_type: actionType,
        description,
        status,
        request_path: req.originalUrl,
      },
    });
  } catch (error) {
    console.error("Logger Error:", error);
  }
};
