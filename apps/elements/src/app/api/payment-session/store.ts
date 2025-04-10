// Define the session type
export type PaymentSession = {
  id: string;
  amount: number;
  currency: "usd";
  methods?: ("card" | "apple-pay" | "google-pay" | "ach-debit")[];
  reference_id?: string;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
};

// Create a global variable to ensure persistence between API calls
declare global {
  // eslint-disable-next-line no-var
  var _sessions: Record<string, PaymentSession> | undefined;
}

// Initialize the global store if it doesn't exist
if (!global._sessions) {
  global._sessions = {};
  console.log("Initialized global session store");
}

// Export the sessions from the global variable
export const sessions = global._sessions;

// Helper functions with logging
export function addSession(session: PaymentSession): void {
  sessions[session.id] = session;
  console.log(`Added session ${session.id} to store. Current session count: ${Object.keys(sessions).length}`);
  console.log("Available sessions:", Object.keys(sessions));
}

export function getSession(id: string): PaymentSession | undefined {
  const session = sessions[id];
  if (session) {
    console.log(`Found session ${id} in store`);
  } else {
    console.log(`Session ${id} not found in store`);
    console.log("Available sessions:", Object.keys(sessions));
  }
  return session;
} 