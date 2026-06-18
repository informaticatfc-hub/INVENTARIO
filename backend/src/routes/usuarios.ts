import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import * as ctrl from '../controllers/usuarios.controller.ts';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/',       ctrl.listar);
router.post('/',      ctrl.crear);
router.put('/:id',    ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;
