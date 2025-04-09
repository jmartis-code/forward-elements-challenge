import { Skeleton } from "@fwd/ui/components/skeleton";
import { ProductCard } from "./product-card";
import type { PaginationParams } from "@/lib/server/store";

export const ProductListSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="flex flex-col gap-2 border rounded-md p-4 bg-gray-100 min-w-[200px] min-h-[300px]" />
      ))}
    </div>
  )
}

export async function ProductList({ params }: { params: PaginationParams }) {
  const products = await global?.ProductStore?.list(params) ?? { data: [] };

  return (
    <div className="flex flex-wrap gap-4">
      {products.data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
