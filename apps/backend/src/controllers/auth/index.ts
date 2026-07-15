import { generateToken } from '@/utils/jwt.js';
import { AuthenticatedRequest, IUser } from '@saleshub-tsm/types';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import prisma from '@/libs/prisma.js';
import { activityLogger } from '@/services/logs/index.js';
import { handleApiError } from '@/utils/apiResponse.js';

export type LoginResponse = {
  data?: {
    token?: string;
    user?: Partial<IUser>;
    errors?: {
      username?: string;
      pass?: string;
      remember?: string;
    }
  };
  message?: string;
};
export type LoginRequest = {
  username: string;
  pass: string;
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

  const { username, pass, remember } = req.body;

  try {

    if (!username || !pass) {
      activityLogger({ req, actionType: 'Login', description: 'User Login Failed: Username or password are required', status: 'FAILED', username });
      res.status(200).json({ message: 'Username and password are required', data: { errors: { username: !username ? 'Username is required' : undefined, pass: !pass ? 'Password is required' : undefined } } });
      return;
    }

    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: username }, { username: username }],
      },
      include: { roles: true, sales_person: true },
    });

    if (!user) {
      activityLogger({ req, actionType: 'Login', description: 'User Login Failed: User not found', status: 'FAILED', username });
      res.status(200).json({ message: 'User not found', data: { errors: { username: 'Username or email not found.' } } });
      return;
    }

    const isMatch = await comparePassword(pass, user?.password);
    if (!isMatch) {
      activityLogger({ req, actionType: 'Login', description: 'User Login Failed: Password incorrect', status: 'FAILED', username });
      // snyk:ignore:NoHardcodedPasswords
      // Reason: False Positive. This is a validation error response for the client.
      res.status(200).json({ message: 'Password incorrect', data: { errors: { pass: 'Password is incorrect.' } } });
      return;
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
    res.status(200).json({
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    activityLogger({
      req,
      actionType: 'Login',
      description: `User Login Failed: ${errorMessage}`,
      status: 'FAILED'
    });

    return handleApiError(error, res)
  }
};
