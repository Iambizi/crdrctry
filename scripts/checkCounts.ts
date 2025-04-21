import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pb = new PocketBase(process.env.POCKETBASE_URL);
  
  // Authenticate
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );

  // Get counts
  const brands = await pb.collection('fd_brands').getList(1, 1);
  const designers = await pb.collection('fd_designers').getList(1, 1);
  const tenures = await pb.collection('fd_tenures').getList(1, 1);
  const relationships = await pb.collection('fd_relationships').getList(1, 1);

  console.log('Current Record Counts:');
  console.log('---------------------');
  console.log(`Brands: ${brands.totalItems}`);
  console.log(`Designers: ${designers.totalItems}`);
  console.log(`Tenures: ${tenures.totalItems}`);
  console.log(`Relationships: ${relationships.totalItems}`);
}

main().catch(console.error);
