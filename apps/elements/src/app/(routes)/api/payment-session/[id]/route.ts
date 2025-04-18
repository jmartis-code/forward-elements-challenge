import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "../../cors";
import { getSession } from "../store";
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
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid or missing authorization header" },
          { status: 401 }
        )
      );
    }

    const apiKey = authHeader.split(" ")[1];
    
    if (apiKey !== serverEnv.ELEMENTS_API_KEY) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Invalid API key" },
          { status: 401 }
        )
      );
    }

    const session = getSession(params.id);
    if (!session) {
      return addCorsHeaders(
        NextResponse.json(
          { error: "Not Found", message: "Session not found" },
          { status: 404 }
        )
      );
    }

    return addCorsHeaders(NextResponse.json(session));
  } catch (error) {
    console.error("Error retrieving session:", error);
    return addCorsHeaders(
      NextResponse.json(
        { error: "Internal Server Error", message: "Failed to retrieve session" },
        { status: 500 }
      )
    );
  }
} 