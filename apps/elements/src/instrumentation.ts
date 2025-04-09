import "server-only";

import { Store } from "@/lib/server/store";

import type {
  Payment,
  PaymentSession,
  CardPaymentMethod,
} from "@fwd/elements-types";
export const PaymentSessionStore = new Store<PaymentSession>([
  {
    id: "123",
    amount: 1000,
    methods: ["card"],
    currency: "usd",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]);
export const PaymentStore = new Store<Payment>();
export const CardPaymentMethodStore = new Store<CardPaymentMethod>();

// The instrumentation hook is the only way to access the global scope from the server components and server actions
export async function register() {
  global.PaymentSessionStore = PaymentSessionStore;
  global.PaymentStore = PaymentStore;
  global.CardPaymentMethodStore = CardPaymentMethodStore;
}
