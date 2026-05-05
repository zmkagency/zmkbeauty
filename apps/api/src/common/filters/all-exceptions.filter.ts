import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';

/**
 * Global exception filter that produces a consistent JSON error shape:
 * {
 *   statusCode, message, error, path, timestamp
 * }
 *
 * Handles:
 *  - HttpException (NestJS built-ins, BadRequest/Unauthorized/etc.)
 *  - Prisma known request errors (P2002 unique, P2025 not found, ...)
 *  - Prisma validation errors
 *  - Anything else → 500
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Beklenmeyen bir hata oluştu.';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;
        message = r.message || exception.message;
        errorName = r.error || exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      errorName = 'PrismaError';
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[] | undefined)?.join(', ');
          message = target
            ? `Bu ${target} zaten kayıtlı.`
            : 'Kayıt zaten mevcut.';
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'İlgili kayıt bulunamadı.';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'İlişkili kayıt bulunamadığı için işlem tamamlanamadı.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = exception.message.split('\n').pop() || 'Veritabanı hatası.';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'PrismaValidationError';
      message = 'Geçersiz veri gönderildi.';
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    // Log unexpected server errors with full stack — client never sees internals
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      
      // Capture error with Sentry in production
      if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(exception, {
          tags: {
            path: request.url,
            method: request.method,
            status: status.toString()
          }
        });
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
