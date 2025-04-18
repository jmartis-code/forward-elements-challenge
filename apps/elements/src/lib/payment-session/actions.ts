'use server';

import { headers } from 'next/headers';

export async function validateSession(sessionId: string) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.split(' ')[1];
    const expectedKey = process.env.ELEMENTS_API_KEY;
    
    if (!token || token !== expectedKey) {
      throw new Error('Invalid API key');
    }

    // Fetch the session from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/elements/payment-session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${expectedKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to validate session');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error validating session:', error);
    throw error;
  }
} 