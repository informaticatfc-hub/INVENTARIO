import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import errorHandler from './middleware/errorHandler.ts';
import logger from './utils/logger.ts';

import authRoutes          from './routes/auth.ts';
import almacenesRoutes     from './routes/almacenes.ts';
import materialesRoutes    from './routes/materiales.ts';
import entradasRoutes      from './routes/entradas.ts';
import salidasRoutes       from './routes/salidas.ts';
import transferenciasRoutes from './routes/transferencias.ts';
import perdidasRoutes      from './routes/perdidas.ts';
import reportesRoutes      from './routes/reportes.ts';
import usuariosRoutes      from './routes/usuarios.ts';
import auditoriaRoutes     from './routes/auditoria.ts';

const app = express();

// ── Seguridad y utilidades ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Rate limiting global ───────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiadas solicitudes, intenta en un momento' },
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { ok: false, message: 'Demasiados intentos de login' },
}));

// ── Rutas ──────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/almacenes',      almacenesRoutes);
app.use('/api/materiales',     materialesRoutes);
app.use('/api/entradas',       entradasRoutes);
app.use('/api/salidas',        salidasRoutes);
app.use('/api/transferencias', transferenciasRoutes);
app.use('/api/perdidas',       perdidasRoutes);
app.use('/api/reportes',       reportesRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/auditoria',      auditoriaRoutes);

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date() }));

// ── 404 ────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada' }));

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => logger.info(`API corriendo en puerto ${PORT} [${process.env.NODE_ENV}]`));

export default app;
