import { IRole } from '@saleshub-tsm/types';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

export type RoleResponseType = {
  message: string;
  data?: {
    roles: IRole[];
  };
};
export const roles = async (req: Request, res: Response<RoleResponseType>) => {
  try {
    const roles = await prisma.roles.findMany();
    return res.status(200).json({ message: 'Roles data fetched successfully', data: { roles } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
