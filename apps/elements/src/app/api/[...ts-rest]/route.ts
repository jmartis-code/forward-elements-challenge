import { createNextHandler, TsRestHttpError, TsRestResponse } from '@ts-rest/serverless/next';
import {
  ElementsContract,
  BadRequestResponse,
  UnauthorizedResponse,
  ForbiddenResponse,
  NotFoundResponse,
  InternalServerErrorResponse,
} from '@fwd/elements-types';
import { createPaymentSession, createPayment } from '@/lib/payment-session/payment-session.routes';

export const mapTsRestError = (error: TsRestHttpError) => {
  if (error.statusCode === 400) {
    return { status: 400, body: BadRequestResponse.parse({ message: error.message }) };
  }
  if (error.statusCode === 401) {
    return { status: 401, body: UnauthorizedResponse.parse({ message: error.message }) };
  }
  if (error.statusCode === 403) {
    return { status: 403, body: ForbiddenResponse.parse({ message: error.message }) };
  }
  if (error.statusCode === 404) {
    return { status: 404, body: NotFoundResponse.parse({ message: error.message }) };
  }

  return { status: 500, body: InternalServerErrorResponse.parse({ message: error.message }) };
};

const handlers = {
  createPaymentSession,
  createPayment,
};

const handler = createNextHandler(ElementsContract, handlers, {
  basePath: '/api',
  jsonQuery: true,
  responseValidation: true,
  handlerType: 'app-router',
  cors: false, // using next middleware,
  errorHandler(error) {
    const res = mapTsRestError(error as TsRestHttpError);
    return new TsRestResponse(JSON.stringify(res.body), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
});

export {
  handler as DELETE,
  handler as GET,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
