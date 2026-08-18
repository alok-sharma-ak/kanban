import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpException } from '@nestjs/common';
import { AuthRequest } from './auth';
import { RequestWithId } from './request-context.middleware';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithId & Partial<AuthRequest>>();
    const res = context.switchToHttp().getResponse<Response>();
    const started = Date.now();
    const log = (statusCode: number) => this.logger.log(JSON.stringify({ requestId: req.requestId, method: req.method, path: req.originalUrl, statusCode, durationMs: Date.now() - started, userId: req.user?.id }));
    return next.handle().pipe(tap({ next: () => log(res.statusCode), error: (error: unknown) => log(error instanceof HttpException ? error.getStatus() : 500) }));
  }
}
