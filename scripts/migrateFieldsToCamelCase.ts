import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Field name mappings
const designerFieldMap = {
  current_role: 'currentRole',
  is_active: 'isActive',
  image_url: 'imageUrl',
  birth_year: 'birthYear',
  death_year: 'deathYear',
  signature_styles: 'signatureStyles',
  social_media: 'socialMedia',
};

const brandFieldMap = {
  founding_year: 'foundedYear',
  parent_company: 'parentCompany',
  logo_url: 'logoUrl',
  social_media: 'socialMedia',
};

const tenureFieldMap = {
  start_year: 'startYear',
  end_year: 'endYear',
  is_current_role: 'isCurrentRole',
  notable_works: 'notableWorks',
  notable_collections: 'notableCollections',
  impact_description: 'impactDescription',
};

const relationshipFieldMap = {
  source_designer: 'sourceDesigner',
  target_designer: 'targetDesigner',
  start_year: 'startYear',
  end_year: 'endYear',
  collaboration_projects: 'collaborationProjects',
};

// Convert object fields from snake_case to camelCase
function convertFields(obj: Record<string, unknown>, fieldMap: Record<string, string>): Record<string, unknown> {
  const result = { ...obj };
  for (const [oldKey, newKey] of Object.entries(fieldMap)) {
    if (oldKey in result) {
      result[newKey] = result[oldKey];
      delete result[oldKey];
    }
  }
  return result;
}

async function migrateCollection(collectionName: string, fieldMap: Record<string, string>) {
  console.log(`\n🔄 Migrating ${collectionName}...`);
  
  try {
    // Get all records from the collection
    const result = await pb.collection(collectionName).getList(1, 1000);
    console.log(`📊 Found ${result.items.length} records`);

    // Update each record
    for (const item of result.items) {
      const updatedItem = convertFields(item, fieldMap);
      await pb.collection(collectionName).update(item.id, updatedItem);
      process.stdout.write('.');
    }
    console.log('\n✅ Migration complete');
  } catch (error) {
    console.error(`❌ Error migrating ${collectionName}:`, error);
  }
}

async function main() {
  try {
    // Authenticate
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('🔐 Successfully authenticated with PocketBase');

    // Migrate each collection
    await migrateCollection('fd_designers', designerFieldMap);
    await migrateCollection('fd_brands', brandFieldMap);
    await migrateCollection('fd_tenures', tenureFieldMap);
    await migrateCollection('fd_relationships', relationshipFieldMap);

    console.log('\n🎉 All migrations complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

main();
