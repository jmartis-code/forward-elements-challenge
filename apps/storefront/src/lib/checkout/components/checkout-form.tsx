"use client";

import { type CardFormEvent } from "@fwd/elements-types";
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

  useEffect(() => {
    const unsubscribe = cardForm.subscribe((event) => {
      setEvents((prev) => [...prev, event]);

      // Handle success events from the card form
      if (event.type === "CARD_FORM_SUCCESS") {
        // TODO: This is where you would create a payment with the payment method ID
        console.log("Payment method created successfully", event.data.methodId);

        // Here you would typically:
        // 1. Send the payment method ID to your server
        // 2. Create a payment using the payment method ID
        // 3. Redirect the user to a confirmation page
      }
    });

    return () => {
      unsubscribe();
    };
  }, [cardForm]);

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

      try {
        // Use postMessage to communicate with the iframe instead of direct property access
        // Create a listener for the validation result
        const validationPromise = new Promise<boolean>((resolve, reject) => {
          const handleMessage = (event: MessageEvent) => {
            // Make sure the message is from our iframe
            if (event.source !== iframeElement.contentWindow) return;

            // Handle validation result
            if (event.data?.type === "VALIDATION_RESULT") {
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
        });

        // Send the validation request message to the iframe
        iframeElement.contentWindow.postMessage(
          {
            type: "VALIDATE_FORM",
            url: session.url,
          },
          "*"
        );

        // Wait for the validation result
        const isValid = await validationPromise;
        if (!isValid) {
          return;
        }

        // Success will be captured by the cardForm.subscribe handler
      } catch (error) {
        console.error("Error validating card form:", error);
      }

      // TODO: Fetch the payment method id from the card form and create a payment
    },
    [cardForm, session]
  );

  // Function to validate both checkout form and card form
  const validateBothForms = useCallback(async () => {
    // Get the iframe element
    const iframeElement = document.querySelector("iframe");
    if (!iframeElement || !iframeElement.contentWindow) {
      console.error("Card form iframe not found");
      return;
    }

    let checkoutFormValid = false;
    let cardFormValid = false;
    let checkoutFormErrors: string[] = [];

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
    let cardFormErrors: string[] = [];
    try {
      // Create a listener for the validation result
      const validationPromise = new Promise<{
        isValid: boolean;
        errors: string[];
        firstErrorField?: string;
      }>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          // Make sure the message is from our iframe
          if (event.source !== iframeElement.contentWindow) return;

          // Check for validation results in the hello event
          if (
            event.data?.type === "CARD_FORM_HELLO" &&
            event.data?.data?.message === "validation_result"
          ) {
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

              resolve({
                isValid: false,
                errors: errorFields,
                firstErrorField,
              });
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
      });

      // Send the validation request message to the iframe
      iframeElement.contentWindow.postMessage(
        {
          type: "VALIDATE_FORM",
          url: session.url,
        },
        "*"
      );

      // Wait for the validation result
      const result = await validationPromise;
      cardFormValid = result.isValid;
      cardFormErrors = result.errors;

      if (!cardFormValid) {
        console.error("Card form validation failed");
      }
    } catch (error) {
      console.error("Error validating card form:", error);
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

        // Then send a message to focus on the first error field
        const firstCardErrorField = cardFormErrors[0];
        if (firstCardErrorField) {
          setTimeout(() => {
            iframeElement.contentWindow?.postMessage(
              {
                type: "FOCUS_FIELD",
                url: session.url,
                data: { fieldName: firstCardErrorField },
              },
              "*"
            );
          }, 100);
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
    () => ({ form, submit, validateBothForms, isReady, isSubmitting, events }),
    [form, submit, validateBothForms, isReady, isSubmitting, events]
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
