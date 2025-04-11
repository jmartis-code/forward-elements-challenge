'use server';

import { 
  ElementsContract, 
  CreatePaymentSessionRequest, 
  CreatePaymentRequest 
} from '@fwd/elements-types';
import { initClient } from '@ts-rest/core';

// Constants
// According to README, the API key is test123
const API_KEY = 'test123';
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Initialize the contract client for server-side use
const client = initClient(ElementsContract, {
  baseUrl: BASE_URL,
  baseHeaders: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

/**
 * Creates a payment session - server side only to protect API key
 */
export async function createPaymentSession(data: CreatePaymentSessionRequest) {
  try {
    const response = await client.createPaymentSession({
      body: data
    });
    
    if (response.status !== 201) {
      throw new Error(`Failed to create payment session: ${response.status}`);
    }

    return response.body;
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
}

/**
 * Creates a payment using the token - server side only to protect API key
 */
export async function createPayment(data: CreatePaymentRequest) {
  try {
    console.log('Payment request data:', JSON.stringify(data, null, 2));
    
    const response = await client.createPayment({
      body: data
    });

    console.log('Payment API response status:', response.status);
    
    if (response.status !== 201) {
      console.error('Payment API error response:', JSON.stringify(response.body, null, 2));
      throw new Error(`Failed to create payment: ${response.status}`);
    }

    return response.body;
  } catch (error) {
    console.error('Error creating payment:', error);
    
    // If it's a response error with details
    if (error instanceof Error && 'response' in (error as any)) {
      const responseError = error as any;
      console.error('Response error details:', responseError.response);
      
      if (responseError.response && responseError.response.body) {
        console.error('Response body:', JSON.stringify(responseError.response.body, null, 2));
      }
    }
    
    throw error;
  }
} 