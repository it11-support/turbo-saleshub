import { defaultLimiter } from '@/utils/limiter.js';
import { login } from '../controllers/index.js';
import { Router } from 'express';
const router = Router();

router.post('/login', defaultLimiter, login as any)

export default router;
