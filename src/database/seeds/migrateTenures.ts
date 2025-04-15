import { withTransaction } from "../client";
import { Tenure, CreateTenure } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);

interface RawDesigner {
  id: string;
  name: string;
}

interface RawBrand {
  id: string;
  name: string;
}

interface RawTenure {
  id: string;
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
  
  console.log('Raw data loaded. Found:');
  console.log(`- ${data.designers?.length || 0} designers`);
  console.log(`- ${data.brands?.length || 0} brands`);
  console.log(`- ${data.tenures?.length || 0} tenures`);
  
  // First, build maps of IDs to names
  const designerMap = new Map(data.designers.map((d: RawDesigner) => [d.id, d.name]));
  const brandMap = new Map(data.brands.map((b: RawBrand) => [b.id, b.name]));
  
  console.log('\nMaps created:');
  console.log(`- Designer map size: ${designerMap.size}`);
  console.log(`- Brand map size: ${brandMap.size}`);
  
  // Transform tenures to use names instead of IDs
  const tenures = (data.tenures || []).map((t: RawTenure) => {
    const designer = designerMap.get(t.designerId);
    const brand = brandMap.get(t.brandId);
    
    if (!designer) {
      console.log(`Warning: Designer not found for ID ${t.designerId}`);
    }
    if (!brand) {
      console.log(`Warning: Brand not found for ID ${t.brandId}`);
    }
    
    return {
      ...t,
      designer,
      brand,
      start_year: Number(t.startYear),
      end_year: t.endYear ? Number(t.endYear) : undefined,
      is_current_role: t.isCurrentRole,
      notable_works: t.notableWorks,
      notable_collections: t.notableCollections,
      impact_description: t.impactDescription,
    };
  });
  
  const validTenures = tenures.filter((t: Tenure) => {
    const isValid = t.designer && t.brand && t.start_year;
    if (!isValid) {
      console.log(`Invalid tenure: ${JSON.stringify({
        start_year: t.start_year,
      })}`);
    }
    return isValid;
  });
  
  console.log(`\nTenures processed:`);
  console.log(`- Total tenures: ${tenures.length}`);
  console.log(`- Valid tenures: ${validTenures.length}`);
  console.log(`- Invalid tenures: ${tenures.length - validTenures.length}`);
  
  if (validTenures.length > 0) {
    console.log('\nFirst valid tenure:', JSON.stringify(validTenures[0], null, 2));
  }
  
  return validTenures;
}

// Cache for designers and brands
let designerCache: Map<string, string> | null = null;
let brandCache: Map<string, string> | null = null;

async function waitForCollection(client: PocketBase, collection: string, expectedCount: number): Promise<void> {
  let attempts = 0;
  const maxAttempts = 15;
  const delay = 2000; // 2 seconds

  while (attempts < maxAttempts) {
    const records = await client.collection(collection).getFullList();
    console.log(`Found ${records.length} ${collection} (expected ${expectedCount})`);
    
    if (records.length >= expectedCount) {
      return;
    }
    
    console.log(`Waiting for ${collection} to be created (attempt ${attempts + 1}/${maxAttempts})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }
  
  throw new Error(`Timeout waiting for ${collection} to be created`);
}

async function loadDesignerCache(client: PocketBase): Promise<Map<string, string>> {
  if (!designerCache) {
    // Wait for designers to be created
    await waitForCollection(client, 'designers', 178);
    
    const records = await client.collection("designers").getFullList();
    designerCache = new Map();
    
    // Build a case-insensitive cache
    for (const record of records) {
      if (record.name) {  // Only cache records with a name
        designerCache.set(record.name.toLowerCase(), record.id);
      }
    }
    
    console.log(`Loaded ${designerCache.size} designers into cache`);
  }
  return designerCache;
}

async function loadBrandCache(client: PocketBase): Promise<Map<string, string>> {
  if (!brandCache) {
    // Wait for brands to be created
    await waitForCollection(client, 'brands', 100);
    
    const records = await client.collection("brands").getFullList();
    brandCache = new Map();
    
    // Build a case-insensitive cache
    for (const record of records) {
      if (record.name) {  // Only cache records with a name
        brandCache.set(record.name.toLowerCase(), record.id);
      }
    }
    
    console.log(`Loaded ${brandCache.size} brands into cache`);
  }
  return brandCache;
}

async function findDesignerId(name: string, client: PocketBase): Promise<string> {
  if (!name) {
    throw new Error("Designer name is required");
  }
  try {
    const records = await client.collection("designers").getFullList();
    const match = records.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (match) {
      return match.id;
    }
    throw new Error(`Designer not found: ${name}`);
  } catch (error) {
    console.error(`Error finding designer ${name}:`, error);
    throw error;
  }
}

async function findBrandId(name: string, client: PocketBase): Promise<string> {
  if (!name) {
    throw new Error("Brand name is required");
  }
  try {
    const records = await client.collection("brands").getFullList();
    const match = records.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (match) {
      return match.id;
    }
    throw new Error(`Brand not found: ${name}`);
  } catch (error) {
    console.error(`Error finding brand ${name}:`, error);
    throw error;
  }
}

function transformTenure(tenure: Tenure, designerId: string, brandId: string): CreateTenure {
  return {
    designer: designerId,
    brand: brandId,
    role: tenure.role || "Designer",
    department: tenure.department,
    start_year: tenure.start_year,
    end_year: tenure.end_year,
    is_current_role: Boolean(tenure.is_current_role),
    achievements: tenure.achievements || [],
    notable_works: tenure.notable_works || [],
    notable_collections: tenure.notable_collections || [],
    impact_description: tenure.impact_description,
  };
}

async function validateTenure(tenure: CreateTenure): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
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
  const tenures = await loadTenureData();
  let created = 0;
  let errors = 0;

  await withTransaction(async (client) => {
    // Reset caches
    designerCache = null;
    brandCache = null;

    // Load caches first
    await loadDesignerCache(client);
    await loadBrandCache(client);

    // Now process tenures
    for (const tenure of tenures) {
      try {
        const designerId = await findDesignerId(tenure.designer, client);
        const brandId = await findBrandId(tenure.brand, client);
        const transformedTenure = transformTenure(tenure, designerId, brandId);
        const validationErrors = await validateTenure(transformedTenure);

        if (validationErrors.length > 0) {
          console.error(`Validation errors for tenure ${tenure.designer} at ${tenure.brand}:`, validationErrors);
          errors++;
          continue;
        }

        await client.collection("tenures").create(transformedTenure);
        created++;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error creating tenure ${tenure.designer} at ${tenure.brand}:`, error.message);
        } else {
          console.error(`Error creating tenure ${tenure.designer} at ${tenure.brand}:`, error);
        }
        errors++;
      }
    }
  });

  console.log(`Tenure migration complete:
    Created: ${created}
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
