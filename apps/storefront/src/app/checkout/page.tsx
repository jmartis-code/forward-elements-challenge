import { CheckoutPage } from "@/lib/checkout/components/checkout-page";

export default async function Page() {
  const cart = (await global?.CartStore?.list({ limit: 100, offset: 0 })) ?? {
    data: [],
  };

  // Add timestamp to force new component instance when page loads
  const pageKey = Date.now();

  return <CheckoutPage key={pageKey} cart={cart.data} />;
}
