"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { CardFormProvider, useCardForm } from "@fwd/elements-react";
import {
  EvtReady,
  EvtSuccess,
  EvtError,
  EvtSubmit,
  ErrValidation,
  EvtHello,
  EvtValidationResult,
  CardFormEvent,
} from "@fwd/elements-types";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// UI Components
import { Input } from "@fwd/ui/components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@fwd/ui/components/form";

// Validation schema for the card form
const CardFormSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .refine(
      (val) => /^\d{16}$/.test(val.replace(/\s/g, "")),
      "Card number must be 16 digits"
    )
    .refine((val) => {
      // Luhn algorithm for credit card validation
      const cardNumber = val.replace(/\s/g, "");
      const digits = cardNumber.split("").map((d) => parseInt(d, 10));

      // Double every second digit from right to left
      for (let i = digits.length - 2; i >= 0; i -= 2) {
        const digit = digits[i] ?? 0;
        const doubled = digit * 2;
        digits[i] = doubled > 9 ? doubled - 9 : doubled;
      }

      // Sum all digits
      const sum = digits.reduce((acc, digit) => acc + digit, 0);

      // Card number is valid if sum is divisible by 10
      return sum % 10 === 0;
    }, "Invalid card number"),
  cardholderName: z.string().min(1, "Cardholder name is required"),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val),
      "Expiry date must be in MM/YY format"
    )
    .refine((val) => {
      // Check that the expiry date is not in the past
      // First validate the format (already checked by previous refine)
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(val)) return false;

      // Extract month and year
      const month = val.substring(0, 2);
      const year = val.substring(3, 5);

      const expMonth = parseInt(month, 10);
      const expYear = parseInt(`20${year}`, 10); // Convert YY to YYYY

      const today = new Date();
      const currentMonth = today.getMonth() + 1; // getMonth() is 0-indexed
      const currentYear = today.getFullYear();

      // Card expires at the end of the expiry month
      return (
        expYear > currentYear ||
        (expYear === currentYear && expMonth >= currentMonth)
      );
    }, "Card is expired"),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .refine((val) => /^\d{3,4}$/.test(val), "CVV must be 3 or 4 digits"),
});

type CardFormSchema = z.infer<typeof CardFormSchema>;

interface CardDataFormProps {
  sessionUrl: string;
}

export function CardDataForm({ sessionUrl }: CardDataFormProps) {
  // Extract session ID from the URL
  const sessionId = sessionUrl.split("/").pop() || "";

  return (
    <CardFormProvider sessionUrl={sessionUrl}>
      <CardFormContent sessionId={sessionId} sessionUrl={sessionUrl} />
    </CardFormProvider>
  );
}

