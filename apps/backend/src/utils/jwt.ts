import { IUserPayload } from '@saleshub-tsm/types';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined');
}

const JWT_SECRET = process.env.JWT_SECRET;

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
