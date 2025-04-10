import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await global.PaymentSessionStore.getById(id);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching payment session:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment session" },
      { status: 500 }
    );
  }
} 