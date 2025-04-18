import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "../cors";

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(req: NextRequest) {
  try {
    // Forward the request to the elements implementation
    const response = await fetch(`${req.nextUrl.origin}/api/elements/payment-session`, {
      method: "POST",
      headers: req.headers,
      body: req.body
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
        { error: "Internal Server Error", message: "Failed to create payment session" },
        { status: 500 }
      )
    );
  }
} 