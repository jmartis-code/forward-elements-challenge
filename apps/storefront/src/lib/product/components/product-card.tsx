'use client';

import { Product } from "../product.types";
import { Button } from "@fwd/ui/components/button";
import { addToCart } from "@/lib/cart/cart.actions";
import { useRouter } from "next/navigation";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  const onAddToCart = () => {
    addToCart(product.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 border rounded-md p-4 bg-gray-100 max-w-[200px]">
      <h3 className="text-lg font-bold min-h-[50px]">{product.title}</h3>
      <img src={product.image} alt={product.title} width={200} height={200} />
      <p className="text-lg font-bold">${product.price}</p>

      <Button
        onClick={onAddToCart}>
        Add to Cart
      </Button>
    </div>
  )
}
