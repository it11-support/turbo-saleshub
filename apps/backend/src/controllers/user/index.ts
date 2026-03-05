import { IUser, PaginationResult } from '@saleshub-tsm/types';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { PER_PAGE } from '@/constants/index.js';

import prisma from '@/libs/prisma.js';
import { convertToPrismaOrderBy, sortOptionsParser } from '@/utils/sortOptionsParser.js';

export type UserRequstType = {
  search?: string;
  per_page?: number;
  roles?: string | string[];
  sort_options?: { key: string; order: 'asc' | 'desc' }[];
  page?: number;
};

export type ProfileResponseType = {
  message: string;
  data?: {
    user: IUser | null;
  };
};

export const userList = async (
  req: Request<UserRequstType>,
  res: Response<PaginationResult<IUser>>
) => {
  try {
    const { search = '', per_page = PER_PAGE, page = 1 } = req.query;

    const { roles } = req.query as {
      roles?: string | string[];
    };

    let selectedRoles: string[] = [];

    const whereQuery: any = search
      ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { username: { contains: search } },
          { sales_person: { SlpName: { contains: search } } },
        ],
      }
      : {};

    const sortOptions = sortOptionsParser(req.query.sort_options);
    const orderBy = convertToPrismaOrderBy(sortOptions);

    if (roles) {
      if (Array.isArray(roles)) {
        selectedRoles = roles;
      } else {
        selectedRoles = [roles];
      }
    }

    if (selectedRoles.length > 0) {
      whereQuery.roles =
        selectedRoles.length === 1
          ? { role: { equals: selectedRoles[0] } }
          : { role: { in: selectedRoles } };
    }

    const [users, meta] = await prisma.users
      .paginate({
        where: whereQuery,
        include: {
          roles: true,
          sales_person: true,
        },
        orderBy: orderBy,
      })
      .withPages({
        limit: Number(per_page),
        page: Number(page),
        includePageCount: true,
      });

    return res.status(200).json({
      message: 'Users fetched successfully',
      data: {
        items: users,
        totalRecords: meta.totalCount,
        currentPage: meta.currentPage,
        perPage: Number(per_page),
        totalPages: meta.pageCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response<ProfileResponseType>) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      include: {
        sales_person: true,
        roles: true,
      },
    });

    return res.status(200).json({
      message: 'Success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { password, ...rest } = req.body;
    const dataToUpdate: any = { ...rest };

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      dataToUpdate.password = hashedPassword;
    }

    const user = await prisma.users.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return res.status(200).json({ message: 'Success', data: { user } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    const data: any = { ...rest };

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      data.password = hashedPassword;
    }

    const user = await prisma.users.create({
      data
    });
    return res.status(200).json({ message: 'Success', data: { user } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.delete({
      where: { id: Number(id) },
    });
    return res.status(200).json({ message: 'Success', data: { user } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
