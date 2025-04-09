import type { Product } from "./src/lib/product/product.types";
import type { CartItem } from "./src/lib/cart/cart.types";
import type { Store } from "./src/lib/server/store";

declare global {
  var ProductStore: Store<Product>;
  var CartStore: Store<CartItem>;
}

export {};
