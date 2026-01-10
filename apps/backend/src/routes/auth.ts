import { login } from '../controllers/index.js';
import { Router } from 'express';
const router = Router();

router.post('/login', login)

export default router;
