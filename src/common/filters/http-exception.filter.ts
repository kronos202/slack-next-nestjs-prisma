import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { COMMON_MESSAGES } from '../messages/common.message';
import { IResponse } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    const isServerError = status === HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const message = isServerError
      ? COMMON_MESSAGES.INTERNAL_SERVER_ERROR
      : exception.message;

    const errors =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as any).errors ?? exceptionResponse);

    const code = errors.statusCode;
    delete errors.statusCode;
    delete errors.message;

    const responseBody: IResponse = {
      success: false,
      message,
      errors,
      path: request.url,
      statusCode: code,
    };

    response.status(status).json(responseBody);
  }
}
