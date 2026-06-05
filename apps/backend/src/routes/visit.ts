import { defaultLimiter } from '@/utils/limiter.js';
import {
  closeItems,
  completeSalesVisit,
  fetchSalesVisit,
  followUpVisit,
  startVisit,
  syncSalesVisit,
  visitDetails,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/follow-up', defaultLimiter, followUpVisit);
router.get('/:id', fetchSalesVisit);
router.post('/:id', defaultLimiter, syncSalesVisit);
router.post('/:id/complete', defaultLimiter, completeSalesVisit);
router.get('/:id/details', visitDetails);
router.post('/:id/start', defaultLimiter, startVisit);
router.post('/:id/close-items', defaultLimiter, closeItems);

export default router;
