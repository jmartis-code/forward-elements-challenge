import { z } from 'zod';

export const PaymentSession = z.object({
  id: z.string(),
  methods: z.array(z.enum(['card', 'apple-pay', 'google-pay', 'ach-debit'])).optional(),
  amount: z.number().int().positive(),
  currency: z.enum(['usd']),
  reference_id: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type PaymentSession = z.infer<typeof PaymentSession>;

export const CreatePaymentSessionRequest = z.object({
  methods: z.array(z.enum(['card', 'apple-pay', 'google-pay', 'ach-debit'])).optional(),
  amount: z.number().int().positive(),
  currency: z.enum(['usd']),

  payor: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z
        .object({
          line1: z.string().optional(),
          line2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  referenceId: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  style: z
    .object({
      theme: z.enum(['light', 'dark']),
      logo: z.string().url().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
    })
    .optional(),
});
export type CreatePaymentSessionRequest = z.infer<typeof CreatePaymentSessionRequest>;

export const CreatePaymentSessionResponse = PaymentSession.extend({
  url: z.string().url(),
});
export type CreatePaymentSessionResponse = z.infer<typeof CreatePaymentSessionResponse>;
