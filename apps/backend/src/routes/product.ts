import { Router } from 'express';
import {
  bulkUploadProducts,
  deleteImage,
  fetchProducts,
  image,
  imageUpload,
} from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

const router = Router();

router.get('/image/:itemCode', image);
router.post('/image/:itemCode', imageUpload);
router.post('/images', bulkUploadProducts);
router.delete('/image/:itemCode', deleteImage);
router.get('/', fetchProducts);

router.use(authMiddleware);

export default router;
