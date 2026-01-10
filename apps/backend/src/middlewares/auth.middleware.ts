import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { JwtPayload } from 'jsonwebtoken'
import { IUser } from '@saleshub-tsm/types'

export type IUserPayload = Omit<IUser, 'role'> & {
  role: string
} & JwtPayload


export interface AuthRequest extends Request {
  user?: IUserPayload
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'No token provided.' })

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) return res.status(401).json({ message: 'Invalid or expired token.' })

  req.user = decoded

  next()
}
