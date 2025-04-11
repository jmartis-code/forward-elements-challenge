import { ElementsContract } from '@fwd/elements-types';
import { initQueryClient } from '@ts-rest/react-query';
import { initClient } from '@ts-rest/core';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Client for client-side operations - NO AUTH HEADER
// Only use this for non-sensitive operations and public endpoints
export const tsr = initQueryClient(ElementsContract, {
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test123'
  },
  jsonQuery: true,
});

// Direct client for client-side usage outside React Query
// Only use this for non-sensitive operations and public endpoints
export const client = initClient(ElementsContract, {
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test123'
  },
  jsonQuery: true,
});
