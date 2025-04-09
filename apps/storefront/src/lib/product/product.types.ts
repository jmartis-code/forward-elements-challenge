import { z } from 'zod';

export const Product = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  image: z.string(),
  rating: z.number(),
  rating_count: z.number(),
});

export type Product = z.infer<typeof Product>;
