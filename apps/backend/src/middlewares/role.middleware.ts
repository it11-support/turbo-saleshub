import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware.js'

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user || !user?.role) {
      return res.status(403).json({ message: 'User role not found' })
    }

    if (!allowedRoles.includes(user?.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    next()
  }
}
