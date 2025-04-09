import type {
  PaymentSession,
  Payment,
  CardPaymentMethod,
} from "@fwd/elements-types";
import type { Store } from "./src/lib/server/store";

declare global {
  var PaymentSessionStore: Store<PaymentSession>;
  var PaymentStore: Store<Payment>;
  var CardPaymentMethodStore: Store<CardPaymentMethod>;
}

export {};
