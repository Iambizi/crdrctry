import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('Successfully authenticated with PocketBase');
  } catch (error) {
    console.error('Failed to authenticate with PocketBase:', error);
    throw error;
  }
}

async function deleteAllRecords(collection: string) {
  try {
    // Keep deleting records until none are left
    while (true) {
      const records = await pb.collection(collection).getFullList();
      if (records.length === 0) {
        console.log(`No more records in ${collection}`);
        break;
      }
      
      console.log(`Found ${records.length} records in ${collection}, deleting...`);
      
      // Delete records in batches of 100
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await Promise.all(
          batch.map(record => 
            pb.collection(collection).delete(record.id)
              .catch(err => {
                console.error(`Failed to delete record ${record.id}:`, err);
                throw err; // Re-throw to stop the process
              })
          )
        );
        console.log(`Deleted ${batch.length} records from ${collection}`);
      }
    }
    
    // Double-check deletion
    const remaining = await pb.collection(collection).getFullList();
    if (remaining.length > 0) {
      throw new Error(`Failed to delete all records from ${collection}. ${remaining.length} records remaining.`);
    }
    
    console.log(`Successfully cleaned up ${collection}`);
  } catch (error) {
    console.error(`Error cleaning up ${collection}:`, error);
    throw error; // Re-throw to stop the process
  }
}

async function resetDatabase() {
  try {
    // First authenticate
    await authenticateAdmin();
    
    // Then delete records from all collections in sequence
    const collections = ['tenures', 'designers', 'brands', 'relationships'];
    
    for (const collection of collections) {
      console.log(`\nResetting collection: ${collection}`);
      await deleteAllRecords(collection);
    }
    
    console.log('\nDatabase reset complete');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
