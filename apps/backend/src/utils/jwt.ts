import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { IUserPayload } from '../middlewares/auth.middleware.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const generateToken = (payload: object, expiry?: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry || '1d' });
};

export const verifyToken = (token: string): IUserPayload | undefined => {
  try {
    return jwt.verify(token, JWT_SECRET) as IUserPayload;
  } catch {
    return undefined;
  }
};
