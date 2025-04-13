import { pb } from "../client";
import { batchUpsert } from "../utils/batchOperations";
import { Tenure, CreateTenure } from "../types/types";
import * as fs from "fs/promises";
import * as path from "path";

interface TenureMigrationStats {
  total: number;
  processed: number;
  errors: Array<{ id: string; error: string }>;
  skipped: Array<{ id: string; reason: string }>;
}

interface DesignerBrandMap {
  designers: Map<string, string>; // old_id -> pocketbase_id
  brands: Map<string, string>; // old_id -> pocketbase_id
}

async function loadTenureData(): Promise<Tenure[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return data.tenures || [];
}

async function getExistingRecordMaps(): Promise<DesignerBrandMap> {
  const maps: DesignerBrandMap = {
    designers: new Map(),
    brands: new Map(),
  };

  try {
    // Get all designers
    const designers = await pb.collection("designers").getFullList({
      fields: "id,name",
    });

    // Get all brands
    const brands = await pb.collection("brands").getFullList({
      fields: "id,name",
    });

    // Create mapping from name to PocketBase ID
    designers.forEach((designer) => {
      maps.designers.set(designer.name, designer.id);
    });

    brands.forEach((brand) => {
      maps.brands.set(brand.name, brand.id);
    });
  } catch (error) {
    console.error("Failed to fetch existing records:", error);
    throw error;
  }

  return maps;
}

function transformTenure(
  tenure: Tenure,
  recordMaps: DesignerBrandMap
): CreateTenure | null {
  // Get PocketBase IDs for the designer and brand
  const designerId = recordMaps.designers.get(tenure.designer_id);
  const brandId = recordMaps.brands.get(tenure.brand_id);

  if (!designerId || !brandId) {
    return null; // Skip if we can't find the related records
  }

  // Transform the tenure data to match our PocketBase schema
  return {
    designer_id: designerId,
    brand_id: brandId,
    role: tenure.role || "Designer",
    department: tenure.department,
    start_year: tenure.start_year,
    end_year: tenure.end_year,
    is_current_role: Boolean(tenure.is_current_role),
    achievements: tenure.achievements || [],
    notable_works: tenure.notable_works || [],
    notable_collections: tenure.notable_collections || [],
    impact_description: tenure.impact_description,
    // PocketBase relations
    designer: designerId,
    brand: brandId,
  };
}

async function validateTenure(tenure: CreateTenure): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!tenure.designer_id) {
    errors.push("Designer ID is required");
  }
  if (!tenure.brand_id) {
    errors.push("Brand ID is required");
  }
  if (!tenure.role) {
    errors.push("Role is required");
  }

  // Validate years if provided
  const currentYear = new Date().getFullYear();

  if (tenure.start_year !== null && tenure.start_year !== undefined) {
    if (tenure.start_year < 1800 || tenure.start_year > currentYear) {
      errors.push(`Start year must be between 1800 and ${currentYear}`);
    }
  }

  if (tenure.end_year !== null && tenure.end_year !== undefined) {
    if (tenure.end_year < 1800 || tenure.end_year > currentYear) {
      errors.push(`End year must be between 1800 and ${currentYear}`);
    }

    // Check if end year is after start year
    if (tenure.start_year && tenure.end_year < tenure.start_year) {
      errors.push("End year must be after start year");
    }
  }

  // Validate department if provided
  if (tenure.department) {
    const validDepartments = [
      "Jewelry",
      "Watches",
      "Ready-to-Wear",
      "Accessories",
      "Leather Goods",
      "Menswear",
      "Womenswear",
      "Haute Couture",
      "All Departments",
    ];
    if (!validDepartments.includes(tenure.department)) {
      errors.push(
        `Invalid department. Must be one of: ${validDepartments.join(", ")}`
      );
    }
  }

  return errors;
}

export async function migrateTenures(
  options: {
    dryRun?: boolean;
    onProgress?: (stats: TenureMigrationStats) => void;
  } = {}
): Promise<TenureMigrationStats> {
  const stats: TenureMigrationStats = {
    total: 0,
    processed: 0,
    errors: [],
    skipped: [],
  };

  try {
    // Load tenure data and get existing record maps
    const [tenures, recordMaps] = await Promise.all([
      loadTenureData(),
      getExistingRecordMaps(),
    ]);

    stats.total = tenures.length;

    // Transform and validate tenures
    const validTenures = [];
    for (const tenure of tenures) {
      const transformed = transformTenure(tenure, recordMaps);

      if (!transformed) {
        stats.skipped.push({
          id: tenure.id || "unknown",
          reason: "Missing designer or brand reference",
        });
        continue;
      }

      const validationErrors = await validateTenure(transformed);

      if (validationErrors.length > 0) {
        stats.errors.push({
          id: tenure.id || "unknown",
          error: validationErrors.join(", "),
        });
        continue;
      }

      validTenures.push(transformed);
    }

    if (!options.dryRun && validTenures.length > 0) {
      // Perform the actual migration using PocketBase batch operations
      await batchUpsert(pb, "tenures", validTenures, {
        onProgress: (processed) => {
          stats.processed = processed;
          options.onProgress?.(stats);
        },
      });
    }

    return stats;
  } catch (error) {
    console.error("Tenure migration failed:", error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      console.log("Starting tenure migration...");
      const stats = await migrateTenures({
        onProgress: (stats) => {
          console.log(`Processed ${stats.processed}/${stats.total} tenures`);
          if (stats.errors.length > 0) {
            console.log(`Encountered ${stats.errors.length} errors`);
          }
          if (stats.skipped.length > 0) {
            console.log(`Skipped ${stats.skipped.length} records`);
          }
        },
      });

      console.log("Migration completed:", {
        total: stats.total,
        processed: stats.processed,
        errors: stats.errors.length,
        skipped: stats.skipped.length,
      });

      if (stats.errors.length > 0) {
        console.log("Errors:", stats.errors);
      }
      if (stats.skipped.length > 0) {
        console.log("Skipped:", stats.skipped);
      }
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
