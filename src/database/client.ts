import PocketBase, { ClientResponseError } from "pocketbase";

if (!process.env.POCKETBASE_URL) {
  throw new Error("Missing POCKETBASE_URL environment variable");
}

export const pb = new PocketBase(process.env.POCKETBASE_URL);

// Helper function to check database connection
export async function checkConnection(): Promise<boolean> {
  try {
    // Try to get the health status of the server
    const health = await pb.health.check();
    return health.code === 200;
  } catch (err) {
    console.error("Failed to connect to database:", err);
    return false;
  }
}

// Utility function for handling database errors
export function handleDatabaseError(error: Error | ClientResponseError): never {
  // Log the error details
  console.error("Database operation failed:", {
    message: error.message,
    details: error instanceof ClientResponseError ? error.data : undefined,
    status: error instanceof ClientResponseError ? error.status : undefined,
  });

  // Throw a standardized error
  throw new Error(`Database operation failed: ${error.message}`);
}

// Type-safe transaction helper
export async function withTransaction<T>(
  operation: (client: typeof pb) => Promise<T>
): Promise<T> {
  try {
    const result = await operation(pb);
    return result;
  } catch (error) {
    // Type guard for error handling
    if (error instanceof Error || error instanceof ClientResponseError) {
      handleDatabaseError(error);
    }
    // If it's not a known error type, throw a generic error
    throw new Error("An unknown error occurred");
  }
}
