import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import * as ctrl from '../controllers/transferencias.controller.ts';

const router = Router();
router.use(authenticate);

router.get('/',              ctrl.listar);
router.post('/',             authorize('ADMIN', 'ALMACENISTA'), ctrl.crear);
router.get('/:id',           ctrl.obtener);
router.patch('/:id/estado',  authorize('ADMIN', 'ALMACENISTA'), ctrl.cambiarEstado);

export default router;
