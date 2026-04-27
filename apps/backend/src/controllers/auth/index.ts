import { generateToken } from '@/utils/jwt.js';
import { AuthenticatedRequest, IUser } from '@saleshub-tsm/types';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import prisma from '@/libs/prisma.js';
import { activityLogger } from '@/services/logs/index.js';

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

export const login = async (req: AuthenticatedRequest<LoginRequest>, res: Response<LoginResponse>) => {

  const { username, password, remember } = req.body;

  try {

    if (!username || !password) {
      activityLogger({ req, actionType: 'Login', description: 'User Login Failed: Username or password are required', status: 'FAILED', username });
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: username }, { username: username }],
      },
      include: { roles: true, sales_person: true },
    });

    if (!user) {
      activityLogger({ req, actionType: 'Login', description: 'User Login Failed: User not found', status: 'FAILED', username });
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      activityLogger({ req, actionType: 'Login', description: 'User Login Failed: Password incorrect', status: 'FAILED', username });
      return res.status(401).json({ message: 'Password incorrect' });
    }

    const expiresIn = remember ? '7d' : '1d';

    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.roles.role,
      },
      expiresIn
    );

    activityLogger({ req, actionType: 'Login', description: 'User Login Success', status: 'SUCCESS', username });

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    activityLogger({
      req,
      actionType: 'Login',
      description: `User Login Failed: ${errorMessage}`,
      status: 'FAILED'
    });

    return res.status(500).json({ message: 'Internal server error' });
  }
};
