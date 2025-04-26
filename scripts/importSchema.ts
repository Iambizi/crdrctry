// scripts/importSchema.ts

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pb = new PocketBase(process.env.POCKETBASE_URL);

function isErrorWithResponseData(err: unknown): err is { response: { data: unknown } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object' &&
    !!(err as { response?: unknown }).response &&
    'data' in (err as { response: { data?: unknown } }).response
  );
}

async function main() {
  try {
    // Authenticate
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('🔐 Successfully authenticated with PocketBase');

    // Load schema
    // To test minimal schema, switch to pb_schema_import_minimal.json
    const schemaPath = join(__dirname, '../pb_schema_import.json');
    const importData = JSON.parse(readFileSync(schemaPath, 'utf-8'));

    // Import schema
    console.log('Importing schema...');
    console.log('Schema to import:', JSON.stringify(importData, null, 2));

    await pb.send('/api/collections/import', {
      method: 'PUT',
      body: importData,
    });
    console.log('✅ Schema imported successfully');

    // Verify fields exist
    const designersCol = await pb.collections.getOne('fd_designers');
    console.log('Collection structure:', JSON.stringify(designersCol, null, 2));
    console.log(
      'Imported "designers" fields:',
      designersCol.fields?.map((f: { id: string; type: string }) => `${f.id} (${f.type})`).join(', ') || 'No fields found'
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Schema import failed:', error.message);
    } else {
      console.error('❌ Schema import failed:', error);
    }
    if (isErrorWithResponseData(error)) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
