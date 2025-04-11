"use client";

import { CardFormProvider } from "@fwd/elements-react";
import { CheckoutForm } from "./checkout-form";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { CheckoutFormProvider } from "./checkout-form";
import { CheckoutSummary } from "./checkout-summary";
import type { CartItem } from "@/lib/cart/cart.types";
import { CheckoutButton } from "./checkout-button";
import type { CreatePaymentSessionResponse } from "@fwd/elements-types";
import { clearCart } from "@/lib/cart/cart.actions";
import { client } from "@/lib/query-client";

export function CheckoutPage({ cart }: { cart: CartItem[] }) {
  const router = useRouter();
  const [session, setSession] = useState<CreatePaymentSessionResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCleared, setCartCleared] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    method_id?: string;
    methodId?: string;
    [key: string]: any; // Allow for other properties
  } | null>(null);

  // Create a stable reference ID that won't change on re-renders
  const referenceIdRef = useRef<string>(`order-${Date.now()}`);
  // Flag to track if we've already created a session
  const sessionCreatedRef = useRef<boolean>(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      router.push("/");
    }
  }, [cart, router]);

  // Listen for payment success events and clear the cart
  useEffect(() => {
    const handlePaymentSuccess = async (event: MessageEvent) => {
      if (
        (event.data?.type === "PAYMENT_COMPLETE" ||
          event.data?.type === "EvtSuccess") &&
        !cartCleared
      ) {
        console.log("Payment success detected, clearing cart");

        // Store payment result data if available
        if (event.data?.data?.payment) {
          setPaymentResult(event.data.data.payment);
        }

        try {
          // Call the server action to clear the cart
          const result = await clearCart();
          if (result.success) {
            console.log("Cart cleared successfully");
            setCartCleared(true);
            setPaymentSuccess(true);
          } else {
            console.error("Failed to clear cart:", result.error);
          }
        } catch (err) {
          console.error("Error clearing cart:", err);
        }
      }
    };

    // Listen for cart:cleared custom event
    const handleCartCleared = (event: Event) => {
      console.log("Cart cleared event received", event);

      // Try to get payment data from custom event detail if available
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.payment) {
        console.log(
          "Payment data found in cart:cleared event:",
          customEvent.detail.payment
        );
        setPaymentResult(customEvent.detail.payment);
      }

      setCartCleared(true);
      setPaymentSuccess(true);
    };

    window.addEventListener("message", handlePaymentSuccess);
    window.addEventListener("cart:cleared", handleCartCleared);

    return () => {
      window.removeEventListener("message", handlePaymentSuccess);
      window.removeEventListener("cart:cleared", handleCartCleared);
    };
  }, [cartCleared]);

  useEffect(() => {
    async function createSession() {
      // Prevent duplicate session creation
      if (sessionCreatedRef.current || session !== null) {
        console.log("Session already created, skipping");
        return;
      }

      try {
        setLoading(true);
        // Mark that we're creating a session
        sessionCreatedRef.current = true;

        // Calculate the total amount from cart items in dollars
        const amountInDollars = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Convert to cents for the API
        const amountInCents = Math.round(amountInDollars * 100);

        console.log("Cart total in dollars:", amountInDollars);
        console.log("Cart total in cents:", amountInCents);

        // Prepare request data - using stable reference ID
        const requestBody = {
          amount: amountInCents,
          currency: "usd" as const,
          methods: ["card"] as ["card"],
          referenceId: referenceIdRef.current,
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
        // Reset the flag so we can retry
        sessionCreatedRef.current = false;

        // Fallback to a test session in development mode
        if (process.env.NODE_ENV === "development") {
          console.log("Using fallback test session");
          // Calculate amount and convert to cents as integer
          const amountInDollars = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          const amountInCents = Math.round(amountInDollars * 100);

          console.log("Cart total in dollars:", amountInDollars);
          console.log("Cart total in cents:", amountInCents);

          setSession({
            id: "test-session",
            url: `http://localhost:3000/payment-session/test-session?amount=${amountInCents}`,
            amount: amountInCents,
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

  // If cart is empty, show a message while redirecting
  if (cart.length === 0) {
    return (
      <div className="px-4 py-8 max-w-screen-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Checkout</h1>
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-lg mb-4">Your cart is empty</p>
          <p>Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-center mb-6">Checkout</h1>
        <CheckoutFormProvider session={session}>
          <div className="mb-4">
            <CheckoutSummary cart={cart} />
          </div>
          {!paymentSuccess ? (
            <>
              <CheckoutForm />
              <CheckoutButton />
            </>
          ) : (
            <>
              {/* Payment success UI */}
              <div className="w-full">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-green-800">
                    Payment Successful!
                  </h2>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Payment ID:</span>{" "}
                      {paymentResult?.id ||
                        "pay_" + Math.floor(Date.now() / 1000)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Amount:</span> $
                      {(
                        (paymentResult?.amount || session.amount) / 100
                      ).toFixed(2)}{" "}
                      {(
                        paymentResult?.currency || session.currency
                      ).toUpperCase()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      <span className="capitalize">
                        {paymentResult?.status || "succeeded"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Payment Method:</span>{" "}
                      Credit Card (tokenized)
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(
                        paymentResult?.created_at || session.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Clear the cart in localStorage
                      localStorage.removeItem("cart");

                      // Call the server action to clear the cart
                      clearCart()
                        .then(() => {
                          console.log("Cart cleared successfully");
                          // Redirect to the homepage
                          window.location.href = "/";
                        })
                        .catch((err) => {
                          console.error("Error clearing cart:", err);
                          // Still redirect even if there's an error
                          window.location.href = "/";
                        });
                    }}
                    className="mt-4 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </>
          )}
        </CheckoutFormProvider>
      </div>
    </CardFormProvider>
  );
}
