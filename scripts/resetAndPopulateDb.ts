import PocketBase from 'pocketbase';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import our source of truth types
import { CreateDesigner, CreateBrand, CreateTenure, CreateRelationship, DesignerStatus, Department, RelationshipType } from '../src/database/types/types';
import { FashionGenealogyData } from '../src/types/fashion';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize PocketBase
const pb = new PocketBase(process.env.POCKETBASE_URL);

async function deleteCollection(collectionName: string) {
  console.log(`🗑️  Deleting all records from ${collectionName}...`);
  try {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const records = await pb.collection(collectionName).getList(page, 100);
      if (records.items.length === 0) {
        hasMore = false;
        continue;
      }
      
      // Delete all records in this page in parallel
      await Promise.all(
        records.items.map(async (record) => {
          await pb.collection(collectionName).delete(record.id);
          process.stdout.write('.');
        })
      );
      
      page++;
    }
    console.log('\n✅ Deletion complete');
  } catch (error) {
    console.error(`❌ Error deleting records from ${collectionName}:`, error);
    throw error; // Propagate error
  }
}

async function deleteAllRecords() {
  try {
    // Delete all collections in parallel
    await Promise.all([
      deleteCollection('fd_relationships'),
      deleteCollection('fd_tenures'),
      deleteCollection('fd_designers'),
      deleteCollection('fd_brands')
    ]);
    console.log('\n✅ All collections cleared');
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    throw error;
  }
}

async function populateCollection<T extends Record<string, unknown>>(collectionName: string, data: T[]) {
  console.log(`\n📥 Populating ${collectionName}...`);
  try {
    for (const item of data) {
      console.log('Inserting item:', JSON.stringify(item, null, 2));
      await pb.collection(collectionName).create(item);
      process.stdout.write('.');
    }
    console.log('\n✅ Population complete');
  } catch (error) {
    console.error(`❌ Error populating ${collectionName}:`, error);
    throw error;
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

    // Load the fashion genealogy data
    const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as FashionGenealogyData;

    // Delete existing records
    await deleteAllRecords();

    // Transform and extract data
    const brandsMap = new Map<string, CreateBrand>();
    const designers: CreateDesigner[] = [];
    const tenures: CreateTenure[] = [];
    const relationships: CreateRelationship[] = [];

    // Process brands first
    for (const brand of data.brands) {
      brandsMap.set(brand.name, {
        name: brand.name,
        description: '', // This will be added later
        foundedYear: brand.foundedYear || 0,
        founder: brand.founder || '',
        headquarters: brand.headquarters || '',
        parentCompany: brand.parentCompany || '',
        category: brand.category || 'luxuryFashion',
        website: brand.website || '',
        socialMedia: brand.socialMedia || {},
        logoUrl: brand.logoUrl || ''
      });
    }

    // Process designers
    for (const designer of data.designers) {
      designers.push({
        name: designer.name,
        status: designer.status || DesignerStatus.active,
        isActive: designer.isActive !== false,
        currentRole: designer.currentRole || '',
        biography: designer.biography || '',
        imageUrl: designer.imageUrl || '',
        nationality: designer.nationality || '',
        birthYear: designer.birthYear,
        deathYear: designer.deathYear,
        awards: designer.awards || [],
        education: designer.education || [],
        signatureStyles: designer.signatureStyles || [],
        socialMedia: designer.socialMedia || {}
      });
    }

    // Process tenures
    for (const tenure of data.tenures) {
      tenures.push({
        designer: tenure.designerId,
        brand: tenure.brandId,
        role: tenure.role || '',
        department: tenure.department || Department.allDepartments,
        startYear: tenure.startYear,
        endYear: tenure.endYear === null ? undefined : tenure.endYear,
        isCurrentRole: !tenure.endYear,
        achievements: tenure.achievements || [],
        notableWorks: tenure.notableWorks || [],
        notableCollections: tenure.notableCollections || [],
        impactDescription: tenure.impactDescription || ''
      });
    }

    // Process relationships
    for (const relationship of data.relationships) {
      relationships.push({
        sourceDesigner: relationship.sourceDesignerId,
        targetDesigner: relationship.targetDesignerId,
        brand: relationship.brandId,
        type: relationship.type || RelationshipType.collaboration,
        startYear: relationship.startYear,
        endYear: relationship.endYear,
        description: relationship.description || '',
        collaborationProjects: relationship.collaborationProjects || []
      });
    }

    // Populate with new data in the correct order
    await populateCollection('fd_brands', Array.from(brandsMap.values()));
    await populateCollection('fd_designers', designers);
    await populateCollection('fd_tenures', tenures);
    await populateCollection('fd_relationships', relationships);

    console.log('\n🎉 Database reset and population complete!');
  } catch (error) {
    console.error('❌ Reset and population failed:', error);
    throw error;
  }
}

main();

    await populateCollection("fd_designers", designers);
    await populateCollection("fd_tenures", tenures);
    await populateCollection("fd_relationships", relationships);

    console.log("\n🎉 Database reset and population complete!");
  } catch (error) {
    console.error("❌ Reset and population failed:", error);
    throw error;
  }
}

main();
