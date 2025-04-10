"use client";

import { Button } from "@fwd/ui/components/button";
import { Loader2 } from "lucide-react";
import { useCheckoutForm } from "./checkout-form";
import { useState } from "react";

export function CheckoutButton() {
  const { validateBothForms, isReady, isSubmitting } = useCheckoutForm();
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async () => {
    setIsValidating(true);
    try {
      await validateBothForms();
    } finally {
      setIsValidating(false);
    }
  };

  const isProcessing = isValidating || isSubmitting;

  return (
    <div className="w-full flex justify-center items-center">
      <Button onClick={handleSubmit} disabled={!isReady || isProcessing}>
        {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit Order
      </Button>
    </div>
  );
}
