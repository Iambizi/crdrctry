import { execSync } from 'child_process';
import { migrateBrands } from '../src/database/seeds/migrateBrands';
import { migrateDesigners } from '../src/database/seeds/migrateDesigners';
import { migrateTenures } from '../src/database/seeds/migrateTenures';
import { migrateRelationships } from '../src/database/seeds/migrateRelationships';

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  try {
    // Run PocketBase migrations
    console.log('📦 Running migrations...');
    execSync('./pocketbase migrate up', { stdio: 'inherit' });
    
    // Run seed scripts in order
    console.log('🌱 Seeding data...');
    
    console.log('Seeding designers...');
    await migrateDesigners();
    
    console.log('Seeding brands...');
    await migrateBrands();
    
    console.log('Seeding tenures...');
    await migrateTenures();
    
    console.log('Seeding relationships...');
    await migrateRelationships();
    
    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
