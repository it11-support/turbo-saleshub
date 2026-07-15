import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';
import { handleApiError } from '@/utils/apiResponse.js';

export type ConfigRequstType = {
  userId: string;
};

export type ConfigType = {
  key: string;
  value: string | null;
};

export type ConfigResponseType = {
  message: string;
  data?: {
    configs: ConfigType[];
  };
};
export const userConfig = async (
  req: Request<ConfigRequstType>,
  res: Response<ConfigResponseType>
) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const configs = await prisma.configs.findMany({
      where: {
        user_id: Number(userId),
      },
      select: {
        key: true,
        value: true,
      },
    });

    res.status(200).json({
      message: 'Success',
      data: {
        configs,
      },
    });
  } catch (error) {
    return handleApiError(error, res)
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { user_id, configs } = req.body;
    const keys = Object.keys(configs);

    if (!keys) {
      res.status(400).json({ message: 'Key is required' });
      return;
    }

    await prisma.$transaction(
      keys.map((key) =>
        prisma.configs.upsert({
          where: { user_id_key: { user_id, key } },
          update: { value: configs[key] },
          create: { user_id, key, value: configs[key] },
        })
      )
    );

    res.status(200).json({ message: 'Success', data: configs });
  } catch (err) {
    return handleApiError(err, res)
  }
};
