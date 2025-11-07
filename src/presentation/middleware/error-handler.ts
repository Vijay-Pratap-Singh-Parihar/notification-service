import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { Logger } from '../../shared/logging/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const correlationId = res.locals.correlationId as string;
  
  if (err instanceof AppError) {
    Logger.warn('Application error', correlationId, { 
      statusCode: err.statusCode, 
      message: err.message,
      path: req.path,
      method: req.method
    });
    return res.status(err.statusCode).json({ error: { message: err.message, statusCode: err.statusCode } });
  }
  
  Logger.error('Unexpected error', correlationId, { 
    error: String(err),
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  return res.status(500).json({ error: { message: 'Internal server error', statusCode: 500 } });
}


