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

  // If payment is successful, show success message
  if (paymentSuccess) {
    return (
      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex items-center text-green-600 gap-2">
          <CheckCircle className="w-6 h-6" />
          <span className="text-lg font-medium">
            Payment Completed Successfully
          </span>
        </div>
        <Button onClick={() => (window.location.href = "/")}>
          Return to Store
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center">
      <Button onClick={handleSubmit} disabled={!isReady || isProcessing}>
        {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Submit Order
      </Button>
    </div>
  );
}
