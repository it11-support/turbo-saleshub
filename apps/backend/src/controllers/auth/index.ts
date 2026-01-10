import { generateToken } from '@/utils/jwt.js';
import { IUser } from '@saleshub-tsm/types';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';

export type LoginResponse = {
  data?: {
    token?: string;
    user?: Partial<IUser>;
  };
  message?: string;
};
export type LoginRequest = {
  username: string;
  password: string;
  remember: boolean;
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashed: string) => {
  return bcrypt.compare(password, hashed);
};

export const login = async (req: Request<LoginRequest>, res: Response<LoginResponse>) => {
  try {
    const { username, password, remember } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: username }, { username: username }],
      },
      include: { roles: true, sales_person: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password incorrect' });
    }

    const expiresIn = remember ? '7d' : '1d';

    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.roles.role,
      },
      expiresIn
    );

    // Kirim response
    return res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          sales_person: user.sales_person,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
