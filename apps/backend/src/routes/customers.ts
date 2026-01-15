import { Router } from 'express';
import {
  customerList,
  customerSummary,
  fetchSubgroups,
  itemSuggestions,
  purchaseHistory,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/subgroups', fetchSubgroups);
router.get('/', customerList);
router.get('/:id', customerSummary);
router.get('/:id/suggestions', itemSuggestions);
router.get('/:id/purchases', purchaseHistory);

export default router;
