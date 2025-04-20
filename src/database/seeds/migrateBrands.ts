import { Brand, CreateBrand } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const pb = new PocketBase(process.env.POCKETBASE_URL);

async function loadBrandData(): Promise<Brand[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  
  console.log('Raw data loaded');
  
  // Get unique brands by name
  const uniqueBrands = new Map();
  data.brands.forEach((brand: Brand) => {
    if (!uniqueBrands.has(brand.name.toLowerCase())) {
      uniqueBrands.set(brand.name.toLowerCase(), brand);
    }
  });
  
  const brands = Array.from(uniqueBrands.values());
  console.log(`Found ${brands.length} valid unique brands`);
  return brands;
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

async function validateBrand(brand: CreateBrand): Promise<string[]> {
  const errors: string[] = [];

  if (!brand.name) {
    errors.push("Name is required");
  }

  return errors;
}

export async function migrateBrands(): Promise<void> {
  console.log("Starting brand migration...");
  const brands = await loadBrandData();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  await authenticateAdmin();

  // First, delete all existing records
  try {
    const existingBrands = await pb.collection('brands').getFullList();
    console.log(`Found ${existingBrands.length} existing brands, deleting...`);
    for (const brand of existingBrands) {
      await pb.collection('brands').delete(brand.id);
    }
    console.log('Deleted all existing brands');
  } catch (error) {
    console.error('Error deleting existing brands:', error);
  }

  // Create a Set to track unique brand names
  const processedBrands = new Set<string>();

  for (const brand of brands) {
    try {
      // Skip if we've already processed this brand name
      if (processedBrands.has(brand.name.toLowerCase())) {
        console.log(`Skipping duplicate brand: ${brand.name}`);
        skipped++;
        continue;
      }

      const transformedBrand: CreateBrand = {
        name: brand.name,
        description: brand.description || '',
        founding_year: brand.founding_year || undefined,
        headquarters: brand.headquarters || '',
        parent_company: brand.parent_company || '',
        categories: brand.categories || [],
        website: brand.website || '',
        social_media: brand.social_media || {},
        logo_url: brand.logo_url || '',
      };

      const validationErrors = await validateBrand(transformedBrand);
      if (validationErrors.length > 0) {
        console.error(`Validation errors for brand ${brand.name}:`, validationErrors);
        errors++;
        continue;
      }

      console.log(`Creating brand: ${brand.name}`);
      await pb.collection("brands").create(transformedBrand);
      processedBrands.add(brand.name.toLowerCase());
      created++;
    } catch (error) {
      console.error(`Error creating brand ${brand.name}:`, error);
      errors++;
    }
  }

  console.log(`Brand migration complete:
    Created: ${created}
    Skipped: ${skipped}
    Errors: ${errors}
  `);
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  (async () => {
    try {
      console.log("Starting brand migration...");
      await migrateBrands();
      console.log("Migration completed");
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
