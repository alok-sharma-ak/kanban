import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId: string };

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const supplied = req.header('x-request-id');
    req.requestId = supplied && supplied.length <= 100 ? supplied : randomUUID();
    res.setHeader('x-request-id', req.requestId);
    next();
  }
}
