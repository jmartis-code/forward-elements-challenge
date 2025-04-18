"use client";

// import { CardDataForm } from "../../../lib/payment-session/components/card-data-form";
// import { PaymentSessionEventListener } from "./event-listener";

import { CardDataForm } from "@/lib/payment-session/components/card-data-form";
import { IframeStyles } from "@/lib/payment-session/components/iframe-styles";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { validateSession } from "@/lib/payment-session/actions";

export interface Session {
  id: string;
  status: string;
  createdAt: string;
}

export default function PaymentSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Construct search parameters string
  const searchParamsString = Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  // Construct session URL
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const sessionUrl = `${baseUrl}/payment-session/${params.id}${
    searchParamsString ? `?${searchParamsString}` : ""
  }`;

  useEffect(() => {
    async function validate() {
      try {
        const data = await validateSession(params.id as string);
        setSession(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    }

    validate();
  }, [params.id]);

  if (isLoading) {
    return <div className="p-4">Loading session...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!session) {
    return <div className="p-4">No session found</div>;
  }

  return (
    <>
      <IframeStyles />
      <CardDataForm sessionUrl={sessionUrl} session={session} />
    </>
  );
}
