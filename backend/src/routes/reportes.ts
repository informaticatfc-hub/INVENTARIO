import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import * as ctrl from '../controllers/reportes.controller.ts';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUPERVISOR', 'ALMACENISTA'));

router.get('/stock',       ctrl.stock);
router.get('/movimientos', ctrl.movimientos);
router.get('/general',     ctrl.general);

export default router;
