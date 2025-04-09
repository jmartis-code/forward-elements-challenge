"use client";

import { CardFormProvider } from "@fwd/elements-react";
import { CheckoutForm } from "./checkout-form";

import { CheckoutFormProvider } from "./checkout-form";
import { CheckoutSummary } from "./checkout-summary";
import type { CartItem } from "@/lib/cart/cart.types";
import { CheckoutButton } from "./checkout-button";

export function CheckoutPage({ cart }: { cart: CartItem[] }) {
  // TODO: This should be fetched from the elements api programmatically using the createPaymentSession endpoint
  const session = {
    id: "123",
    url: "http://localhost:3000/payment-session/123",
    amount: 1000,
    currency: "usd" as const,
    methods: ["card" as const],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <CardFormProvider sessionUrl={session.url}>
      <div className="px-4 py-8 max-w-screen-sm mx-auto w-full space-y-4">
        <CheckoutFormProvider session={session}>
          <CheckoutSummary cart={cart} />
          <CheckoutForm />
          <CheckoutButton />
        </CheckoutFormProvider>
      </div>
    </CardFormProvider>
  );
}
