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
}): ReactNode {
  console.log("CardFormContent rendered", { sessionId, sessionUrl });

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

    // Prepare the response message
    const responseMessage = {
      type: "CARD_FORM_HELLO",
      url: sessionUrl,
      data: {
        message: "validation_result",
        isValid,
        firstErrorField: Object.keys(errors)[0] || undefined,
        errors: Object.entries(errors).reduce((acc, [field, error]) => {
          acc[field] = {
            type: error?.type?.toString() || "unknown",
            message: error?.message?.toString() || field + " is invalid",
          };
          return acc;
        }, {} as Record<string, { type: string; message: string }>),
      },
    };

    console.log("Sending validation result to parent:", responseMessage);

    // Send validation result to parent
    window.parent.postMessage(responseMessage, "*");

    return isValid;
  }, [form, sessionUrl]);

  // Listen for messages from parent window
  const handleMessage = useCallback(
    (event: MessageEvent<any>) => {
      console.log("Message received from parent:", event.data);

      const { data } = event;
      if (data.type === "VALIDATE_FORM" || data.type === "VALIDATE_CARD_FORM") {
        console.log("Validating form due to message from parent");
        validateAndReportForm();
      } else if (data.type === "FOCUS_FIELD" && data.data?.fieldName) {
        console.log("Focusing field:", data.data.fieldName);
        // Focus on the specified field
        setTimeout(() => {
          const inputElement = document.querySelector(
            `input[name="${data.data.fieldName}"]`
          );
          if (inputElement) {
            (inputElement as HTMLInputElement).focus();
          }
        }, 50);
      } else if (
        data.type === "submit-form" ||
        data.type === "VALIDATE_AND_SUBMIT"
      ) {
        console.log("Submit form message received from parent");
        // Use inline function to avoid dependency issues
        form.handleSubmit((formData) => {
          // Early validation check - clear previous errors
          setSubmitError(null);
          setIsSubmitting(true);

          console.log("Starting card tokenization process...");

          // Try to tokenize
          cardForm.submit().then(
            (result) => {
              console.log("Tokenization successful:", result);

              // Prepare response data
              const responseData = {
                methodId: result.methodId,
                last4: formData.cardNumber.slice(-4),
                expiryMonth: formData.expiryDate.split("/")[0],
                expiryYear: `20${formData.expiryDate.split("/")[1]}`,
              };

              console.log("Sending tokenized data to parent:", responseData);

              // Send the tokenized result to the parent window
              window.parent.postMessage(
                {
                  type: EvtSuccess,
                  url: sessionUrl,
                  data: responseData,
                },
                "*"
              );

              setShowSuccessMessage(true);
              setTimeout(() => setShowSuccessMessage(false), 3000);
              setIsSubmitting(false);
            },
            (error) => {
              console.error("Tokenization failed:", error);
              setSubmitError(
                "Failed to process payment method. Please check your card details."
              );
              setIsSubmitting(false);
            }
          );
        })();
      } else if (data.type === "reset-form") {
        console.log("Reset form message received from parent");
        form.reset();
        setSubmitError(null);
        setShowSuccessMessage(false);
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
    ]
  );

  // Handle parent window messages
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

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

  // Form submission handler
  const onSubmit: SubmitHandler<CardFormSchema> = async (data) => {
    // Early validation check - clear previous errors
    setSubmitError(null);
    setIsSubmitting(true);

    console.log("Starting card tokenization process...");

    try {
      // Tokenize card data using the CardForm API
      console.log("Calling cardForm.submit()...");
      const tokenizationResult = await cardForm.submit();
      console.log("Tokenization successful:", tokenizationResult);

      // Prepare response data
      const responseData = {
        methodId: tokenizationResult.methodId,
        last4: data.cardNumber.slice(-4),
        expiryMonth: data.expiryDate.split("/")[0],
        expiryYear: `20${data.expiryDate.split("/")[1]}`,
      };

      console.log("Sending tokenized data to parent:", responseData);

      // Send the tokenized result to the parent window
      window.parent.postMessage(
        {
          type: EvtSuccess,
          url: sessionUrl,
          data: responseData,
        },
        "*"
      );

      console.log("Success message sent to parent");

      // Set success state to show feedback to the user
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error tokenizing card:", error);

      // Send error to parent window
      window.parent.postMessage(
        {
          type: EvtError,
          url: sessionUrl,
          data: {
            error: ErrValidation,
            message:
              error instanceof Error
                ? error.message
                : "Failed to process payment method",
          },
        },
        "*"
      );

      // Show error message to the user
      setSubmitError(
        "Failed to process payment method. Please check your card details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="py-4 bg-white rounded-md shadow-sm"
      style={{ minHeight: "380px", height: "380px" }}
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
          <p>Payment completed successfully!</p>
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
