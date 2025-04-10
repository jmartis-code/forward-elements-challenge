import { ElementsContract } from '@fwd/elements-types';
import { initQueryClient } from '@ts-rest/react-query';
import { initClient } from '@ts-rest/core';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const tsr = initQueryClient(ElementsContract, {
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test123'
  },
  jsonQuery: true,
});

// Direct client for usage outside React Query
export const client = initClient(ElementsContract, {
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test123'
  },
  jsonQuery: true,
});
