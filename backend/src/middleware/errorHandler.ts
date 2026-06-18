import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.ts';

export interface AppError extends Error {
  status?: number;
}

export default function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) {
    logger.error({ message, stack: err.stack, path: req.path, method: req.method });
  }

  res.status(status).json({
    ok: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
