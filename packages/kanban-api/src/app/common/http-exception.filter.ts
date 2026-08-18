import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const body = typeof raw === 'object' && raw ? raw as Record<string, unknown> : {};
    if (!(exception instanceof HttpException)) this.logger.error(exception);
    response.status(status).json({
      ...body,
      statusCode: status,
      message: body.message ?? (status === 500 ? 'Internal server error' : String(raw)),
      error: body.error ?? HttpStatus[status] ?? 'Error',
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: (request as Request & { requestId?: string }).requestId,
    });
  }
}
