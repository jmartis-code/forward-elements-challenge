"use client";

import { type CardFormEvent, EvtSuccess, EvtError } from "@fwd/elements-types";
import { CardInput, useCardForm } from "@fwd/elements-react";
import type { CreatePaymentSessionResponse } from "@fwd/elements-types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  useForm,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { z } from "zod";
import { EvtValidationResult } from "@fwd/elements-types";
import { client } from "@/lib/query-client";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@fwd/ui/components/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fwd/ui/components/select";

import { Input } from "@fwd/ui/components/input";

const CheckoutFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  }),
});
type CheckoutFormSchema = z.infer<typeof CheckoutFormSchema>;

type CheckoutFormContextType = {
  form: UseFormReturn<CheckoutFormSchema>;
  submit: () => Promise<void>;
  validateBothForms: () => Promise<void>;
  isReady: boolean;
  isSubmitting: boolean;
  events: CardFormEvent[];
  paymentSuccess: boolean;
  paymentError: string | null;
};

export const CheckoutFormContext =
  createContext<CheckoutFormContextType | null>(null);

export interface CheckoutFormProviderProps {
  children: React.ReactNode;
  session: CreatePaymentSessionResponse;
}

export const CheckoutFormProvider = ({
  children,
  session,
}: CheckoutFormProviderProps) => {
  const { form: cardForm, isReady, isSubmitting } = useCardForm();
  const [events, setEvents] = useState<CardFormEvent[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Initialize form before we try to use it in processPayment
  const form = useForm<CheckoutFormSchema>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
      },
    },
  });

  useEffect(() => {
    const unsubscribe = cardForm.subscribe((event) => {
      setEvents((prev) => [...prev, event]);

      // Handle success events from the card form
      if (event.type === "CARD_FORM_SUCCESS") {
        console.log("Payment method created successfully", event.data.methodId);
        processPayment(event.data.methodId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [cardForm, form]);

  // Function to process payment with the payment method ID
  const processPayment = async (methodId: string) => {
    try {
      const formData = form.getValues();

      // Create payment through the API
      const response = await client.createPayment({
        body: {
          session_id: session.id,
          method_id: methodId,
          amount: session.amount,
          payor: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.address.line1,
              line2: formData.address.line2,
              city: formData.address.city,
              state: formData.address.state,
              postalCode: formData.address.postalCode,
              country: "US", // Default to US
            },
          },
          reference_id: session.reference_id,
        },
        headers: {
          authorization: "Bearer test123",
        },
      });

      if (response.status === 201) {
        console.log("Payment processed successfully:", response.body);
        setPaymentSuccess(true);
        setPaymentError(null);
        toast.success("Payment Successful", {
          description: `Payment of $${(session.amount / 100).toFixed(
            2
          )} has been processed.`,
        });
        // Redirect or show success page
      } else {
        throw new Error(`Payment processing failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentSuccess(false);
      setPaymentError(
        error instanceof Error ? error.message : "Payment processing failed"
      );
      toast.error("Payment Failed", {
        description:
          error instanceof Error ? error.message : "Payment processing failed",
      });
    }
  };

  // Add real-time validation to clear errors when fields are valid
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

  const onSubmitSuccess: SubmitHandler<CheckoutFormSchema> = useCallback(
    async (data) => {
      // Get the iframe element
      const iframeElement = document.querySelector("iframe");
      if (!iframeElement || !iframeElement.contentWindow) {
        console.error("Card form iframe not found");
        return;
      }

      // At this point, TypeScript should know contentWindow is not null
      const contentWindow = iframeElement.contentWindow;

      try {
        // Use postMessage to communicate with the iframe instead of direct property access
        // Create a listener for the validation result
        const validationPromise = new Promise<boolean>((resolve, reject) => {
          const handleMessage = (event: MessageEvent) => {
            // Make sure the message is from our iframe
            if (event.source !== contentWindow) return;

            // Handle validation result
            if (event.data?.type === EvtValidationResult) {
              // Remove the event listener to avoid memory leaks
              window.removeEventListener("message", handleMessage);

              if (event.data.data.isValid) {
                resolve(true);
              } else {
                console.error("Card validation failed", event.data.data.errors);
                resolve(false);
              }
            }
          };

          // Add the message event listener
          window.addEventListener("message", handleMessage);

          // Set a timeout to reject the promise after 5 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleMessage);
            reject(new Error("Validation timed out"));
          }, 5000);

          // Send the validation request message to the iframe
          console.log("Sending validation request to iframe:", {
            type: "VALIDATE_FORM",
            url: session.url,
          });

          try {
            contentWindow.postMessage(
              {
                type: "VALIDATE_FORM",
                url: session.url,
              },
              "*"
            );
            console.log("Validation request sent successfully");
          } catch (error) {
            console.error("Error sending validation request:", error);
            reject(new Error("Failed to send validation request"));
          }
        });

        // Wait for the validation result
        const isValid = await validationPromise;
        if (!isValid) {
          return;
        }

        // If validation is successful, submit the form to the iframe for tokenization
        console.log("Validation successful, submitting form for tokenization");

        // Trigger the card form submission which will tokenize the card data
        contentWindow.postMessage(
          {
            type: "submit-form",
            url: session.url,
          },
          "*"
        );

        // The result will be handled by the cardForm.subscribe handler in the useEffect
      } catch (error) {
        console.error("Error validating card form:", error);
        toast.error("Validation Failed", {
          description:
            error instanceof Error ? error.message : "Card validation failed",
        });
      }
    },
    [cardForm, session, form]
  );

  // Function to validate both checkout form and card form
  const validateBothForms = useCallback(async () => {
    // Get the iframe element
    const iframeElement = document.querySelector("iframe");
    if (!iframeElement || !iframeElement.contentWindow) {
      console.error("Card form iframe not found");
      return;
    }

    // At this point, TypeScript should know contentWindow is not null
    const contentWindow = iframeElement.contentWindow;

    let checkoutFormValid = false;
    let cardFormValid = false;
    let checkoutFormErrors: string[] = [];
    let cardFormErrors: string[] = [];
    let validationResult:
      | {
          isValid: boolean;
          errors: string[];
          firstErrorField?: string;
          errorMessages?: Record<string, string>;
        }
      | undefined;

    // Validate checkout form
    try {
      // Trigger validation on all fields in the checkout form
      checkoutFormValid = await form.trigger();

      if (!checkoutFormValid) {
        console.error("Checkout form validation failed");
        checkoutFormErrors = Object.keys(form.formState.errors);
      }
    } catch (error) {
      console.error("Error validating checkout form:", error);
    }

    // Validate card form
    try {
      // Create a listener for the validation result
      const validationPromise = new Promise<{
        isValid: boolean;
        errors: string[];
        firstErrorField?: string;
        errorMessages?: Record<string, string>;
      }>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          // Make sure the message is from our iframe
          if (event.source !== contentWindow) return;

          console.log("Message received from iframe:", event.data);

          // Check for validation results - be more flexible with the event type
          if (
            event.data &&
            (event.data.type === EvtValidationResult ||
              event.data.type === "VALIDATION_RESULT")
          ) {
            console.log("Validation result received:", event.data.data);
            // Remove the event listener to avoid memory leaks
            window.removeEventListener("message", handleMessage);

            if (event.data.data.isValid) {
              resolve({ isValid: true, errors: [] });
            } else {
              // Log the errors in a more user-friendly format
              console.error(
                "Card validation failed",
                event.data.data.errors || {}
              );

              // Get the first error field from the response
              const firstErrorField = event.data.data.firstErrorField;
              const errorFields = Object.keys(event.data.data.errors || {});
              const errorMessages = Object.entries(
                event.data.data.errors || {}
              ).reduce((acc, [field, error]: [string, any]) => {
                acc[field] = error.message;
                return acc;
              }, {} as Record<string, string>);

              resolve({
                isValid: false,
                errors: errorFields,
                firstErrorField,
                errorMessages,
              });
            }
          }
        };

        // Add the message event listener
        window.addEventListener("message", handleMessage);

        // Set a timeout to reject the promise after 15 seconds (increased from 5)
        setTimeout(() => {
          console.warn(
            "Validation timeout about to occur. No response received from iframe."
          );
          window.removeEventListener("message", handleMessage);
          reject(new Error("Validation timed out"));
        }, 15000);

        // Send the validation request message to the iframe
        console.log("Sending validation request to iframe:", {
          type: "VALIDATE_FORM",
          url: session.url,
        });

        try {
          contentWindow.postMessage(
            {
              type: "VALIDATE_FORM",
              url: session.url,
            },
            "*"
          );
          console.log("Validation request sent successfully");
        } catch (error) {
          console.error("Error sending validation request:", error);
          reject(new Error("Failed to send validation request"));
        }
      });

      // Wait for the validation result
      validationResult = await validationPromise;
      cardFormValid = validationResult.isValid;
      cardFormErrors = validationResult.errors;

      if (!cardFormValid) {
        // First focus on the iframe
        if (iframeElement) {
          setTimeout(() => {
            iframeElement.focus();
          }, 50);
        }

        // Then send a message to focus on the first error field with more detailed information
        const firstCardErrorField =
          validationResult.firstErrorField || cardFormErrors[0];
        const errorMessage = firstCardErrorField
          ? validationResult.errorMessages?.[firstCardErrorField]
          : undefined;

        if (firstCardErrorField) {
          contentWindow.postMessage(
            {
              type: "FOCUS_FIELD",
              field: firstCardErrorField,
              message: errorMessage,
              url: session.url,
            },
            "*"
          );
        }
      }
    } catch (error) {
      console.error("Failed to validate card form:", error);
      cardFormValid = false;
    }

    // Focus logic - only focus the first error across both forms
    if (!checkoutFormValid || !cardFormValid) {
      // If checkout form has errors, focus the first checkout form error
      if (checkoutFormErrors.length > 0) {
        const firstErrorField = checkoutFormErrors[0];
        setTimeout(() => {
          const errorInput = document.querySelector(
            `input[name="${firstErrorField}"]`
          );
          if (errorInput instanceof HTMLElement) {
            errorInput.focus();
          }
        }, 0);
      }
      // If only card form has errors, focus the card form iframe
      else if (cardFormErrors.length > 0) {
        // Focus the iframe first
        iframeElement.focus();

        // Then send a message to focus on the first error field with more detailed information
        const firstCardErrorField = cardFormErrors[0];

        try {
          // Only attempt to access validationResult properties if it exists
          if (validationResult && firstCardErrorField) {
            const errorMessage =
              validationResult.errorMessages?.[firstCardErrorField] || "";

            setTimeout(() => {
              iframeElement.contentWindow?.postMessage(
                {
                  type: "FOCUS_FIELD",
                  field: firstCardErrorField,
                  message: errorMessage,
                  url: session.url,
                },
                "*"
              );
            }, 50);
          } else if (firstCardErrorField) {
            // Fallback if validationResult is undefined
            setTimeout(() => {
              iframeElement.contentWindow?.postMessage(
                {
                  type: "FOCUS_FIELD",
                  field: firstCardErrorField,
                },
                "*"
              );
            }, 50);
          }
        } catch (error) {
          console.error("Error processing validation result:", error);
        }
      }
    }

    // If both forms are valid, proceed with submission
    if (checkoutFormValid && cardFormValid) {
      // Use form.handleSubmit directly to avoid using submit before it's defined
      form.handleSubmit(onSubmitSuccess)();
    }
  }, [form, session, onSubmitSuccess]);

  const submit = form.handleSubmit(onSubmitSuccess);

  const context = useMemo(
    () => ({
      form,
      submit,
      validateBothForms,
      isReady,
      isSubmitting,
      events,
      paymentSuccess,
      paymentError,
    }),
    [
      form,
      submit,
      validateBothForms,
      isReady,
      isSubmitting,
      events,
      paymentSuccess,
      paymentError,
    ]
  );

  return (
    <CheckoutFormContext.Provider value={context}>
      {children}
    </CheckoutFormContext.Provider>
  );
};

export function useCheckoutForm() {
  const context = useContext(CheckoutFormContext);
  if (!context) {
    throw new Error("CheckoutFormContext not found");
  }
  return context;
}

export function CheckoutForm() {
  const cardInputId = useId();
  const { form, events } = useCheckoutForm();

  return (
    <Form {...form}>
      <div className="w-full flex flex-col-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="w-full flex flex-col-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} placeholder="john.doe@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+1234567890" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="address.line1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Input {...field} placeholder="123 Main St" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address.line2"
        render={({ field }) => (
          <FormItem>
            <FormLabel></FormLabel>
            <FormControl>
              <Input {...field} placeholder="Apartment, suite, etc." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="w-full flex flex-col-3 gap-4">
        <FormField
          control={form.control}
          name="address.city"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.state"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>State</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="TX">Texas</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.postalCode"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <CardInput key={cardInputId} className="-mx-4" />

      {/* <div className="font-mono text-xs">
        <span>Events from card form:</span>
        {events.map((event, idx) => (
          <div key={event.type + idx}>
            <pre>{JSON.stringify(event, null, 2)}</pre>
          </div>
        ))}
      </div> */}
    </Form>
  );
}
