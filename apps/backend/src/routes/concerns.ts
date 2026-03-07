import {
  createNewCategory,
  deleteConcernCategory,
  fetchConcernCategories,
  updateConcernCategory,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';
import { Router } from 'express';

const router = Router();

router.use(authMiddleware);

router.get('/', fetchConcernCategories);
router.post('/', createNewCategory);
router.put('/:id', updateConcernCategory);
router.delete('/:id', deleteConcernCategory);

export default router;
