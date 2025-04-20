import { Tenure, CreateTenure } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const pb = new PocketBase(process.env.POCKETBASE_URL);

interface RawDesigner {
  id: string;
  name: string;
}

interface RawBrand {
  id: string;
  name: string;
}

interface RawTenure {
  designerId: string;
  brandId: string;
  role?: string;
  department?: string;
  startYear: number;
  endYear?: number;
  isCurrentRole?: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
}

async function loadTenureData(): Promise<Tenure[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  
  console.log('Raw data loaded');
  
  // First, build maps of IDs to names
  const designerMap = new Map(data.designers.map((d: RawDesigner) => [d.id, d.name]));
  const brandMap = new Map(data.brands.map((b: RawBrand) => [b.id, b.name]));
  
  // Transform tenures to use names instead of IDs
  const tenures = data.tenures.map((t: RawTenure) => {
    const designer = designerMap.get(t.designerId);
    const brand = brandMap.get(t.brandId);
    
    return {
      designer,
      brand,
      role: t.role,
      department: t.department,
      start_year: t.startYear,
      end_year: t.endYear,
      is_current_role: t.isCurrentRole,
      achievements: t.achievements || [],
      notable_works: t.notableWorks || [],
      notable_collections: t.notableCollections || [],
      impact_description: t.impactDescription || '',
    };
  });
  
  // Get unique tenures by designer and brand
  const uniqueTenures = new Map();
  tenures.forEach((tenure: Tenure) => {
    // Skip invalid tenures
    if (!tenure.designer || !tenure.brand || !tenure.start_year) {
      console.log(`Skipping invalid tenure:`, tenure);
      return;
    }
    
    const key = `${tenure.designer.toLowerCase()}-${tenure.brand.toLowerCase()}-${tenure.start_year}`;
    if (!uniqueTenures.has(key)) {
      uniqueTenures.set(key, tenure);
    }
  });
  
  const validTenures = Array.from(uniqueTenures.values());
  console.log(`Found ${validTenures.length} valid unique tenures`);
  return validTenures;
}

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

async function validateTenure(tenure: CreateTenure): Promise<string[]> {
  const errors: string[] = [];

  if (!tenure.designer) {
    errors.push("Designer is required");
  }
  if (!tenure.brand) {
    errors.push("Brand is required");
  }
  if (!tenure.start_year) {
    errors.push("Start year is required");
  }

  return errors;
}

export async function migrateTenures(): Promise<void> {
  console.log("Starting tenure migration...");
  const tenures = await loadTenureData();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  await authenticateAdmin();

  // First, delete all existing records
  try {
    const existingTenures = await pb.collection('tenures').getFullList();
    console.log(`Found ${existingTenures.length} existing tenures, deleting...`);
    for (const tenure of existingTenures) {
      await pb.collection('tenures').delete(tenure.id);
    }
    console.log('Deleted all existing tenures');
  } catch (error) {
    console.error('Error deleting existing tenures:', error);
  }

  // Create a Set to track processed tenures
  const processedTenures = new Set<string>();

  for (const tenure of tenures) {
    try {
      // Create a unique key for this tenure
      const key = `${tenure.designer.toLowerCase()}-${tenure.brand.toLowerCase()}-${tenure.start_year}`;
      
      // Skip if we've already processed this tenure
      if (processedTenures.has(key)) {
        console.log(`Skipping duplicate tenure: ${tenure.designer} at ${tenure.brand}`);
        skipped++;
        continue;
      }

      // Create missing brand if needed
      let brandRecord = await pb.collection('brands').getFirstListItem(`name = '${tenure.brand.replace(/'/g, "\\'")}'`).catch(() => null);
      if (!brandRecord) {
        console.log(`Creating missing brand: ${tenure.brand}`);
        brandRecord = await pb.collection('brands').create({
          name: tenure.brand,
          description: '',
          founding_year: tenure.start_year,
        });
        if (!brandRecord) throw new Error(`Failed to create brand: ${tenure.brand}`);
      }

      // Create missing designer if needed
      let designerRecord = await pb.collection('designers').getFirstListItem(`name = '${tenure.designer.replace(/'/g, "\\'")}'`).catch(() => null);
      if (!designerRecord) {
        console.log(`Creating missing designer: ${tenure.designer}`);
        designerRecord = await pb.collection('designers').create({
          name: tenure.designer,
          current_role: tenure.role || '',
          is_active: tenure.is_current_role || false,
          status: tenure.is_current_role ? 'ACTIVE' : 'INACTIVE',
        });
        if (!designerRecord) throw new Error(`Failed to create designer: ${tenure.designer}`);
      }

      const transformedTenure: CreateTenure = {
        designer: designerRecord.id,
        brand: brandRecord.id,
        role: tenure.role || '',
        department: tenure.department || undefined,
        start_year: tenure.start_year,
        end_year: tenure.end_year,
        is_current_role: tenure.is_current_role || false,
        achievements: tenure.achievements || [],
        notable_works: tenure.notable_works || [],
        notable_collections: tenure.notable_collections || [],
        impact_description: tenure.impact_description || '',
      };

      const validationErrors = await validateTenure(transformedTenure);
      if (validationErrors.length > 0) {
        console.error(`Validation errors for tenure ${tenure.designer} at ${tenure.brand}:`, validationErrors);
        errors++;
        continue;
      }

      console.log(`Creating tenure: ${tenure.designer} at ${tenure.brand}`);
      await pb.collection("tenures").create(transformedTenure);
      processedTenures.add(key);
      created++;
    } catch (error) {
      console.error(`Error creating tenure ${tenure.designer} at ${tenure.brand}:`, error);
      errors++;
    }
  }

  console.log(`Tenure migration complete:
    Created: ${created}
    Skipped: ${skipped}
    Errors: ${errors}
  `);
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  (async () => {
    try {
      console.log("Starting tenure migration...");
      await migrateTenures();
      console.log("Migration completed");
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
