import { z } from 'zod';

export const CardPaymentMethod = z.object({
  id: z.string(),
  session_id: z.string(),
  method: z.literal('card'),
  card_number: z.string(),
  card_expiry: z.string(),
  card_cvv: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CardPaymentMethod = z.infer<typeof CardPaymentMethod>;
