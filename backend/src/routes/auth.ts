import { Router } from 'express';
import { login, logout, refresh, me } from '../controllers/auth.controller.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.post('/login',   login);
router.post('/logout',  authenticate, logout);
router.post('/refresh', refresh);
router.get('/me',       authenticate, me);

export default router;
