import 'server-only';

import { randFloat, randProduct } from '@ngneat/falso';
import type { Product } from '@/lib/product/product.types';
import { Store } from '@/lib/server/store';
import type { CartItem } from '@/lib/cart/cart.types';

const defaultProducts = Array.from({ length: 10 }, (_, i) => {
  const product = randProduct();
  return {
    id: (i + 1).toString(),
    image: `https://api.slingacademy.com/public/sample-products/${i + 1}.png`,
    title: product.title,
    description: product.description,
    price: randFloat({ min: 10, max: 100 }),
    rating: parseFloat(product.rating.rate),
    rating_count: parseInt(product.rating.count),
  };
});

const ProductStore = new Store<Product>(defaultProducts);
const CartStore = new Store<CartItem>([]);

// The instrumentation hook is the only way to access the global scope from the server components and server actions
export async function register() {
  global.ProductStore = ProductStore;
  global.CartStore = CartStore;
}
