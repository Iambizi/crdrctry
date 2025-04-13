import { pb } from "../client";
import { batchUpsert } from "../utils/batchOperations";
import { Brand, CreateBrand } from "../types/types";
import * as fs from "fs/promises";
import * as path from "path";

interface BrandMigrationStats {
  total: number;
  processed: number;
  errors: Array<{ id: string; error: string }>;
}

async function loadBrandData(): Promise<Brand[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return data.brands || [];
}

const transformBrand = (brand: Brand): CreateBrand => {
  return {
    name: brand.name,
    founded_year: brand.founded_year,
    founder: brand.founder,
    category: brand.category || "luxury_fashion",
    parent_company: brand.parent_company,
    headquarters: brand.headquarters,
    specialties: brand.specialties,
    price_point: brand.price_point,
    markets: brand.markets,
    website: brand.website,
    social_media: brand.social_media,
    logo_url: brand.logo_url
  };
};

async function validateBrand(brand: CreateBrand): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!brand.name) {
    errors.push("Name is required");
  }

  // Validate founded_year if provided
  if (brand.founded_year !== null) {
    const currentYear = new Date().getFullYear();
    if (brand.founded_year < 1800 || brand.founded_year > currentYear) {
      errors.push(`Founded year must be between 1800 and ${currentYear}`);
    }
  }

  // Validate category
  const validCategories = [
    "luxury_fashion",
    "design_studio",
    "collaboration_line",
    "historical_retail",
    "designer_label",
    "educational_institution",
    "collaboration_partner",
  ];
  if (!validCategories.includes(brand.category)) {
    errors.push(
      `Invalid category. Must be one of: ${validCategories.join(", ")}`
    );
  }

  // Validate website URL if provided
  if (brand.website) {
    try {
      new URL(brand.website);
    } catch {
      errors.push("Invalid website URL format");
    }
  }

  // Validate logo_url if provided
  if (brand.logo_url) {
    try {
      new URL(brand.logo_url);
    } catch {
      errors.push("Invalid logo URL format");
    }
  }

  return errors;
}

export async function migrateBrands(
  options: {
    dryRun?: boolean;
    onProgress?: (stats: BrandMigrationStats) => void;
  } = {}
): Promise<BrandMigrationStats> {
  const stats: BrandMigrationStats = {
    total: 0,
    processed: 0,
    errors: [],
  };

  try {
    // Load brand data
    const brands = await loadBrandData();
    stats.total = brands.length;

    // Transform and validate brands
    const validBrands = [];
    for (const brand of brands) {
      const transformed = transformBrand(brand);
      const validationErrors = await validateBrand(transformed);

      if (validationErrors.length > 0) {
        stats.errors.push({
          id: brand.id || "unknown",
          error: validationErrors.join(", "),
        });
        continue;
      }

      validBrands.push(transformed);
    }

    if (!options.dryRun && validBrands.length > 0) {
      // Perform the actual migration using PocketBase batch operations
      await batchUpsert(pb, "brands", validBrands, {
        onProgress: (processed) => {
          stats.processed = processed;
          options.onProgress?.(stats);
        },
      });
    }

    return stats;
  } catch (error) {
    console.error("Brand migration failed:", error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      console.log("Starting brand migration...");
      const stats = await migrateBrands({
        onProgress: (stats) => {
          console.log(`Processed ${stats.processed}/${stats.total} brands`);
          if (stats.errors.length > 0) {
            console.log(`Encountered ${stats.errors.length} errors`);
          }
        },
      });

      console.log("Migration completed:", {
        total: stats.total,
        processed: stats.processed,
        errors: stats.errors.length,
      });

      if (stats.errors.length > 0) {
        console.log("Errors:", stats.errors);
      }
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
