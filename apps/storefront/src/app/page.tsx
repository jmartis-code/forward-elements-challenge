import { CartButton, CartButtonSkeleton } from "@/lib/cart/components/cart-button";
import { ProductList, ProductListSkeleton } from "@/lib/product/components/product-list";
import { Skeleton } from "@fwd/ui/components/skeleton";
import { createLoader, parseAsInteger, parseAsString, type SearchParams } from "nuqs/server";
import { Suspense } from "react";
interface IndexProps {
  searchParams: SearchParams
}

const searchParams = {
  limit: parseAsInteger.withDefault(10),
  offset: parseAsInteger.withDefault(0),
  search: parseAsString.withDefault(''),
}
const loadSearchParams = createLoader(searchParams);

export default async function Index({ searchParams }: IndexProps) {
  const params = await loadSearchParams(searchParams);

  return (
    <div className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">The Store</h1>
        <Suspense fallback={<CartButtonSkeleton />}>
          <CartButton />
        </Suspense>
      </div>
      <div>
        <Suspense fallback={<ProductListSkeleton />}>
          <ProductList params={params} />
        </Suspense>
      </div>
    </div>
  );
};
