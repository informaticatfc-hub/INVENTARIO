import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import * as ctrl from '../controllers/auditoria.controller.ts';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/', ctrl.listar);

export default router;
