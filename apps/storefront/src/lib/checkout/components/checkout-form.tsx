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

  const onSubmitSuccess: SubmitHandler<CheckoutFormSchema> = useCallback(
    async (data) => {
      // TODO: Fetch the payment method id from the card form and create a payment
    },
    [cardForm, session]
  );

  const submit = form.handleSubmit(onSubmitSuccess);
  const context = useMemo(
    () => ({ form, submit, isReady, isSubmitting, events }),
    [form, submit, isReady, isSubmitting, events]
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
