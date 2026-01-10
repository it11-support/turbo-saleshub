import { mtdSummary } from '../controllers/summary/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', mtdSummary);

export default router;
