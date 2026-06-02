import { IResSingle, IRole } from '@saleshub-tsm/types';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

export const roles = async (req: Request, res: Response<IResSingle<IRole>>) => {
  try {
    const roles = await prisma.roles.findMany();
    res.status(200).json({ message: 'Roles data fetched successfully', data: roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', data: [] });
  }
};
