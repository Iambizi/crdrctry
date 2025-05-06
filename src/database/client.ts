import PocketBase from 'pocketbase';
import 'dotenv/config';

const POCKETBASE_URL = process.env.POCKETBASE_URL;
if (!POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL environment variable is required');
}

// Initialize PocketBase client
export async function initPocketBase(): Promise<PocketBase> {
  const client = new PocketBase(POCKETBASE_URL);
  
  try {
    const email = process.env.POCKETBASE_ADMIN_EMAIL;
    const password = process.env.POCKETBASE_ADMIN_PASSWORD;
    
    if (!email || !password) {
      throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables are required');
    }

    // Try to authenticate as admin
    const authData = await client.admins.authWithPassword(email, password);
    console.log('Successfully authenticated with PocketBase');

    // Set the auth store to persist the token
    client.authStore.save(authData.token, authData.record);

    // Verify that we have admin access
    if (!client.authStore.isValid) {
      throw new Error('Failed to authenticate with PocketBase');
    }

    return client;
  } catch (error) {
    console.error('Failed to authenticate with PocketBase:', error);
    throw error;
  }
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
  callback: (client: PocketBase) => Promise<T>,
  existingClient?: PocketBase
): Promise<T> {
  const client = existingClient || await initPocketBase();
  try {
    return await callback(client);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Database error:', error.message);
    } else {
      console.error('Unknown database error:', error);
    }
    throw error;
  }
}

// Export the PocketBase instance
export const pb = await initPocketBase();

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const client = await initPocketBase();
      console.log('Successfully connected to PocketBase');
      
      // Test listing collections
      const collections = await client.collections.getList(1, 50);
      console.log('Collections:', collections.items.map(c => c.name));
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  })();
}
