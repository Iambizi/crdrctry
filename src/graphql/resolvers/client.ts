import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create PocketBase client
export const pb = new PocketBase(process.env.POCKETBASE_URL);

// Authenticate with PocketBase
export async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('🔐 Successfully authenticated with PocketBase');
  } catch (error) {
    console.error('❌ Failed to authenticate with PocketBase:', error);
    throw error;
  }
}

// Call authentication immediately
authenticateAdmin();
