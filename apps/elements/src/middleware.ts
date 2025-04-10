import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse) {
  // Allow requests from any origin
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export function middleware(request: NextRequest) {
  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();
  return addCorsHeaders(response);
}

export const config = {
  matcher: ['/api/:path*', '/payment-session/:path*'],
}; 