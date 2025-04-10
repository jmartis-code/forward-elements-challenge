import { z } from "zod";

export const ErrUnknownEvent = "Unknown event type";
export const ErrUnknownError = "Unknown error";
export const ErrValidation = "Validation error";

export const EvtReady = "CARD_FORM_READY";
export const EvtSuccess = "CARD_FORM_SUCCESS";
export const EvtError = "CARD_FORM_ERROR";
export const EvtSubmit = "CARD_FORM_SUBMIT";
export const EvtHello = "CARD_FORM_HELLO";
export const EvtValidationResult = "VALIDATION_RESULT";

export const CardFormSuccessEvent = z.object({
  url: z.string(),
  type: z.literal(EvtSuccess).default(EvtSuccess),
  data: z.object({
    methodId: z.string(),
  }),
});
export type CardFormSuccessEvent = z.infer<typeof CardFormSuccessEvent>;

export const CardFormErrorEvent = z.object({
  url: z.string(),
  type: z.literal(EvtError).default(EvtError),
  data: z.object({
    error: z.union([
      z.literal(ErrUnknownEvent),
      z.literal(ErrUnknownError),
      z.literal(ErrValidation),
    ]),
    message: z.string().optional(),
    field: z.string().optional(),
  }),
});
export type CardFormErrorEvent = z.infer<typeof CardFormErrorEvent>;

export const CardFormSubmitEvent = z.object({
  url: z.string(),
  type: z.literal(EvtSubmit).default(EvtSubmit),
});
export type CardFormSubmitEvent = z.infer<typeof CardFormSubmitEvent>;

export const CardFormReadyEvent = z.object({
  url: z.string(),
  type: z.literal(EvtReady).default(EvtReady),
});
export type CardFormReadyEvent = z.infer<typeof CardFormReadyEvent>;

export const CardFormHelloEvent = z.object({
  url: z.string(),
  type: z.literal(EvtHello).default(EvtHello),
  data: z.object({
    message: z.string(),
  }),
});
export type CardFormHelloEvent = z.infer<typeof CardFormHelloEvent>;

export const CardFormValidationResultEvent = z.object({
  url: z.string(),
  type: z.literal(EvtValidationResult).default(EvtValidationResult),
  data: z.object({
    isValid: z.boolean(),
    firstErrorField: z.string().optional(),
    errors: z.record(z.any()).optional(),
    errorMessages: z.record(z.string()).optional(),
  }),
});
export type CardFormValidationResultEvent = z.infer<typeof CardFormValidationResultEvent>;

export type CardFormEvent =
  | CardFormSuccessEvent
  | CardFormErrorEvent
  | CardFormSubmitEvent
  | CardFormReadyEvent
  | CardFormHelloEvent
  | CardFormValidationResultEvent;
