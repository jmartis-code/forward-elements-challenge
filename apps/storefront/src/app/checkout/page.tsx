import { CheckoutPage } from "@/lib/checkout/components/checkout-page";

export default async function Page() {
  const cart = (await global?.CartStore?.list({ limit: 100, offset: 0 })) ?? {
    data: [],
  };

  return <CheckoutPage cart={cart.data} />;
}
