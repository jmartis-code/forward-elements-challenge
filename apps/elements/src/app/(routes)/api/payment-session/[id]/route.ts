import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "../../cors";

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
    
    // Forward the request to the elements implementation
    const response = await fetch(`${req.nextUrl.origin}/api/elements/payment-session/${id}`, {
      method: "GET",
      headers: req.headers
    });

    // Add CORS headers to the response
    return addCorsHeaders(new NextResponse(response.body, {
      status: response.status,
      headers: response.headers
    }));
  } catch (error) {
    console.error("Error in payment session proxy:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Internal Server Error", message: "Failed to retrieve payment session" },
        { status: 500 }
      )
    );
  }
} 