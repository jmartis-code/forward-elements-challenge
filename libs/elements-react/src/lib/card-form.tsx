"use client";

import * as React from "react";

import { EvtError, EvtReady, EvtSubmit, EvtSuccess } from "@fwd/elements-types";
import { CardForm as CardFormCore } from "@fwd/elements-js";
import { createContext } from "react";
import { cn } from "@fwd/ui/lib/utils";

export interface CardFormContextType {
  methodId: string | null;
  isReady: boolean;
  isSubmitting: boolean;
  isError: boolean;
  form: CardFormCore;
}
export const CardFormContext = createContext<CardFormContextType | null>(null);

export interface CardFormProviderProps {
  sessionUrl: string;
  children: React.ReactNode;
}

export const CardFormProvider = ({
  children,
  sessionUrl,
}: CardFormProviderProps) => {
  const [methodId, setMethodId] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const form = React.useMemo(
    () =>
      new CardFormCore({
        sessionUrl,
      }),
    [sessionUrl]
  );

  React.useEffect(() => {
    const unsubscribe = form.subscribe((event) => {
      if (event.type === EvtSuccess) {
        setMethodId(event.data.methodId);
      }
      if (event.type === EvtError) {
        setIsError(true);
      }
      if (event.type === EvtSubmit) {
        setIsSubmitting(true);
      }
      if (event.type === EvtReady) {
        setIsReady(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [form]);

  const context = React.useMemo(
    () => ({
      methodId,
      isReady,
      isSubmitting,
      isError,
      form,
    }),
    [methodId, isReady, isSubmitting, isError, form]
  );

  return (
    <CardFormContext.Provider value={context}>
      {children}
    </CardFormContext.Provider>
  );
};

export const useCardForm = () => {
  const form = React.useContext(CardFormContext);
  if (!form) {
    throw new Error("CardFormContext not found");
  }
  return form;
};

export const CardInput = ({ className }: { className?: string }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const { form, isReady } = useCardForm();

  // Ensure the form is mounted whenever the ref or form changes
  React.useEffect(() => {
    if (!ref.current) {
      console.log("Ref not available yet, waiting...");
      return;
    }

    console.log("Mounting card form to DOM element");
    try {
      form.mount(ref.current);
      setIsMounted(true);
      console.log("Card form mounted successfully");
    } catch (error) {
      console.error("Error mounting card form:", error);
      setIsMounted(false);
    }

    return () => {
      console.log("Unmounting card form");
      try {
        form.unmount();
        setIsMounted(false);
        console.log("Card form unmounted successfully");
      } catch (error) {
        console.error("Error unmounting card form:", error);
      }
    };
  }, [ref, form]);

  // Handle ready state
  React.useEffect(() => {
    if (isReady && isMounted) {
      console.log("Card form is ready, sending hello message");
      try {
        form.hello("Hello from parent window");
      } catch (error) {
        console.error("Error sending hello message:", error);
      }
    }
  }, [isReady, form, isMounted]);

  return (
    <div
      ref={ref}
      className={cn("elements-card-input", className)}
      style={{
        minHeight: "500px",
        height: "500px",
        border: "1px solid #e2e8f0",
        borderRadius: "0.375rem",
      }}
    />
  );
};
