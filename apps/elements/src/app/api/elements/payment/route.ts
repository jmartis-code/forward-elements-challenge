import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "../../cors";
import z from "zod";

// Payment request schema
const PaymentRequest = z.object({
  session_id: z.string(),
  method_id: z.string(),
  amount: z.number().positive(),
  payor: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }),
  }),
  reference_id: z.string().optional(),
});

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
    
    if (apiKey !== "test123") {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid API key" },
          { status: 401 }
        )
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    const result = PaymentRequest.safeParse(body);
    
    if (!result.success) {
      console.log("Validation error:", result.error.format());
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

    const { session_id, method_id, amount, payor, reference_id } = result.data;

    // In a real system, you would process the payment with a payment processor
    // For this implementation, we'll just return a success response
    console.log("Processing payment for session:", session_id);

    // Create payment response
    const payment = {
      id: crypto.randomUUID(),
      session_id,
      method_id,
      amount,
      currency: "usd",
      status: "succeeded",
      payor: {
        name: `${payor.firstName} ${payor.lastName}`,
        email: payor.email,
        phone: payor.phone,
      },
      reference_id: reference_id || `payment-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    // Return the payment response
    return addCorsHeaders(
      NextResponse.json(payment, { status: 201 })
    );
  } catch (error) {
    console.error("Failed to process payment:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Internal Server Error", message: "Failed to process payment" },
        { status: 500 }
      )
    );
  }
} 