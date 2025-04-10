"use client";

import { Button } from "@fwd/ui/components/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useCheckoutForm } from "./checkout-form";
import { useState } from "react";

export function CheckoutButton() {
  const { validateBothForms, isReady, isSubmitting, paymentSuccess } =
    useCheckoutForm();
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

  // If payment is successful, don't show button at all
  if (paymentSuccess) {
    return null;
  }

  return (
    <div className="w-full flex justify-center items-center">
      <Button
        onClick={handleSubmit}
        disabled={!isReady || isProcessing}
        className="w-full py-6 text-lg font-medium"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {isValidating ? "Validating..." : "Processing Payment..."}
          </>
        ) : (
          "Submit Order"
        )}
      </Button>
    </div>
  );
}
