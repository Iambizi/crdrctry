import PocketBase from 'pocketbase';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { CreateDesigner, CreateBrand, CreateTenure, CreateRelationship, Department, RelationshipType, Brand } from '../src/database/types/types';
import { FashionGenealogyData, DesignerStatus, VerificationStatus } from '../src/types/fashion';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationOptions {
  deleteExisting: boolean;
  dryRun: boolean;
  skipDuplicates: boolean;
  preserveRelationships: boolean;
}

interface DbRecord {
  id: string;
  name?: string;
  [key: string]: unknown;
}

async function getExistingRecords(pb: PocketBase, collectionName: string): Promise<Map<string, DbRecord>> {
  const records = new Map<string, DbRecord>();
  try {
    const existingRecords = await pb.collection(collectionName).getFullList<DbRecord>();
    for (const record of existingRecords) {
      if (record.name) {
        records.set(record.name, record);
      }
    }
    return records;
  } catch (error) {
    console.error(`Error fetching existing ${collectionName}:`, error);
    throw error;
  }
}

async function populateCollection<T extends Record<string, unknown>>(
  pb: PocketBase,
  collectionName: string,
  data: T[],
  options: MigrationOptions,
  existingRecords: Map<string, DbRecord>,
  createdRecords: Map<string, string>,
  nameToOriginalIdMap: Map<string, string>
): Promise<Map<string, string>> {
  try {
    console.log(`\n📥 Processing ${collectionName}...`);
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of data) {
      try {
        // For tenures and relationships, use the first ID as the key
        const key = 'name' in item && typeof item.name === 'string' 
          ? item.name 
          : ('id' in item && typeof item.id === 'string' ? item.id : '');

        const existing = existingRecords.get(key);

        // Handle existing records
        if (existing) {
          if (options.skipDuplicates) {
            console.log(`Skipping existing item with key ${key}`);
            if (key) createdRecords.set(key, existing.id);
            skipped++;
            continue;
          }

          if (!options.dryRun) {
            const updated = await pb.collection(collectionName).update(existing.id, item);
            if (key) createdRecords.set(key, updated.id);
          }
          updated++;
          continue;
        }

        // Create new record
        if (!options.dryRun) {
          const record = await pb.collection(collectionName).create(item);
          if (key) createdRecords.set(key, record.id);
          
          if (collectionName === 'fd_brands' && 'id' in item) {
            nameToOriginalIdMap.set(key, typeof item.id === 'string' ? item.id : '');
          }
        }
        created++;

      } catch (error) {
        console.error(`\n❌ Error processing ${collectionName} item:`, item);
        console.error('Error details:', error);
        process.stdout.write('X');
      }
    }

    console.log(`\n✅ ${collectionName} processing complete:`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    return createdRecords;

  } catch (error) {
    console.error(`❌ Error in ${collectionName}:`, error);
    throw error;
  }
}

