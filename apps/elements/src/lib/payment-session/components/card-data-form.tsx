"use client";

import { useState, useEffect, useCallback } from "react";
import { CardFormProvider, useCardForm } from "@fwd/elements-react";
import {
  EvtReady,
  EvtSuccess,
  EvtError,
  EvtSubmit,
  ErrValidation,
  EvtHello,
  CardFormEvent,
} from "@fwd/elements-types";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";

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
}) {
  const { form: cardForm, isReady } = useCardForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<CardFormEvent[]>([]);
  const [formStyles, setFormStyles] = useState({
    primaryColor: "#0f172a",
    backgroundColor: "#ffffff",
    theme: "light",
  });

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
    // Add the validateForm method to the window object
    // This lets the parent window directly validate the form
    (window as any).validateCardForm = async () => {
      try {
        // Mark all fields as touched to ensure errors show
        const fieldNames = Object.keys(form.getValues()) as Array<
          keyof CardFormSchema
        >;

        // Set touched state for all fields
        fieldNames.forEach((field) => {
          form.setError(field, {
            type: "validate",
            message: `${
              field === "cardNumber"
                ? "Card number"
                : field === "cardholderName"
                ? "Cardholder name"
                : field === "expiryDate"
                ? "Expiry date"
                : "CVV"
            } is required`,
          });
        });

        // Clear errors for valid fields
        const cardNumberValid = await form.trigger("cardNumber");
        if (cardNumberValid) form.clearErrors("cardNumber");

        const cardholderNameValid = await form.trigger("cardholderName");
        if (cardholderNameValid) form.clearErrors("cardholderName");

        const expiryDateValid = await form.trigger("expiryDate");
        if (expiryDateValid) form.clearErrors("expiryDate");

        const cvvValid = await form.trigger("cvv");
        if (cvvValid) form.clearErrors("cvv");

        // Set form as submitted to ensure errors show
        form.formState.isSubmitted = true;

        // Update validation state and resize
        setTimeout(() => {
          sendSizeToParent();
        }, 100);

        const isValid =
          cardNumberValid && cardholderNameValid && expiryDateValid && cvvValid;
        return { isValid };
      } catch (error) {
        console.error("Validation error:", error);
        return { isValid: false, error };
      }
    };

    return () => {
      // Clean up when component unmounts
      delete (window as any).validateCardForm;
    };
  }, [form, sendSizeToParent]);

  // Handle parent window messages
  useEffect(() => {
    // Notify parent window that the card form is ready
    window.parent.postMessage({ type: EvtReady, url: sessionUrl }, "*");

    // Listen for style customization messages and validation requests
    const handleMessage = (event: MessageEvent) => {
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

      // Handle validation requests
      if (
        event.data?.type === "VALIDATE_CARD_FORM" &&
        event.data?.url === sessionUrl
      ) {
        // Use the same validation logic as validateCardForm
        const fieldNames = Object.keys(form.getValues()) as Array<
          keyof CardFormSchema
        >;

        // Set touched state for all fields
        fieldNames.forEach((field) => {
          form.setError(field, {
            type: "validate",
            message: `${
              field === "cardNumber"
                ? "Card number"
                : field === "cardholderName"
                ? "Cardholder name"
                : field === "expiryDate"
                ? "Expiry date"
                : "CVV"
            } is required`,
          });
        });

        // Trigger validation to clear errors for valid fields
        form.trigger().then(() => {
          // Force form to show validation state
          form.formState.isSubmitted = true;

          // Force a UI update by setting a field value
          const cardNumber = form.getValues().cardNumber;
          form.setValue("cardNumber", cardNumber);

          // Send size update after validation to adjust for error messages
          setTimeout(() => {
            sendSizeToParent();
          }, 100);
        });
      }

      // Handle submit request from parent
      if (event.data?.type === "submit" && event.data?.url === sessionUrl) {
        form.handleSubmit(onSubmit)();
      }

      // Send size information to parent
      sendSizeToParent();
    };

    window.addEventListener("message", handleMessage);

    // Send initial size information
    sendSizeToParent();

    // Set up resize observer to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      sendSizeToParent();
    });

    // Observe the document body for size changes
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("message", handleMessage);
      resizeObserver.disconnect();
    };
  }, [sessionUrl, sendSizeToParent, form]);

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

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }

    return v;
  };

  // Form submission handler
  const onSubmit = async (data: CardFormSchema) => {
    setIsSubmitting(true);

    try {
      // Notify parent window that form is being submitted
      window.parent.postMessage(
        {
          type: EvtSubmit,
          url: sessionUrl,
        },
        "*"
      );

      // Tokenize card data using the CardForm API
      await cardForm.submit();

      // Success will be handled through the cardForm subscription in the useEffect
    } catch (error) {
      // Send error event to parent window
      window.parent.postMessage(
        {
          type: EvtError,
          url: sessionUrl,
          data: {
            error: ErrValidation,
            message: `Failed to process card details: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        },
        "*"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full max-w-full py-4 flex flex-col justify-center"
      style={{
        backgroundColor: formStyles.backgroundColor,
      }}
    >
      <style jsx global>{`
        /* Enhanced error message styling */
        .form-error-message {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.25rem;
          font-weight: 500;
          display: block !important;
          visibility: visible !important;
        }

        /* Make error borders more visible */
        .input-error {
          border-color: #ef4444 !important;
          border-width: 1.5px !important;
        }
      `}</style>

      <h2
        className="text-xl font-semibold text-center mb-4"
        style={{ color: formStyles.primaryColor }}
      >
        Payment Details
      </h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col justify-between"
        >
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
                    className={`font-mono h-9 ${
                      fieldState.error ? "input-error" : ""
                    }`}
                  />
                </FormControl>
                <FormMessage className="form-error-message" />
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
                  <Input
                    placeholder="John Doe"
                    {...field}
                    className={`h-9 ${fieldState.error ? "input-error" : ""}`}
                  />
                </FormControl>
                <FormMessage className="form-error-message" />
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
                      className={`h-9 ${fieldState.error ? "input-error" : ""}`}
                    />
                  </FormControl>
                  <FormMessage className="form-error-message" />
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
                      className={`h-9 ${fieldState.error ? "input-error" : ""}`}
                    />
                  </FormControl>
                  <FormMessage className="form-error-message" />
                </FormItem>
              )}
            />
          </div>

          {/* Debug information, can be removed in production */}
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
