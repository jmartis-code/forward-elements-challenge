// Environment variable configuration with validation

// Server-side only environment variables
export const serverEnv = {
  ELEMENTS_API_KEY: (() => {
    const apiKey = process.env.ELEMENTS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEMENTS_API_KEY is required - Please set it in your environment variables');
    }
    return apiKey;
  })(),
};

// Public environment variables (accessible in browser)
export const publicEnv = {
  APP_URL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
};

// Type definitions for environment variables
export type ServerEnv = typeof serverEnv;
export type PublicEnv = typeof publicEnv; 