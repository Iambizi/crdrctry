import 'dotenv/config';
import { initPocketBase } from '../src/database/client';
import { migrateBrands } from '../src/database/seeds/migrateBrands';
import { migrateDesigners } from '../src/database/seeds/migrateDesigners';
import { migrateTenures } from '../src/database/seeds/migrateTenures';
import { migrateRelationships } from '../src/database/seeds/migrateRelationships';

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  try {
    // Initialize PocketBase client
    console.log('🔌 Initializing PocketBase client...');
    const client = await initPocketBase();

    // Create collections if they don't exist
    console.log('📦 Creating collections...');
    
    try {
      await client.collections.create({
        name: 'designers',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 255
            }
          },
          {
            name: 'birth_year',
            type: 'number'
          },
          {
            name: 'death_year',
            type: 'number'
          },
          {
            name: 'nationality',
            type: 'text'
          },
          {
            name: 'education',
            type: 'json'
          },
          {
            name: 'awards',
            type: 'json'
          },
          {
            name: 'signature_styles',
            type: 'json'
          },
          {
            name: 'biography',
            type: 'text'
          },
          {
            name: 'image_url',
            type: 'text'
          },
          {
            name: 'social_media',
            type: 'json'
          },
          {
            name: 'status',
            type: 'text'
          },
          {
            name: 'current_role',
            type: 'text'
          },
          {
            name: 'is_active',
            type: 'bool'
          }
        ]
      });
      console.log('Created designers collection');
    } catch {
      console.log('Designers collection already exists');
    }

    try {
      await client.collections.create({
        name: 'brands',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            options: {
              min: 1,
              max: 255
            }
          },
          {
            name: 'founded_year',
            type: 'number'
          },
          {
            name: 'founder',
            type: 'text'
          },
          {
            name: 'category',
            type: 'text'
          },
          {
            name: 'parent_company',
            type: 'text'
          },
          {
            name: 'headquarters',
            type: 'text'
          },
          {
            name: 'specialties',
            type: 'json'
          },
          {
            name: 'price_point',
            type: 'text'
          },
          {
            name: 'markets',
            type: 'json'
          },
          {
            name: 'website',
            type: 'text'
          },
          {
            name: 'social_media',
            type: 'json'
          },
          {
            name: 'logo_url',
            type: 'text'
          }
        ]
      });
      console.log('Created brands collection');
    } catch {
      console.log('Brands collection already exists');
    }

    try {
      await client.collections.create({
        name: 'tenures',
        type: 'base',
        schema: [
          {
            name: 'designer',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'designers',
              cascadeDelete: false,
              maxSelect: 1,
              minSelect: 1
            }
          },
          {
            name: 'brand',
            type: 'relation',
            required: true,
            options: {
              collectionId: 'brands',
              cascadeDelete: false,
              maxSelect: 1,
              minSelect: 1
            }
          },
          {
            name: 'role',
            type: 'text'
          },
          {
            name: 'department',
            type: 'text'
          },
          {
            name: 'start_year',
            type: 'number',
            required: true
          },
          {
            name: 'end_year',
            type: 'number'
          },
          {
            name: 'is_current_role',
            type: 'bool'
          },
          {
            name: 'achievements',
            type: 'json'
          },
          {
            name: 'notable_works',
            type: 'json'
          },
          {
            name: 'notable_collections',
            type: 'json'
          },
          {
            name: 'impact_description',
            type: 'text'
          }
        ]
      });
      console.log('Created tenures collection');
    } catch {
      console.log('Tenures collection already exists');
    }

    try {
      await client.collections.create({
        name: 'relationships',
        type: 'base',
        schema: [
          {
            name: 'source_designer',
            type: 'text',
            required: true
          },
          {
            name: 'target_designer',
            type: 'text',
            required: true
          },
          {
            name: 'brand',
            type: 'text',
            required: true
          },
          {
            name: 'type',
            type: 'text',
            required: true
          },
          {
            name: 'start_year',
            type: 'number'
          },
          {
            name: 'end_year',
            type: 'number'
          },
          {
            name: 'description',
            type: 'text'
          },
          {
            name: 'impact',
            type: 'text'
          },
          {
            name: 'collaboration_projects',
            type: 'json'
          }
        ]
      });
      console.log('Created relationships collection');
    } catch {
      console.log('Relationships collection already exists');
    }
    
    // Run seed scripts in order
    console.log('🌱 Seeding data...');
    
    // First, create brands
    console.log('Seeding brands...');
    await migrateBrands();
    
    // Then create designers
    console.log('Seeding designers...');
    await migrateDesigners();
    
    // Then create tenures
    console.log('Seeding tenures...');
    await migrateTenures();
    
    // Finally create relationships
    console.log('Seeding relationships...');
    await migrateRelationships();
    
    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

// Only run one migration at a time
(async () => {
  await resetDatabase();
})();