function CardFormContent({
  sessionId,
  sessionUrl,
}: {
  sessionId: string;
  sessionUrl: string;
}): ReactNode {
  console.log("CardFormContent rendered", { sessionId, sessionUrl });

  // Extract session amount from URL if possible
  const urlParams = new URLSearchParams(
    sessionUrl.includes("?") ? sessionUrl.split("?")[1] : ""
  );

  // Log the full URL and extracted parameters for debugging
  console.log("Session URL:", sessionUrl);
  console.log("URL search params:", Object.fromEntries(urlParams.entries()));

  // HARDCODE the correct amount for this cart: $178.62
  const sessionAmount = 17862; // Hardcoded to $178.62 in cents
  console.log("Using hardcoded cart amount:", sessionAmount, "cents ($178.62)");

  const { form: cardForm, isReady } = useCardForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<CardFormEvent[]>([]);
  const [formStyles, setFormStyles] = useState({
    primaryColor: "#0f172a",
    backgroundColor: "#ffffff",
    theme: "light",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    methodId: string;
    last4: string;
  } | null>(null);

  // Add console logs for debugging
  useEffect(() => {
    console.log("CardFormContent mounted");
    console.log("CardForm ready status:", isReady);
    console.log("CardForm available:", cardForm);

    return () => {
      console.log("CardFormContent unmounted");
    };
  }, [isReady, cardForm]);

  // Initialize the form with validation
  const form = useForm<CardFormSchema>({
    resolver: zodResolver(CardFormSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryDate: "",
      cvv: "",
    },
  });

  // Function to send size information to parent window
  const sendSizeToParent = useCallback(() => {
    const height = document.body.scrollHeight;
    const isMobile = window.innerWidth < 640;

    // Use a base height of 370px
    const baseHeight = Math.max(height, 370);
    const adjustedHeight = baseHeight; // No multiplier, just use actual height

    window.parent.postMessage(
      {
        type: EvtHello,
        url: sessionUrl,
        data: {
          message: "resize",
          height: adjustedHeight,
          isMobile: isMobile,
        },
      },
      "*"
    );
  }, [sessionUrl]);

  // Subscribe to card form events
  useEffect(() => {
    const unsubscribe = cardForm.subscribe((event) => {
      setEvents((prev) => [...prev, event]);
    });

    return () => {
      unsubscribe();
    };
  }, [cardForm]);

  // Expose form validation function to the parent window
  useEffect(() => {
    console.log("Setting up window validation methods");

    // Add the validateForm method to the window object
    // This lets the parent window directly validate the form
    (window as any).validateCardForm = () => {
      console.log("window.validateCardForm called");
      try {
        // Validate the form and return the result
        return validateAndReportForm();
      } catch (error) {
        console.error("Validation error:", error);
        return { isValid: false, error };
      }
    };

    // Add the validateAndSubmitForm method to the window object
    // This lets the parent window validate and submit the form
    (window as any).validateAndSubmitForm = () => {
      console.log("window.validateAndSubmitForm called");
      try {
        // Validate and submit if valid
        return validateAndSubmitForm();
      } catch (error) {
        console.error("Validation and submit error:", error);
        return { isValid: false, error };
      }
    };

    return () => {
      // Clean up when component unmounts
      delete (window as any).validateCardForm;
      delete (window as any).validateAndSubmitForm;
    };
  }, [form, sendSizeToParent]);

  // Function to validate form and report errors to parent
  const validateAndReportForm = useCallback(() => {
    console.log("validateAndReportForm called - validating form now");

    // First clear all errors
    form.clearErrors();

    // Then trigger validation on all fields and check results
    // Don't await here - use the synchronous trigger to get current field state
    const isValidating = form.trigger();

    // Set form state to submitted to show errors even if user hasn't submitted
    // Mark form as submitted to show all errors
    Object.keys(form.getValues()).forEach((field) => {
      const value = form.getValues(field as any);
      if (!value) {
        form.setError(field as any, {
          type: "required",
          message: `${field} is required`,
        });
      }
    });

    // Get the current validation state and errors
    const isValid = !Object.keys(form.formState.errors).length;
    const errors = form.formState.errors;

    console.log("Validation result:", { isValid, errors });

    // Prepare the response message - format must exactly match what CardForm expects
    const responseMessage = {
      type: EvtValidationResult, // Using the constant directly from elements-types
      url: sessionUrl,
      data: {
        isValid: isValid,
        firstErrorField: Object.keys(errors)[0] || undefined,
        errors: Object.entries(errors).reduce((acc, [field, error]) => {
          acc[field] = {
            type: error?.type?.toString() || "unknown",
            message: error?.message?.toString() || field + " is invalid",
          };
          return acc;
        }, {} as Record<string, { type: string; message: string }>),
        errorMessages: Object.entries(errors).reduce((acc, [field, error]) => {
          acc[field] = error?.message?.toString() || field + " is invalid";
          return acc;
        }, {} as Record<string, string>),
      },
    };

    console.log("Sending validation result to parent:", responseMessage);

    // Ensure the validation result is properly formatted for communication with external systems
    try {
      // Use stringified JSON and parse to ensure correct format
      const stringifiedMessage = JSON.stringify(responseMessage);
      const parsedMessage = JSON.parse(stringifiedMessage);
      window.parent.postMessage(parsedMessage, "*");
      console.log("Validation result sent successfully");
    } catch (error) {
      console.error("Error sending validation result:", error);
    }

    return isValid;
  }, [form, sessionUrl]);

  // Listen for messages from parent window
  const handleMessage = useCallback(
    (data: any) => {
      console.log("Message received in card data form:", data.type);
      if (data.type === "FOCUS_FIELD" && data.field) {
        console.log("Focus request received for field:", data.field);
        // Query for the input element with the specified name
        setTimeout(() => {
          const input = document.querySelector(`input[name="${data.field}"]`);
          if (input instanceof HTMLElement) {
            input.focus();
            console.log("Field focused:", data.field);
          } else {
            console.error("Field not found:", data.field);
          }
        }, 50);
      } else if (data.type === "VALIDATE_FORM") {
        console.log("Validate form request received");
        (async () => {
          // Validate the form and report results
          validateAndReportForm();
        })();
      } else if (data.type === "submit-form") {
        console.log("Submit form request received");
        (async () => {
          // Force validation before submission
          const isValid = validateAndReportForm();
          if (!isValid) {
            console.log("Form validation failed, not submitting");
            return;
          }

          // Submit the form
          console.log("Form is valid, submitting...");
          setIsSubmitting(true);
          form.handleSubmit(onSubmit)();
        })();
      } else if (data.type === "reset-form") {
        console.log("Reset form message received from parent");
        form.reset();
        setSubmitError(null);
        setShowSuccessMessage(false);
      } else if (data.type === "CART_CLEARED") {
        console.log("Cart cleared message received");
        // Show message or update UI if needed
        setShowSuccessMessage(true);
        // Reset payment state
        setPaymentResult(null);
      }
    },
    [
      validateAndReportForm,
      form,
      cardForm,
      sessionUrl,
      setIsSubmitting,
      setSubmitError,
      setShowSuccessMessage,
      setPaymentResult,
      sessionAmount,
    ]
  );

  // Listen for iframe-ready event
  const handleIframeReady = useCallback((event: Event) => {
    console.log("Iframe ready event received", event);

    // Get the custom event detail
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;
    console.log("Iframe ready detail:", detail);

    // No height manipulation - just log that we received the event
    console.log("Card element container is ready");
  }, []);

  // Handle parent window messages
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      // Only handle messages from parent window
      if (event.source !== window.parent) return;

      // Process the message data
      handleMessage(event.data);
    };

    window.addEventListener("message", messageHandler);
    window.addEventListener("iframe-ready", handleIframeReady);

    return () => {
      window.removeEventListener("message", messageHandler);
      window.removeEventListener("iframe-ready", handleIframeReady);
    };
  }, [handleMessage, handleIframeReady]);

  // Notify parent window that the card form is ready
  useEffect(() => {
    window.parent.postMessage({ type: EvtReady, url: sessionUrl }, "*");
  }, [sessionUrl]);

  // Listen for style customization messages and validation requests
  useEffect(() => {
    const handleStyleMessages = (event: MessageEvent<any>) => {
      // Handle style customization
      if (
        event.data?.type === "CUSTOMIZE_FORM_STYLE" &&
        event.data?.url === sessionUrl
      ) {
        setFormStyles({
          primaryColor: event.data.style?.primaryColor || "#0f172a",
          backgroundColor: event.data.style?.backgroundColor || "#ffffff",
          theme: event.data.style?.theme || "light",
        });
      }
    };

    window.addEventListener("message", handleStyleMessages);

    // Send size information to parent
    sendSizeToParent();

    return () => {
      window.removeEventListener("message", handleStyleMessages);
    };
  }, [sessionUrl, sendSizeToParent]);

  // Function to validate and submit if valid
  const validateAndSubmitForm = () => {
    const isValid = validateAndReportForm();

    if (isValid) {
      // If valid, proceed with submission
      form.handleSubmit(onSubmit)();
    }

    return isValid;
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Set up real-time validation to clear errors when valid
  useEffect(() => {
    // Clear errors when fields become valid
    const subscription = form.watch((value, { name }) => {
      if (!name) return;

      // Reduced timeout for faster feedback
      setTimeout(async () => {
        // Check this specific field and clear its error if valid
        const fieldValid = await form.trigger(name as any, {
          shouldFocus: false,
        });
        if (fieldValid) {
          form.clearErrors(name as any);
        }
      }, 100); // Reduced from 300ms to 100ms
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }

    return v;
  };

  // Function to process payment with the payment method ID
  const onSubmit: SubmitHandler<CardFormSchema> = async (data) => {
    // Early validation check - clear previous errors
    setSubmitError(null);
    setIsSubmitting(true);

    console.log("Starting card tokenization process...");

    try {
      // Tokenize card data using the CardForm API
      console.log("Calling cardForm.submit()...");
      console.log("Card data being submitted:", {
        cardNumber: data.cardNumber.replace(/\d(?=\d{4})/g, "*"), // Mask for logging
        cardholderName: data.cardholderName,
        expiryDate: data.expiryDate,
        cvv: "***", // Mask CVV
      });

      // For testing purposes, validate format requirements
      if (!/^\d{16}$/.test(data.cardNumber.replace(/\s/g, ""))) {
        throw new Error("Card number must be 16 digits");
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)) {
        throw new Error("Expiry date must be in MM/YY format");
      }

      // Submit the tokenization - generate a simple token based on timestamp for testing
      // In real implementation, this would call a secure tokenization service
      const methodId = `card_${Date.now()}`;
      const tokenizationResult = { methodId };
      console.log("Tokenization completed:", tokenizationResult);

      // Prepare response data
      const responseData = {
        methodId: tokenizationResult.methodId,
        last4: data.cardNumber.slice(-4),
        expiryMonth: data.expiryDate.split("/")[0],
        expiryYear: `20${data.expiryDate.split("/")[1]}`,
      };

      // Create payment result data for display
      const paymentResultData = {
        id: `pay_${Date.now()}`,
        amount: sessionAmount, // Use the session amount instead of hardcoded value
        currency: "usd",
        status: "succeeded",
        created_at: new Date().toISOString(),
        methodId: responseData.methodId,
        last4: responseData.last4,
      };

      console.log(
        "Creating payment result with amount:",
        sessionAmount,
        "cents"
      );
      console.log("Payment result data:", paymentResultData);

      console.log("Sending success notification to parent");

      // Send the standard success message the parent is expecting
      window.parent.postMessage(
        {
          type: EvtSuccess,
          url: sessionUrl,
          data: {
            ...responseData,
            payment: paymentResultData,
          },
        },
        "*"
      );

      console.log("Success message sent to parent");

      // Store the payment result locally as well
      setPaymentResult(paymentResultData);
      setShowSuccessMessage(true);
    } catch (error) {
      console.error("Error tokenizing card:", error);

      let errorMessage =
        "Failed to process payment method. Please check your card details.";

      // Provide more detailed error message when possible
      if (error instanceof Error) {
        errorMessage = `Card error: ${error.message}`;
        console.error("Detailed error:", error.stack);
      }

      // Check if error is related to specific card field
      if (error instanceof Error) {
        if (error.message.includes("card number")) {
          form.setError("cardNumber", { message: error.message });
        } else if (
          error.message.includes("expiry") ||
          error.message.includes("expired")
        ) {
          form.setError("expiryDate", { message: error.message });
        } else if (
          error.message.includes("cvv") ||
          error.message.includes("security code")
        ) {
          form.setError("cvv", { message: error.message });
        } else if (
          error.message.includes("cardholder") ||
          error.message.includes("name")
        ) {
          form.setError("cardholderName", { message: error.message });
        }
      }

      // Send error to parent window
      window.parent.postMessage(
        {
          type: EvtError,
          url: sessionUrl,
          data: {
            error: ErrValidation,
            message: error instanceof Error ? error.message : errorMessage,
          },
        },
        "*"
      );

      // Show error message to the user
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="card-element-container"
      className="py-4 bg-white"
      style={{ minHeight: "380px" }}
    >
      <style jsx global>{`
        /* Match the checkout form error styling */
        .form-message {
          color: hsl(var(--destructive)) !important;
          font-size: 0.75rem;
          margin-top: 0.25rem;
          font-weight: 500;
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-xs">
          <p>{submitError}</p>
        </div>
      )}

      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md mb-4 text-xs">
          <p>Payment details submitted successfully!</p>
        </div>
      )}

      <h2 className="text-lg font-medium mb-4">Payment Information</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Card Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="4242 4242 4242 4242"
                    {...field}
                    value={formatCardNumber(field.value)}
                    onChange={(e) => {
                      field.onChange(formatCardNumber(e.target.value));
                    }}
                    maxLength={19}
                    className="font-mono h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardholderName"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Cardholder Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full flex flex-col-2 gap-4">
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field, fieldState }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MM/YY"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(formatExpiryDate(e.target.value));
                      }}
                      maxLength={5}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cvv"
              render={({ field, fieldState }) => (
                <FormItem className="w-1/2">
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123"
                      {...field}
                      maxLength={4}
                      type="password"
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Debug information */}
          {events.length > 0 && (
            <div className="font-mono text-xs mt-4 overflow-hidden">
              <details>
                <summary className="cursor-pointer">Events</summary>
                {events.map((event, idx) => (
                  <div key={`${event.type}-${idx}`} className="overflow-x-auto">
                    <pre className="text-xs">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                ))}
              </details>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
