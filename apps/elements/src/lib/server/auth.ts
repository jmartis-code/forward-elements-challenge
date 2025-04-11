import { serverEnv } from '../config/env';

export const requireAuth = (headers: { authorization: string }) => {
  const key = headers.authorization?.split(" ")[1];
  if (!key) {
    return {
      status: 401 as const,
      body: { error: "Unauthorized" as const, message: "Invalid API key" },
    };
  }

  if (key !== serverEnv.ELEMENTS_API_KEY) {
    return {
      status: 403 as const,
      body: { error: "Forbidden" as const, message: "Invalid API key" },
    };
  }

  return;
};
