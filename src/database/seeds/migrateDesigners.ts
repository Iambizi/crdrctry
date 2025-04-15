import { withTransaction } from '../client';
import { readFileSync } from 'fs';
import { join } from 'path';
import PocketBase from 'pocketbase';

interface Designer {
  name: string;
  birth_year?: number;
  death_year?: number;
  nationality?: string;
  education?: string[];
  awards?: string[];
  signature_styles?: string[];
  biography?: string;
  image_url?: string;
  social_media?: Record<string, string>;
  status?: string;
  current_role?: string;
  is_active?: boolean;
}

// Load designer data from JSON file
async function loadDesignerData(): Promise<Designer[]> {
  try {
    const dataPath = join(process.cwd(), 'src/data/fashionGenealogy.json');
    const rawData = readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    const designers = data.designers || [];
    console.log(`Loaded ${designers.length} designers from JSON`);
    console.log('First designer:', JSON.stringify(designers[0], null, 2));
    return designers;
  } catch (error) {
    console.error('Error loading designer data:', error);
    throw error;
  }
}

// Create a designer record
async function createDesigner(designer: Designer, client: PocketBase): Promise<void> {
  try {
    // Check if designer already exists
    const existingDesigners = await client.collection('designers').getList(1, 1, {
      filter: `name = "${designer.name}"`
    });
    
    if (existingDesigners.items.length > 0) {
      console.log(`Designer ${designer.name} already exists, skipping...`);
      return;
    }

    // Create new designer
    console.log(`Creating designer: ${designer.name}`);
    await client.collection('designers').create({
      name: designer.name,
      birth_year: designer.birth_year || null,
      death_year: designer.death_year || null,
      nationality: designer.nationality || '',
      education: designer.education || [],
      awards: designer.awards || [],
      signature_styles: designer.signature_styles || [],
      biography: designer.biography || '',
      image_url: designer.image_url || '',
      social_media: designer.social_media || {},
      status: designer.status || 'active',
      current_role: designer.current_role || '',
      is_active: designer.is_active !== false
    });
  } catch (error) {
    console.error(`Error creating designer ${designer.name}:`, error);
    throw error;
  }
}

// Migrate designers
export async function migrateDesigners(): Promise<void> {
  console.log('Starting designer migration...');
  
  try {
    const designers = await loadDesignerData();
    console.log(`Found ${designers.length} designers to migrate`);
    
    let created = 0;
    let errors = 0;
    const skipped = 0;

    await withTransaction(async (client) => {
      for (const designer of designers) {
        try {
          await createDesigner(designer, client);
          created++;
        } catch (error) {
          console.error(`Error creating designer ${designer.name}:`, error);
          errors++;
        }
      }
    });

    console.log('Designer migration complete:');
    console.log(`    Created: ${created}`);
    console.log(`    Skipped: ${skipped}`);
    console.log(`    Errors: ${errors}`);
    console.log('  ');
  } catch (error) {
    console.error('Error during designer migration:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDesigners()
    .then(() => console.log('Migration completed'))
    .catch(console.error);
}
