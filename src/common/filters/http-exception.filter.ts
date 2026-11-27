
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const requestId = randomUUID();

    response.setHeader('X-Request-Id', requestId);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : null;

    const errorBody =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
        ? exceptionResponse as Record<string, unknown>
        : {};

    const code =
      typeof errorBody.code === 'string'
        ? errorBody.code
        : this.getErrorCode(status);

    const message =
      typeof errorBody.message === 'string'
        ? errorBody.message
        : status >= 500
          ? 'Internal server error'
          : 'Request failed';

    const details = Array.isArray(errorBody.details)
      ? errorBody.details
      : undefined;

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error
          ? exception.stack
          : String(exception),
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(details && { details }),
        request_id: requestId,
      },
    });
  }

  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodes[status] ?? 'HTTP_ERROR';
  }
}
