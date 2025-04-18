import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "../../../cors";
import { sessions } from "../../../payment-session/store";
import { serverEnv } from "@/lib/config/env";

// Helper to add CORS headers
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// GET handler to retrieve a session by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the authorization header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid or missing authorization header" },
          { status: 401 }
        )
      );
    }

    const apiKey = authHeader.split(" ")[1];
    const expectedKey = serverEnv.ELEMENTS_API_KEY;
    
    console.log("Received API key:", apiKey);
    console.log("Expected API key:", expectedKey);
    
    if (apiKey !== expectedKey) {
      console.log("API key mismatch");
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid API key" },
          { status: 401 }
        )
      );
    }

    const { id } = params;
    
    console.log(`GET request for session ID: ${id}`);
    
    // Special handling for test-session
    if (id === 'test-session') {
      // Return a mock session for testing
      const mockSession = {
        id: 'test-session',
        amount: 1000,
        currency: 'usd' as const,
        methods: ['card' as const],
        reference_id: `test-order-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Serving test session:", mockSession);
      
      const baseUrl = process.env.NEXT_PUBLIC_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const responseData = {
        ...mockSession,
        url: `${baseUrl}/payment-session/test-session`
      };
      
      return addCorsHeaders(NextResponse.json(responseData));
    }
    
    // For non-test sessions, return a standard response
    const session = {
      id,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    return addCorsHeaders(
      NextResponse.json(session, { status: 200 })
    );
  } catch (error) {
    console.error("Failed to get payment session:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Internal Server Error", message: "Failed to retrieve payment session" },
        { status: 500 }
      )
    );
  }
}