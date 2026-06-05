import { Router } from 'express';
import {
  createCustomer,
  customerList,
  customerSummary,
  fetchGroups,
  fetchSubgroups,
  itemSuggestions,
  purchaseHistory,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';
import { defaultLimiter } from '@/utils/limiter.js';

const router = Router();

router.use(authMiddleware);

router.get('/subgroups', fetchSubgroups);
router.get('/groups', fetchGroups);
router.get('/', customerList);
router.post('/', defaultLimiter, createCustomer);
router.get('/:id', customerSummary);
router.get('/:id/suggestions', itemSuggestions);
router.get('/:id/purchases', purchaseHistory);

export default router;
