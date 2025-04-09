import { z } from 'zod';

export const Payment = z.object({
  id: z.string(),
  method: z.enum(['card', 'apple-pay', 'google-pay', 'ach-debit']),
  method_id: z.string(),
  amount: z.number().int().positive(),
  currency: z.enum(['usd']),
  payor_first_name: z.string().optional(),
  payor_last_name: z.string().optional(),
  payor_email: z.string().email().optional(),
  payor_phone: z.string().optional(),
  payor_address_line1: z.string().optional(),
  payor_address_line2: z.string().optional(),
  payor_address_city: z.string().optional(),
  payor_address_state: z.string().optional(),
  payor_address_postal_code: z.string().optional(),
  payor_address_country: z.string().optional(),
  reference_id: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  status: z.enum(['captured', 'pending', 'failed']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Payment = z.infer<typeof Payment>;

export const CreatePaymentRequest = z.object({
  method_id: z.string(),
  session_id: z.string(),
  amount: z.number().int().positive(),
  payor: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z
        .object({
          line1: z.string().optional(),
          line2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postalCode: z.string(),
          country: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  reference_id: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequest>;

export const CreatePaymentResponse = Payment;
export type CreatePaymentResponse = z.infer<typeof CreatePaymentResponse>;
