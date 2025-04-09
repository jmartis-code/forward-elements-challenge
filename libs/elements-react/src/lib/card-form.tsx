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
  const { form, isReady } = useCardForm();

  React.useEffect(() => {
    if (ref.current) {
      form.mount(ref.current);
    }

    return () => {
      form.unmount();
    };
  }, [ref]);

  React.useEffect(() => {
    if (isReady) {
      form.hello("Hello from parent window");
    }
  }, [isReady]);

  return (
    <div
      ref={ref}
      className={cn("elements-card-input border border-dashed", className)}
    />
  );
};
