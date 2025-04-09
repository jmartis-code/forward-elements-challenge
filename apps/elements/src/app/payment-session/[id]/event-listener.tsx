"use client";

import {
  CardFormEvent,
  EvtError,
  EvtHello,
  EvtReady,
  EvtSubmit,
  EvtSuccess,
} from "@fwd/elements-types";
import { useEffect, useRef, useState } from "react";

function isCardFormEvent(event: unknown): event is CardFormEvent {
  if (typeof event !== "object" || event === null) {
    return false;
  }

  return (
    "type" in event &&
    typeof event.type === "string" &&
    [EvtSuccess, EvtError, EvtSubmit, EvtReady, EvtHello].includes(event.type)
  );
}

export function PaymentSessionEventListener({
  sessionUrl,
}: {
  sessionUrl: string;
}) {
  const frame = useRef<Window>(null);
  const parent = useRef<Window>(null);
  const [messages, setMessages] = useState<MessageEvent[]>([]);

  useEffect(() => {
    if (!parent.current) {
      frame.current = window;
      parent.current = window.parent;
      frame.current.addEventListener("message", (event) => {
        if (isCardFormEvent(event.data)) {
          setMessages((prev) => [...prev, event]);
        }
      });

      parent.current.postMessage({ type: EvtReady, url: sessionUrl }, "*");
    }
  }, []);

  return (
    <div className="font-mono text-xs px-4">
      {messages.length === 0 && (
        <div>
          <p>Waiting for parent window...</p>
        </div>
      )}
      {messages.length > 0 && (
        <div>
          <span>Events from parent window:</span>
          <pre>
            {messages.map((message, idx) => (
              <div key={idx}>{JSON.stringify(message.data, null, 2)}</div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
