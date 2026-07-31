import { imageReadLimiter, imageUploadLimiter } from '@/utils/limiter.js';
import {
  closeItems,
  completeSalesVisit,
  fetchSalesVisit,
  followUpVisit,
  handleUploadVisitImage,
  startVisit,
  syncSalesVisit,
  visitDetails,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';
import { fetchVisitImage } from '@/controllers/visit/index.js';

const router = Router();
router.get('/image/:id/', imageReadLimiter, fetchVisitImage);

router.use(authMiddleware);

router.post('/follow-up', followUpVisit);
router.get('/:id', fetchSalesVisit);
router.post('/:id', syncSalesVisit);
router.post('/:id/complete', completeSalesVisit);
router.get('/:id/details', visitDetails);
router.post('/:id/start', startVisit);
router.post('/:id/close-items', closeItems);
router.post('/:id/images', imageUploadLimiter, handleUploadVisitImage);

export default router;
