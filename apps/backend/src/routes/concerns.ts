import {
  createNewCategory,
  createNewStatus,
  deleteConcernCategory,
  deleteConcernStatus,
  fetchConcernCategories,
  fetchConcernStatuses,
  updateConcernCategory,
  updateConcernStatus,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', fetchConcernCategories);
router.get('/statuses', fetchConcernStatuses);
router.post('/statuses', createNewStatus);
router.put('/statuses/:id', updateConcernStatus);
router.delete('/statuses/:id', deleteConcernStatus);
router.post('/', createNewCategory);
router.put('/:id', updateConcernCategory);
router.delete('/:id', deleteConcernCategory);

export default router;
