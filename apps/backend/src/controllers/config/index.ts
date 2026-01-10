import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

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
      return res.status(400).json({ message: 'User ID is required' });
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

    return res.status(200).json({
      message: 'Success',
      data: {
        configs,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { user_id, configs } = req.body;
    const keys = Object.keys(configs);

    if (!keys) return res.status(400).json({ message: 'Key is required' });

    await prisma.$transaction(
      keys.map((key) =>
        prisma.configs.upsert({
          where: { user_id_key: { user_id, key } },
          update: { value: configs[key] },
          create: { user_id, key, value: configs[key] },
        })
      )
    );

    return res.status(200).json({ message: 'Success', data: configs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
