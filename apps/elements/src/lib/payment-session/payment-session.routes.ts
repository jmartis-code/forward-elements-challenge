import 'server-only';

import { tsr } from '@ts-rest/serverless/next';
import { ElementsContract } from '@fwd/elements-types';
import { requireAuth } from '../server/auth';

export const createPaymentSession = tsr.route(
  ElementsContract.createPaymentSession,
  async ({ headers, body }) => {
    const authError = requireAuth(headers);
    if (authError) {
      return authError;
    }

    const result = await global.PaymentSessionStore.create({
      id: crypto.randomUUID(),
      amount: body.amount,
      currency: body.currency,
      methods: body.methods,
      reference_id: body.referenceId,
      metadata: body.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const url = `${process.env.NEXT_PUBLIC_URL}/payment-session/${result.id}`;

    return { status: 201 as const, body: { url, ...result } };
  }
);

export const createPayment = tsr.route(
  ElementsContract.createPayment,
  async ({ headers, body }) => {
    const authError = requireAuth(headers);
    if (authError) {
      return authError;
    }

    const [method, session] = await Promise.all([
      global.CardPaymentMethodStore.getById(body.method_id),
      global.PaymentSessionStore.getById(body.session_id),
    ]);

    if (!session) {
      return {
        status: 404 as const,
        body: { error: 'Not Found', message: 'Payment session not found' },
      };
    }

    if (!method) {
      return {
        status: 404 as const,
        body: { error: 'Not Found', message: 'Payment method not found' },
      };
    }

    if (session.id !== method.session_id) {
      return {
        status: 400 as const,
        body: { error: 'Bad Request', message: 'Payment method does not match session' },
      };
    }

    if (session.amount !== body.amount) {
      return {
        status: 400 as const,
        body: { error: 'Bad Request', message: 'Payment amount does not match session' },
      };
    }

    const payment = await global.PaymentStore.create({
      id: crypto.randomUUID(),
      method: method.method,
      method_id: method.id,
      amount: session.amount,
      currency: session.currency,
      status: 'captured',
      payor_first_name: body.payor?.firstName,
      payor_last_name: body.payor?.lastName,
      payor_email: body.payor?.email,
      payor_phone: body.payor?.phone,
      payor_address_line1: body.payor?.address?.line1,
      payor_address_line2: body.payor?.address?.line2,
      payor_address_city: body.payor?.address?.city,
      payor_address_state: body.payor?.address?.state,
      payor_address_postal_code: body.payor?.address?.postalCode,
      payor_address_country: body.payor?.address?.country,
      reference_id: body.reference_id,
      metadata: body.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return { status: 201 as const, body: payment };
  }
);
