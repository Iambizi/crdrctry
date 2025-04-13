import { withTransaction } from "../client";
import { Brand, CreateBrand } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

async function loadBrandData(): Promise<Brand[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return data.brands || [];
}

function transformBrand(brand: Brand): CreateBrand {
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
}

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

export async function migrateBrands(): Promise<void> {
  const brands = await loadBrandData();
  let created = 0;
  let errors = 0;

  await withTransaction(async (client) => {
    for (const brand of brands) {
      const transformedBrand = transformBrand(brand);
      const validationErrors = await validateBrand(transformedBrand);

      if (validationErrors.length > 0) {
        console.error(`Validation errors for brand ${brand.name}:`, validationErrors);
        errors++;
        continue;
      }

      try {
        await client.collection("brands").create(transformedBrand);
        created++;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error creating brand ${brand.name}:`, error.message);
        } else {
          console.error(`Error creating brand ${brand.name}:`, error);
        }
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
      console.log("Starting brand migration...");
      await migrateBrands();
      console.log("Migration completed");
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
