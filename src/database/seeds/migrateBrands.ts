import { withTransaction } from "../client";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase, { ClientResponseError } from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);

interface RawBrand {
  id: string;
  name: string;
  description?: string;
  founding_year?: number;
  headquarters?: string;
  parent_company?: string;
  categories?: string[];
  website?: string;
  social_media?: Record<string, string>;
  logo_url?: string;
}

interface BrandData {
  brands: Array<{
    id: string;
    name?: string;
    description?: string;
    founding_year?: string | number;
    headquarters?: string;
    parent_company?: string;
    categories?: string[];
    website?: string;
    social_media?: Record<string, string>;
    logo_url?: string;
  }>;
}

async function loadBrandData(): Promise<RawBrand[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData) as BrandData;
  
  console.log(`Loaded ${data.brands?.length || 0} brands from JSON`);
  
  // Transform and validate brands
  const brands = (data.brands || []).map((b): RawBrand => ({
    id: b.id,
    name: b.name?.trim() || '',
    description: b.description?.trim(),
    founding_year: typeof b.founding_year === 'string' ? Number(b.founding_year) : b.founding_year,
    headquarters: b.headquarters?.trim(),
    parent_company: b.parent_company?.trim(),
    categories: Array.isArray(b.categories) ? b.categories : [],
    website: b.website?.trim(),
    social_media: typeof b.social_media === 'object' ? b.social_media : {},
    logo_url: b.logo_url?.trim()
  }));

  // Filter out invalid brands
  const validBrands = brands.filter(b => {
    const isValid = Boolean(b.name);
    if (!isValid) {
      console.log('Invalid brand:', b);
    }
    return isValid;
  });

  console.log(`Found ${validBrands.length} valid brands`);
  return validBrands;
}

async function createBrand(brand: RawBrand, client: PocketBase): Promise<void> {
  try {
    // Check if brand already exists
    const existing = await client.collection('brands').getFirstListItem(`name = "${brand.name}"`);
    if (existing) {
      console.log(`Brand already exists: ${brand.name}`);
      return;
    }
  } catch (error) {
    // 404 means brand doesn't exist, which is what we want
    if (error instanceof ClientResponseError && error.status !== 404) {
      throw error;
    }
  }

  console.log(`Creating brand: ${brand.name}`);
  await client.collection('brands').create({
    name: brand.name,
    description: brand.description || '',
    founding_year: brand.founding_year,
    headquarters: brand.headquarters || '',
    parent_company: brand.parent_company || '',
    categories: brand.categories || [],
    website: brand.website || '',
    social_media: brand.social_media || {},
    logo_url: brand.logo_url || ''
  });
}

export async function migrateBrands(): Promise<void> {
  console.log('Starting brand migration...');
  const brands = await loadBrandData();
  let created = 0;
  let errors = 0;

  await withTransaction(async (client) => {
    for (const brand of brands) {
      try {
        await createBrand(brand, client);
        created++;
      } catch (error) {
        console.error(`Error creating brand ${brand.name}:`, error);
        errors++;
      }
    }
  });

  console.log(`Brand migration complete:
    Created: ${created}
    Errors: ${errors}
  `);
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  (async () => {
    try {
      await migrateBrands();
      console.log('Migration completed');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
