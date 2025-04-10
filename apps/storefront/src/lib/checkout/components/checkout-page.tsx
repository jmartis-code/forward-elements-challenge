"use client";

import { CardFormProvider } from "@fwd/elements-react";
import { CheckoutForm } from "./checkout-form";
import { useState, useEffect } from "react";

import { CheckoutFormProvider } from "./checkout-form";
import { CheckoutSummary } from "./checkout-summary";
import type { CartItem } from "@/lib/cart/cart.types";
import { CheckoutButton } from "./checkout-button";
import type { CreatePaymentSessionResponse } from "@fwd/elements-types";
import { client } from "@/lib/query-client";

export function CheckoutPage({ cart }: { cart: CartItem[] }) {
  const [session, setSession] = useState<CreatePaymentSessionResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createSession() {
      try {
        setLoading(true);
        // Calculate the total amount from cart items
        const totalAmount = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Prepare request data
        const requestBody = {
          amount: totalAmount,
          currency: "usd" as const,
          methods: ["card"] as ["card"],
          referenceId: `order-${Date.now()}`,
          metadata: {
            cartItems: String(cart.length),
          },
        };

        console.log(
          "Creating payment session with:",
          JSON.stringify(requestBody, null, 2)
        );

        // Use the ts-rest client instead of fetch directly
        const response = await client.createPaymentSession({
          body: requestBody,
          headers: {
            authorization: "Bearer test123",
          },
        });

        console.log("Payment session response:", response);

        if (response.status !== 201) {
          console.error("Error details:", response.body);
          throw new Error(
            `Failed to create payment session: ${response.status}`
          );
        }

        setSession(response.body);
      } catch (err) {
        console.error("Error creating payment session:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create payment session"
        );
        // Fallback to a test session in development mode
        if (process.env.NODE_ENV === "development") {
          console.log("Using fallback test session");
          setSession({
            id: "test-session",
            url: `http://localhost:3000/payment-session/test-session`,
            amount: cart.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
            currency: "usd",
            methods: ["card"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } finally {
        setLoading(false);
      }
    }

    createSession();
  }, [cart]);

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-screen-sm mx-auto w-full">
        Loading checkout...
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="px-4 py-8 max-w-screen-sm mx-auto w-full text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-8 max-w-screen-sm mx-auto w-full">
        Unable to load checkout.
      </div>
    );
  }

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
