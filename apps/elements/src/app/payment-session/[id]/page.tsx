"use client";

// import { CardDataForm } from "../../../lib/payment-session/components/card-data-form";
// import { PaymentSessionEventListener } from "./event-listener";

import { CardDataForm } from "@/lib/payment-session/components/card-data-form";
import { IframeStyles } from "@/lib/payment-session/components/iframe-styles";
import { useEffect, useState } from "react";

export type PaymentSessionPageProps = {
  params: { id: string };
};

export default function PaymentSessionPage({
  params,
}: PaymentSessionPageProps) {
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create the session URL using the NEXT_PUBLIC_URL env variable
  const url = `${
    process.env.NEXT_PUBLIC_URL || window.location.origin
  }/payment-session/${id}`;

  useEffect(() => {
    // For test-session id, skip the fetch and proceed immediately
    if (id === "test-session") {
      setIsLoading(false);
      return;
    }

    // Fetch the session data from our API endpoint
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/payment-session/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch session");
        }

        // Session exists, so we can proceed
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (isLoading) {
    return <div className="p-4">Loading session...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <IframeStyles />
      <div className="p-4 min-h-screen" style={{ height: "100vh" }}>
        <CardDataForm sessionUrl={url} />
      </div>
    </>
  );
}
