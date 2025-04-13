import PocketBase from 'pocketbase';

// Initialize PocketBase client
export async function initPocketBase(): Promise<PocketBase> {
  if (!process.env.POCKETBASE_URL) {
    throw new Error("Missing POCKETBASE_URL environment variable");
  }
  
  return new PocketBase(process.env.POCKETBASE_URL);
}

// Helper function to check database connection
export async function checkConnection(): Promise<boolean> {
  try {
    const client = await initPocketBase();
    const health = await client.health.check();
    return health.code === 200;
  } catch (err) {
    console.error("Failed to connect to database:", err);
    return false;
  }
}

// Utility function for handling database errors
export function handleDatabaseError(error: Error & { data?: unknown; status?: number }): never {
  // Log the error details
  console.error("Database operation failed:", {
    message: error.message,
    details: error.data,
    status: error.status,
  });

  // Throw a standardized error
  throw new Error(`Database operation failed: ${error.message}`);
}

// Type-safe transaction helper
export async function withTransaction<T>(
  operation: (client: PocketBase) => Promise<T>
): Promise<T> {
  try {
    const client = await initPocketBase();
    const result = await operation(client);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      handleDatabaseError(error as Error & { data?: unknown; status?: number });
    }
    throw error;
  }
}
