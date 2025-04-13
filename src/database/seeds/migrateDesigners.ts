import { pb } from "../client";
import { batchUpsert } from "../utils/batchOperations";
import { Designer, CreateDesigner } from "../types/types";
import * as fs from "fs/promises";
import * as path from "path";

interface DesignerMigrationStats {
  total: number;
  processed: number;
  errors: Array<{ id: string; error: string }>;
}

async function loadDesignerData(): Promise<Designer[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return data.designers || [];
}

function transformDesigner(designer: Designer): CreateDesigner {
  // Transform the designer data to match our PocketBase schema
  return {
    name: designer.name,
    current_role: designer.current_role,
    is_active: designer.status === "ACTIVE",
    status: designer.status,
    biography: designer.biography,
    image_url: designer.image_url,
    nationality: designer.nationality,
    birth_year: designer.birth_year,
    death_year: designer.death_year,
    awards: designer.awards || [],
    education: designer.education || [],
    signature_styles: designer.signature_styles || [],
    social_media: designer.social_media || {},
  };
}

async function validateDesigner(designer: CreateDesigner): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!designer.name) {
    errors.push("Name is required");
  }

  // Validate years
  if (
    designer.birth_year &&
    designer.death_year &&
    designer.birth_year > designer.death_year
  ) {
    errors.push("Birth year must be before death year");
  }

  // Validate status
  if (!["ACTIVE", "RETIRED", "DECEASED"].includes(designer.status)) {
    errors.push("Invalid status value");
  }

  return errors;
}

export async function migrateDesigners(
  options: {
    dryRun?: boolean;
    onProgress?: (stats: DesignerMigrationStats) => void;
  } = {}
): Promise<DesignerMigrationStats> {
  const stats: DesignerMigrationStats = {
    total: 0,
    processed: 0,
    errors: [],
  };

  try {
    // Load designer data
    const designers = await loadDesignerData();
    stats.total = designers.length;

    // Transform and validate designers
    const validDesigners = [];
    for (const designer of designers) {
      const transformed = transformDesigner(designer);
      const validationErrors = await validateDesigner(transformed);

      if (validationErrors.length > 0) {
        stats.errors.push({
          id: designer.id || "unknown",
          error: validationErrors.join(", "),
        });
        continue;
      }

      validDesigners.push(transformed);
    }

    if (!options.dryRun && validDesigners.length > 0) {
      // Perform the actual migration using PocketBase batch operations
      await batchUpsert(pb, "designers", validDesigners, {
        onProgress: (processed) => {
          stats.processed = processed;
          options.onProgress?.(stats);
        },
      });
    }

    return stats;
  } catch (error) {
    console.error("Designer migration failed:", error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      console.log("Starting designer migration...");
      const stats = await migrateDesigners({
        onProgress: (stats) => {
          console.log(`Processed ${stats.processed}/${stats.total} designers`);
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
