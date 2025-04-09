import { z } from "zod";
import { Element, type Logger } from "./element";
import {
  CardFormEvent,
  CardFormErrorEvent,
  CardFormSuccessEvent,
  CardFormSubmitEvent,
  CardFormReadyEvent,
  CardFormHelloEvent,
  EvtReady,
  EvtSuccess,
  EvtError,
  EvtSubmit,
  ErrUnknownEvent,
  ErrUnknownError,
  EvtHello,
} from "@fwd/elements-types";

export type CardFormEventType = CardFormEvent["type"];
export type CardFormEventListener = (event: CardFormEvent) => void;
export type CardFormError = CardFormErrorEvent["data"]["error"];

const getErrorEvent = (url: string, error: CardFormError, message?: string) => {
  return CardFormErrorEvent.parse({
    url,
    type: "error",
    data: { error, message },
  });
};

export interface CardFormConfig {
  sessionUrl: string;
  onReady?: () => void;
  onSuccess?: (methodId: string) => void;
  onError?: (error: CardFormError, message?: string) => void;
  onSubmit?: () => void;
}

export class CardForm extends Element<CardFormEvent, CardFormEventListener> {
  #config: CardFormConfig;

  constructor(config: CardFormConfig, logger?: Logger) {
    super(config.sessionUrl, logger);
    this.#config = config;
  }

  protected override handleMessage(event: MessageEvent) {
    const url = (event.data as { url: string })?.url;
    if (url !== this.url) {
      return;
    }

    if (event.origin !== this.origin) {
      return;
    }

    try {
      const type = (event.data as CardFormEvent).type;

      switch (type) {
        case EvtReady: {
          this.emit(CardFormReadyEvent.parse(event.data));
          this.#config.onReady?.();
          break;
        }
        case EvtSuccess: {
          const payload = CardFormSuccessEvent.parse(event.data);
          this.emit(payload);
          this.#config.onSuccess?.(payload.data.methodId);
          break;
        }
        case EvtError: {
          const payload = CardFormErrorEvent.parse(event.data);
          this.emit(payload);
          this.#config.onError?.(payload.data.error, payload.data.message);
          break;
        }
        case EvtSubmit: {
          this.emit(CardFormSubmitEvent.parse(event.data));
          this.#config.onSubmit?.();
          break;
        }
        case EvtHello: {
          this.emit(CardFormHelloEvent.parse(event.data));
          break;
        }
        default: {
          this.logger.warn(`Unknown event type: ${type}`);
          this.emit(
            getErrorEvent(
              this.url,
              ErrUnknownEvent,
              `Unknown event type: ${type}`
            )
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error parsing event: ${error}`);
      this.emit(
        getErrorEvent(
          this.url,
          ErrUnknownError,
          `Error parsing event: ${error}`
        )
      );
    }
  }

  public async submit(): Promise<{ methodId: string }> {
    this.logger.log("Submitting card form");
    const payload = CardFormSubmitEvent.parse({
      url: this.url,
      type: EvtSubmit,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error("Timeout"));
      }, 3000);

      const unsubscribe = this.subscribe((event) => {
        if (event.type === EvtSuccess) {
          clearTimeout(timeout);
          resolve(CardFormSuccessEvent.parse(event).data);
          unsubscribe();
        }
      });

      this.sendMessage(payload);
    });
  }

  public async hello(message: string) {
    const payload = CardFormHelloEvent.parse({
      url: this.url,
      data: { message },
    });
    this.sendMessage(payload);
  }
}
