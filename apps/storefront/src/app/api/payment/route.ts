import { NextRequest, NextResponse } from 'next/server';
import { createPayment } from '@/lib/server/api-service';
import { CreatePaymentRequest } from '@fwd/elements-types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const result = CreatePaymentRequest.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: result.error.format()
        },
        { status: 400 }
      );
    }

    // Call the server-side function that has access to the API key
    const payment = await createPayment(result.data);
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to create payment'
      },
      { status: 500 }
    );
  }
} 