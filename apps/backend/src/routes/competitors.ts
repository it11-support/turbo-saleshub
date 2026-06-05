import { fetchCompetitors, fetchCompetitorsById, syncCompetitors } from "@/controllers/index.js";
import { authMiddleware } from "@/middlewares/auth.middleware.js";
import { defaultLimiter } from "@/utils/limiter.js";
import { Router } from "express";

const router = Router();

router.use(authMiddleware);

router.get('/', fetchCompetitors);
router.get('/:id', fetchCompetitorsById);
router.post('/:id/sync', defaultLimiter, syncCompetitors)

export default router;
