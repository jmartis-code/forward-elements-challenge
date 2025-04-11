import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "../../../cors";
import { getSession } from "../../../payment-session/store";

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
    
    // Retrieve the session using the improved getter function
    const session = getSession(id);
    
    if (!session) {
      console.log(`Session ${id} not found, returning 404`);
      return addCorsHeaders(
        NextResponse.json(
          { error: "Not Found", message: "Session not found" },
          { status: 404 }
        )
      );
    }
    
    // Add the URL to the response
    const baseUrl = process.env.NEXT_PUBLIC_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const responseData = {
      ...session,
      url: `${baseUrl}/payment-session/${id}`
    };
    
    console.log(`Successfully retrieved session ${id}:`, responseData);
    
    return addCorsHeaders(
      NextResponse.json(responseData, { status: 200 })
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