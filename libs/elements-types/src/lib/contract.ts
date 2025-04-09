import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { CreatePaymentSessionRequest } from './payment-session.js';
import { CreatePaymentSessionResponse } from './payment-session.js';
import { CreatePaymentRequest, CreatePaymentResponse } from './payment.js';

const c = initContract();

export const BadRequestResponse = z.object({
  error: z.literal('Bad Request').default('Bad Request'),
  message: z.string().optional(),
});
export type BadRequestResponse = z.infer<typeof BadRequestResponse>;

export const UnauthorizedResponse = z.object({
  error: z.literal('Unauthorized').default('Unauthorized'),
  message: z.string().optional(),
});
export type UnauthorizedResponse = z.infer<typeof UnauthorizedResponse>;

export const ForbiddenResponse = z.object({
  error: z.literal('Forbidden').default('Forbidden'),
  message: z.string().optional(),
});
export type ForbiddenResponse = z.infer<typeof ForbiddenResponse>;

export const NotFoundResponse = z.object({
  error: z.literal('Not Found').default('Not Found'),
  message: z.string().optional(),
});
export type NotFoundResponse = z.infer<typeof NotFoundResponse>;

export const InternalServerErrorResponse = z.object({
  error: z.literal('Internal Server Error').default('Internal Server Error'),
  message: z.string().optional(),
});
export type InternalServerErrorResponse = z.infer<typeof InternalServerErrorResponse>;

export const CommonResponses = {
  400: BadRequestResponse,
  401: UnauthorizedResponse,
  403: ForbiddenResponse,
  404: NotFoundResponse,
  500: InternalServerErrorResponse,
};

export const AuthenticatedHeaders = z.object({
  authorization: z.string().startsWith('Bearer '),
});

export const ElementsContract = c.router({
  createPaymentSession: {
    method: 'POST',
    path: '/elements/payment-session',
    responses: {
      201: CreatePaymentSessionResponse,
      ...CommonResponses,
    },
    body: CreatePaymentSessionRequest,
    headers: AuthenticatedHeaders,
    summary: 'Create an elements payment session',
  },
  createPayment: {
    method: 'POST',
    path: '/elements/payment',
    responses: {
      201: CreatePaymentResponse,
      ...CommonResponses,
    },
    body: CreatePaymentRequest,
    headers: AuthenticatedHeaders,
    summary: 'Create a payment with an existing payment session and payment method',
  },
});
