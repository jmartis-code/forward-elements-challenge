import { NextRequest, NextResponse } from "next/server";
import { CreatePaymentSessionRequest } from "@fwd/elements-types";
import { addCorsHeaders } from "../cors";
import { sessions } from "./store";

// Helper to add CORS headers
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(req: NextRequest) {
  try {
    // Extract the authorization header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid or missing authorization header" },
          { status: 401 }
        )
      );
    }

    const apiKey = authHeader.split(" ")[1];
    
    if (!process.env.ELEMENTS_API_KEY || apiKey !== process.env.ELEMENTS_API_KEY) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid API key" },
          { status: 401 }
        )
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    const result = CreatePaymentSessionRequest.safeParse(body);
    
    if (!result.success) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Bad Request",
            message: "Invalid request body",
            details: result.error.format()
          },
          { status: 400 }
        )
      );
    }

    const { amount, currency, methods, referenceId, metadata } = result.data;

    // Create a new session
    const sessionId = crypto.randomUUID();
    
    const session = {
      id: sessionId,
      amount,
      currency,
      methods,
      reference_id: referenceId,
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Store the session
    sessions[sessionId] = session;

    // Add the URL to the response (but not to the store object)
    const baseUrl = process.env.NEXT_PUBLIC_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const responseData = {
      ...session,
      url: `${baseUrl}/payment-session/${sessionId}`
    };

    // Return the session
    return addCorsHeaders(
      NextResponse.json(responseData, { status: 201 })
    );
  } catch (error) {
    console.error("Failed to create payment session:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Internal Server Error", message: "Failed to create payment session" },
        { status: 500 }
      )
    );
  }
} 