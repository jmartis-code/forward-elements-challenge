"use client";

import { Button } from "@fwd/ui/components/button";
import { Loader2 } from "lucide-react";
import { useCheckoutForm } from "./checkout-form";

export function CheckoutButton() {
  const { submit, isReady, isSubmitting } = useCheckoutForm();

  return (
    <div className="w-full flex justify-center items-center">
      <Button onClick={submit} disabled={!isReady || isSubmitting}>
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit Order
      </Button>
    </div>
  );
}
