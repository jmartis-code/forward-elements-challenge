import { z } from 'zod';

export const CartItem = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export type CartItem = z.infer<typeof CartItem>;

export const Cart = z.object({
  id: z.string(),
  items: z.array(CartItem),
});

export type Cart = z.infer<typeof Cart>;
