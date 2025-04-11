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
import { NextResponse, NextRequest } from 'next/server';

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

// Add CORS headers to a response
const addCorsHeaders = (response: Response) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
};

// Options handler for preflight requests
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

const handler = createNextHandler(ElementsContract, handlers, {
  basePath: '/api',
  jsonQuery: true,
  responseValidation: true,
  handlerType: 'app-router',
  cors: false, // We'll handle CORS ourselves
  errorHandler(error) {
    const res = mapTsRestError(error as TsRestHttpError);
    const response = new TsRestResponse(JSON.stringify(res.body), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add CORS headers to the TsRestResponse
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  },
});

// Custom handler functions to add CORS headers
export async function GET(req: NextRequest) {
  const response = await handler(req);
  return addCorsHeaders(response);
}

export async function POST(req: NextRequest) {
  const response = await handler(req);
  return addCorsHeaders(response);
}

export async function PUT(req: NextRequest) {
  const response = await handler(req);
  return addCorsHeaders(response);
}

export async function DELETE(req: NextRequest) {
  const response = await handler(req);
  return addCorsHeaders(response);
}

export async function PATCH(req: NextRequest) {
  const response = await handler(req);
  return addCorsHeaders(response);
}
