import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ZodError } from 'zod';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId = req.requestId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as { message: unknown }).message;
        message = typeof msg === 'string' ? msg : HttpStatus[status] ?? message;
      } else {
        message = HttpStatus[status] ?? message;
      }
    } else if (exception instanceof Error) {
      this.logger.error({
        requestId,
        event: 'unhandled_exception',
        errorName: exception.name,
        errorMessage: exception.message,
        stack: exception.stack
      });
    }

    if (status >= 500) {
      this.logger.error({
        requestId,
        event: 'server_error',
        statusCode: status,
        method: req.method,
        path: req.originalUrl
      });
    }

    res.status(status).json({
      statusCode: status,
      message,
      requestId
    });
  }
}
