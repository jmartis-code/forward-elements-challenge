import { ElementsContract } from '@fwd/elements-types';
import { initQueryClient } from '@ts-rest/react-query';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const tsr = initQueryClient(ElementsContract, {
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  jsonQuery: true,
});
