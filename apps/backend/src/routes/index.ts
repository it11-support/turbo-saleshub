import { Router } from 'express';
import authLogin from './auth.js';
import configRoutes from './config.js';
import customerRoutes from './customers.js';
import productRoute from './product.js';
import roleRoutes from './roles.js';
import salesPersonsRoutes from './salesPersons.js';
import summaryRoutes from './summary.js';
import userRouter from './users.js';
import visit from './visit.js';
import visitRulesRoutes from './visit-rules.js';
import visitSchedule from './visit-schedule.js';
import visits from './visits.js';
import concerns from './concerns.js'
import inquiry from './inquiry.js'
import activityLog from './activity-log.js'
import followUpsRoute from './follow-ups.js'
import notificationRoute from './notifications.js'
import competitorRoute from './competitors.js'

const router = Router();

router.use('/auth', authLogin);
router.use('/config', configRoutes);
router.use('/user', userRouter);
router.use('/roles', roleRoutes);
router.use('/sales-persons', salesPersonsRoutes);
router.use('/customers', customerRoutes);
router.use('/product', productRoute);
router.use('/summary', summaryRoutes);
router.use('/visit-rules', visitRulesRoutes);
router.use('/schedule', visitSchedule);
router.use('/visit', visit);
router.use('/visits', visits);
router.use('/concern-categories', concerns);
router.use('/inquiry', inquiry);
router.use('/activity-log', activityLog)
router.use('/follow-ups', followUpsRoute)
router.use('/notifications', notificationRoute)
router.use('/competitors', competitorRoute)

export default router;
