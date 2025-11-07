import { Request, Response, NextFunction } from 'express';

const HEADER_NAME = 'x-correlation-id';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header(HEADER_NAME);
  const id = incoming && incoming.trim().length > 0 ? incoming : crypto.randomUUID();
  res.setHeader(HEADER_NAME, id);
  // make available to handlers/loggers
  (res.locals as any).correlationId = id;
  next();
}

