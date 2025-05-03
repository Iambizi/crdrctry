import PocketBase, { ClientResponseError } from 'pocketbase';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import our source of truth types
import { CreateDesigner, CreateBrand, CreateTenure, CreateRelationship, DesignerStatus, Department, RelationshipType, VerificationStatus } from '../src/database/types/types';
import { FashionGenealogyData } from '../src/types/fashion';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize PocketBase
const pb = new PocketBase(process.env.POCKETBASE_URL);

async function populateCollection<T extends Record<string, unknown>>(collectionName: string, data: T[]) {
  console.log(`\n📥 Populating ${collectionName}...`);
  try {
    const createdRecords = new Map<string, string>();
    const nameToOriginalIdMap = new Map<string, string>();

    for (const item of data) {
      try {
        console.log('Inserting item:', JSON.stringify(item, null, 2));
        const record = await pb.collection(collectionName).create(item);
        
        // Store the mapping between name and new ID for brands and designers
        if ('name' in item && typeof item.name === 'string') {
          createdRecords.set(item.name, record.id);
        }

        // Store mapping between original ID and new ID if available
        if ('id' in item && typeof item.id === 'string') {
          nameToOriginalIdMap.set(item.id, record.id);
        }

        process.stdout.write('.');
      } catch (error) {
        if (error instanceof ClientResponseError && error.response?.data?.name?.code === 'validation_not_unique') {
          const itemName = 'name' in item && typeof item.name === 'string' ? item.name : 'unknown';
          console.warn(`⚠️  Duplicate name found for ${itemName}, skipping...`);
          // If this is a duplicate, try to get the existing record's ID
          try {
            const existingRecords = await pb.collection(collectionName).getList(1, 1, {
              filter: `name = "${itemName}"`
            });
            if (existingRecords.items.length > 0) {
              createdRecords.set(itemName, existingRecords.items[0].id);
            }
          } catch (lookupError) {
            console.error(`❌ Error looking up existing record:`, lookupError);
          }
        } else {
          throw error;
        }
      }
    }
    console.log('\n✅ Population complete');
    return createdRecords;
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
    const data: FashionGenealogyData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    console.log(`\nSource data counts:`);
    console.log(`Brands: ${data.brands.length}`);
    console.log(`Designers: ${data.designers.length}`);
    console.log(`Tenures: ${data.tenures.length}`);
    console.log(`Relationships: ${data.relationships.length}\n`);

    // Transform and extract data
    const brandsToCreate = new Map<string, CreateBrand>();
    const designers: CreateDesigner[] = [];
    const tenures: CreateTenure[] = [];
    const relationships: CreateRelationship[] = [];

    // Process brands first
    for (const brand of data.brands) {
      // Convert category to snake_case
      const categoryMap: Record<string, string> = {
        luxuryFashion: 'luxury_fashion',
        designStudio: 'design_studio',
        collaborationLine: 'collaboration_line',
        historicalRetail: 'historical_retail',
        designerLabel: 'designer_label',
        educationalInstitution: 'educational_institution',
        collaborationPartner: 'collaboration_partner'
      };

      const category = categoryMap[brand.category || ''] || 'luxury_fashion';

      brandsToCreate.set(brand.name, {
        name: brand.name,
        description: '', // This will be added later
        foundedYear: brand.foundedYear || 0,
        founder: brand.founder || '',
        headquarters: brand.headquarters || '',
        parentCompany: brand.parentCompany || '',
        category: category as 'luxury_fashion' | 'design_studio' | 'collaboration_line' | 'historical_retail' | 'designer_label' | 'educational_institution' | 'collaboration_partner',
        website: brand.website || '',
        socialMedia: brand.socialMedia || {},
        logoUrl: brand.logoUrl || '',
        verificationStatus: VerificationStatus.verified // Add required field
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
        socialMedia: designer.socialMedia || {},
        verificationStatus: VerificationStatus.verified // Add required field
      });
    }

    // Store brand and designer names for logging
    const brandNames = Array.from(brandsToCreate.keys()).sort();
    const designerNames = designers.map(d => d.name).sort();

    console.log(`Brand names (${brandNames.length}):`);
    console.log(brandNames.join('\n'));
    console.log(`\nDesigner names (${designerNames.length}):`);
    console.log(designerNames.join('\n'));

    // Populate brands and designers first to get their IDs
    const brandIdMap = await populateCollection('fd_brands', Array.from(brandsToCreate.values()));
    const designerIdMap = await populateCollection('fd_designers', designers);

    // Process tenures with the new IDs
    console.log(`\nProcessing ${data.tenures.length} tenures...`);
    let missingDesignerCount = 0;
    let missingBrandCount = 0;
    let missingIdCount = 0;

    for (const tenure of data.tenures) {
      const designer = data.designers.find(d => d.id === tenure.designerId);
      const brand = data.brands.find(b => b.id === tenure.brandId);

      if (!designer || !brand) {
        console.warn(`⚠️  Skipping tenure: missing ${!designer ? 'designer' : 'brand'} reference`);
        if (!designer) missingDesignerCount++;
        if (!brand) missingBrandCount++;
        continue;
      }

      const designerId = designerIdMap.get(designer.name);
      const brandId = brandIdMap.get(brand.name);

      if (!designerId || !brandId) {
        console.warn(`⚠️  Skipping tenure: could not find new IDs for ${designer.name} at ${brand.name}`);
        missingIdCount++;
        continue;
      }

      tenures.push({
        designer: designerId,
        brand: brandId,
        role: tenure.role || '',
        department: tenure.department || Department.allDepartments,
        startYear: tenure.startYear,
        endYear: tenure.endYear === null ? undefined : tenure.endYear,
        isCurrentRole: !tenure.endYear,
        achievements: tenure.achievements || [],
        notableWorks: tenure.notableWorks || [],
        notableCollections: tenure.notableCollections || [],
        impactDescription: tenure.impactDescription || '',
        verificationStatus: VerificationStatus.verified
      });
    }

    console.log(`\nTenure processing summary:`)
    console.log(`Total tenures in source data: ${data.tenures.length}`);
    console.log(`Skipped due to missing designer: ${missingDesignerCount}`);
    console.log(`Skipped due to missing brand: ${missingBrandCount}`);
    console.log(`Skipped due to missing new IDs: ${missingIdCount}`);
    console.log(`Total tenures to create: ${tenures.length}`);

    // Process relationships with the new IDs
    for (const relationship of data.relationships) {
      const sourceDesigner = data.designers.find(d => d.id === relationship.sourceDesignerId);
      const targetDesigner = data.designers.find(d => d.id === relationship.targetDesignerId);
      const brand = data.brands.find(b => b.id === relationship.brandId);

      if (!sourceDesigner || !targetDesigner || !brand) {
        console.warn(`⚠️  Skipping relationship: missing designer or brand reference`);
        continue;
      }

      const sourceDesignerId = designerIdMap.get(sourceDesigner.name);
      const targetDesignerId = designerIdMap.get(targetDesigner.name);
      const brandId = brandIdMap.get(brand.name);

      if (!sourceDesignerId || !targetDesignerId || !brandId) {
        console.warn(`⚠️  Skipping relationship: could not find new IDs`);
        continue;
      }

      relationships.push({
        sourceDesigner: sourceDesignerId,
        targetDesigner: targetDesignerId,
        brand: brandId,
        type: relationship.type || RelationshipType.collaboration,
        startYear: relationship.startYear,
        endYear: relationship.endYear,
        description: relationship.description || '',
        collaborationProjects: relationship.collaborationProjects || [],
        verificationStatus: VerificationStatus.verified
      });
    }

    // Populate tenures and relationships
    await populateCollection('fd_tenures', tenures);
    await populateCollection('fd_relationships', relationships);

    console.log('\n🎉 Database population complete!');
  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  }
}

main();
