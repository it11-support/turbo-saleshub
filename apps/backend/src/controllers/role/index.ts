import { IResSingle, IRole } from '@saleshub-tsm/types';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';
import { handleApiError } from '@/utils/apiResponse.js';

export const roles = async (req: Request, res: Response<IResSingle<IRole>>) => {
  try {
    const roles = await prisma.roles.findMany();
    res.status(200).json({ message: 'Roles data fetched successfully', data: roles });
  } catch (error) {
    return handleApiError(error, res, 'Internal server error', []);
  }
};