async function main(options: MigrationOptions = {
  deleteExisting: false,
  dryRun: false,
  skipDuplicates: true,
  preserveRelationships: true
}) {
  try {
    // Authenticate
    const pb = new PocketBase(process.env.POCKETBASE_URL);
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('🔐 Successfully authenticated with PocketBase');

    // Load data
    const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
    const data: FashionGenealogyData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    console.log('\nSource data counts:');
    console.log(`Brands: ${data.brands.length}`);
    console.log(`Designers: ${data.designers.length}`);
    console.log(`Tenures: ${data.tenures.length}`);
    console.log(`Relationships: ${data.relationships.length}\n`);

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    }

    // Get existing records
    const existingBrands = await getExistingRecords(pb, 'fd_brands');
    const existingDesigners = await getExistingRecords(pb, 'fd_designers');

    // Transform data
    const brandsToCreate = new Map<string, CreateBrand>();
    const designers: CreateDesigner[] = [];
    const tenures: CreateTenure[] = [];
    const relationships: CreateRelationship[] = [];

    // Process brands
    for (const brand of data.brands) {
      const categoryMap: Record<string, Brand['category']> = {
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
        foundedYear: brand.foundedYear,
        founder: brand.founder || '',
        parentCompany: brand.parentCompany || '',
        category,
        headquarters: brand.headquarters || '',
        specialties: brand.specialties || [],
        pricePoint: brand.pricePoint,
        markets: brand.markets || [],
        website: brand.website || '',
        hasHistoricalData: brand.hasHistoricalData || false,
        notes: brand.notes || '',
        socialMedia: brand.socialMedia || {},
        confidence: brand.confidence || 0,
        verificationStatus: brand.verificationStatus || VerificationStatus.unverified,
        sources: brand.sources || [],
        lastVerified: brand.lastVerified || new Date().toISOString()
      });
    }

    // Process designers
    for (const designer of data.designers) {
      designers.push({
        name: designer.name,
        currentRole: designer.currentRole || '',
        isActive: designer.isActive || false,
        status: designer.status || DesignerStatus.active,
        biography: designer.biography || '',
        nationality: designer.nationality || '',
        birthYear: designer.birthYear,
        deathYear: designer.deathYear,
        education: designer.education || [],
        awards: designer.awards || [],
        signatureStyles: designer.signatureStyles || [],
        socialMedia: designer.socialMedia || {},
        confidence: designer.confidence || 0,
        verificationStatus: designer.verificationStatus || VerificationStatus.unverified,
        sources: designer.sources || []
      });
    }

    // Populate collections
    const brandIdMap = await populateCollection(
      pb, 
      'fd_brands', 
      Array.from(brandsToCreate.values()), 
      options,
      existingBrands,
      new Map<string, string>(), 
      new Map<string, string>()
    );

    const designerIdMap = await populateCollection(
      pb, 
      'fd_designers', 
      designers, 
      options,
      existingDesigners,
      new Map<string, string>(), 
      new Map<string, string>()
    );

    // Process tenures
    console.log('\nProcessing tenures...');
    let skippedCount = 0;
    for (const tenure of data.tenures) {
      const designer = data.designers.find(d => d.id === tenure.designerId);
      const brand = data.brands.find(b => b.id === tenure.brandId);

      if (!designer || !brand) {
        console.warn('⚠️  Skipping tenure: missing references');
        skippedCount++;
        continue;
      }

      const designerId = designerIdMap.get(designer.name);
      const brandId = brandIdMap.get(brand.name);

      if (!designerId || !brandId) {
        console.warn(`⚠️  Skipping tenure: missing new IDs for ${designer.name} at ${brand.name}`);
        skippedCount++;
        continue;
      }

      tenures.push({
        field_designer: designerId,
        field_brand: brandId,
        field_role: tenure.role || '',
        field_department: tenure.department || Department.allDepartments,
        field_startYear: tenure.startYear,
        field_endYear: tenure.endYear || undefined,
        field_isCurrentRole: !tenure.endYear,
        field_achievements: tenure.achievements || [],
        field_notableWorks: tenure.notableWorks || [],
        field_notableCollections: tenure.notableCollections || [],
        field_impactDescription: tenure.impactDescription || '',
        field_verificationStatus: VerificationStatus.verified
      });
    }

    console.log(`Skipped ${skippedCount} tenures due to missing references or IDs`);

    // Process relationships
    console.log('\nProcessing relationships...');
    for (const rel of data.relationships) {
      const sourceDesigner = data.designers.find(d => d.id === rel.sourceDesignerId);
      const targetDesigner = data.designers.find(d => d.id === rel.targetDesignerId);
      const brand = data.brands.find(b => b.id === rel.brandId);

      if (!sourceDesigner || !targetDesigner || !brand) {
        console.warn('⚠️  Skipping relationship: missing references');
        continue;
      }

      const sourceId = designerIdMap.get(sourceDesigner.name);
      const targetId = designerIdMap.get(targetDesigner.name);
      const brandId = brandIdMap.get(brand.name);

      if (!sourceId || !targetId || !brandId) {
        console.warn('⚠️  Skipping relationship: missing new IDs');
        continue;
      }

      relationships.push({
        sourceDesigner: sourceId,
        targetDesigner: targetId,
        brand: brandId,
        type: rel.type || RelationshipType.collaboration,
        startYear: rel.startYear,
        endYear: rel.endYear,
        description: rel.description || '',
        collaborationProjects: rel.collaborationProjects || [],
        verificationStatus: VerificationStatus.verified
      });
    }

    // Populate remaining collections if not in dry run
    if (!options.dryRun) {
      await populateCollection(
        pb, 
        'fd_tenures', 
        tenures, 
        options,
        new Map(), 
        new Map<string, string>(), 
        new Map<string, string>()
      );

      await populateCollection(
        pb, 
        'fd_relationships', 
        relationships, 
        options,
        new Map(), 
        new Map<string, string>(), 
        new Map<string, string>()
      );
    }

    console.log('\n🎉 Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Allow CLI arguments for options
const args = process.argv.slice(2);
const options: MigrationOptions = {
  deleteExisting: args.includes('--delete'),
  dryRun: args.includes('--dry-run'),
  skipDuplicates: !args.includes('--no-skip'),
  preserveRelationships: !args.includes('--no-preserve')
};

main(options);
