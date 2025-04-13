import { withTransaction } from "../client";
import { Tenure, CreateTenure } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);

async function loadTenureData(): Promise<Tenure[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return data.tenures || [];
}

async function findDesignerId(name: string, client: PocketBase): Promise<string> {
  try {
    const records = await client.collection("designers").getList(1, 1, {
      filter: `name = "${name}"`,
    });
    if (records.items.length > 0) {
      return records.items[0].id;
    }
    throw new Error(`Designer not found: ${name}`);
  } catch (error) {
    console.error(`Error finding designer ${name}:`, error);
    throw error;
  }
}

async function findBrandId(name: string, client: PocketBase): Promise<string> {
  try {
    const records = await client.collection("brands").getList(1, 1, {
      filter: `name = "${name}"`,
    });
    if (records.items.length > 0) {
      return records.items[0].id;
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

  await withTransaction(async (client: PocketBase) => {
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
