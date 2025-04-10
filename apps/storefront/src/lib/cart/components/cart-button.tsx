import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export const CartButtonSkeleton = () => {
  return (
    <div className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 animate-pulse min-h-[40px]">
      <ShoppingCart className="size-4" />
    </div>
  );
};

export async function CartButton() {
  const cart = (await global?.CartStore?.list({ limit: 100, offset: 0 })) ?? {
    data: [],
  };
  const sum = cart.data
    .reduce((acc, item) => acc + item.price * item.quantity, 0)
    .toFixed(2);
  const isCartEmpty = cart.data.length === 0;

  return (
    <div className="flex items-center gap-2">
      {isCartEmpty ? (
        <div className="bg-gray-400 text-white px-4 py-2 rounded-md flex items-center gap-2 cursor-not-allowed opacity-70">
          <ShoppingCart className="size-4" />${sum}
        </div>
      ) : (
        <Link
          href="/checkout"
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <ShoppingCart className="size-4" />${sum}
        </Link>
      )}
    </div>
  );
}
