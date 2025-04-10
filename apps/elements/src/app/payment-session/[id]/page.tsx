"use client";

// import { CardDataForm } from "../../../lib/payment-session/components/card-data-form";
// import { PaymentSessionEventListener } from "./event-listener";

import { CardDataForm } from "@/lib/payment-session/components/card-data-form";
import { IframeStyles } from "@/lib/payment-session/components/iframe-styles";
import { useEffect, useState } from "react";

export type PaymentSessionPageProps = {
  params: { id: string };
  searchParams: Record<string, string | string[]>;
};

export default function PaymentSessionPage({
  params,
  searchParams,
}: PaymentSessionPageProps) {
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create search params string from all parameters
  const searchParamsString = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParamsString.append(key, v));
    } else {
      searchParamsString.append(key, value);
    }
  });

  // Log the search params for debugging
  console.log("Payment session search params:", searchParams);
  console.log("Formatted search params string:", searchParamsString.toString());

  // Create the session URL using the NEXT_PUBLIC_URL env variable and include search params
  const searchString = searchParamsString.toString();
  const url = `${
    process.env.NEXT_PUBLIC_URL || window.location.origin
  }/payment-session/${id}${searchString ? `?${searchString}` : ""}`;

  console.log("Final session URL with params:", url);

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
      <div className="w-full" style={{ minHeight: "350px", height: "350px" }}>
        <CardDataForm sessionUrl={url} />
      </div>
    </>
  );
}
