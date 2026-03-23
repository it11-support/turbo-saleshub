import {
  completeSalesVisit,
  fetchSalesVisit,
  followUpVisit,
  syncSalesVisit,
  visitDetails,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/follow-up', followUpVisit);
router.get('/:id', fetchSalesVisit);
router.post('/:id', syncSalesVisit);
router.post('/:id/complete', completeSalesVisit);
router.get('/:id/details', visitDetails);

export default router;
