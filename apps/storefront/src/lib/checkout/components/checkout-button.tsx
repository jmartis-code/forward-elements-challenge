"use client";

import { Button } from "@fwd/ui/components/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useCheckoutForm } from "./checkout-form";
import { useState } from "react";

export function CheckoutButton() {
  const {
    validateBothForms,
    isReady,
    isSubmitting,
    isProcessingPayment,
    paymentSuccess,
  } = useCheckoutForm();
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async () => {
    setIsValidating(true);
    try {
      await validateBothForms();
    } finally {
      setIsValidating(false);
    }
  };

  const isProcessing = isValidating || isSubmitting || isProcessingPayment;

  // If payment is successful, don't show button at all
  if (paymentSuccess) {
    return null;
  }

  return (
    <div className="w-full flex justify-center items-center">
      <Button
        onClick={handleSubmit}
        disabled={!isReady || isProcessing}
        className={`py-6 text-md font-medium relative transition-all duration-300 ${
          isProcessing ? "pl-10 bg-indigo-600" : ""
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin absolute left-4" />
            <span className="flex items-center">
              {isProcessingPayment ? "Processing Payment..." : "Processing..."}
            </span>
          </>
        ) : (
          "Submit Order"
        )}
      </Button>
    </div>
  );
}
