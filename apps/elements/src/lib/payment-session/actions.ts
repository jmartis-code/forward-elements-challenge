'use server';

import { serverEnv } from "@/lib/config/env";

export async function validateSession(sessionId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/payment-session/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${serverEnv.ELEMENTS_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Session validation failed: ${response.statusText}`);
  }

  return await response.json();
} 