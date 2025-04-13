import { pb } from "../client";
import { batchUpsert } from "../utils/batchOperations";
import { CreateRelationship, RelationshipType } from "../types/types";
import * as fs from "fs/promises";
import * as path from "path";

interface RelationshipMigrationStats {
  total: number;
  processed: number;
  errors: Array<{ id: string; error: string }>;
  skipped: Array<{ id: string; reason: string }>;
}

interface DesignerBrandMap {
  designers: Map<string, string>; // old_id -> pocketbase_id
  brands: Map<string, string>; // old_id -> pocketbase_id
}

interface LegacyRelationship {
  source_designer_name: string;
  target_designer_name: string;
  brand_name: string;
  type: string;
  start_year?: number;
  end_year?: number;
  description?: string;
  impact?: string;
  collaboration_projects?: string[];
  confidence_score?: number;
}

async function loadRelationshipData(): Promise<LegacyRelationship[]> {
  // Load from both main and enriched data sources
  const mainDataPath = path.join(
    process.cwd(),
    "src/data/fashionGenealogy.json"
  );
  const enrichedDataPath = path.join(
    process.cwd(),
    "src/data/enrichedRelationships.json"
  );

  try {
    const [mainData, enrichedData] = await Promise.all([
      fs.readFile(mainDataPath, "utf-8").then(JSON.parse),
      fs
        .readFile(enrichedDataPath, "utf-8")
        .then(JSON.parse)
        .catch(() => ({ relationships: [] })),
    ]);

    // Combine and deduplicate relationships
    const relationships = new Map();

    // Add main relationships
    mainData.relationships?.forEach((rel: LegacyRelationship) => {
      const key = `${rel.source_designer_name}-${rel.target_designer_name}-${rel.brand_name}`;
      relationships.set(key, rel);
    });

    // Add/update with enriched relationships
    enrichedData.relationships?.forEach((rel: LegacyRelationship) => {
      const key = `${rel.source_designer_name}-${rel.target_designer_name}-${rel.brand_name}`;
      if (!relationships.has(key) || (rel.confidence_score !== undefined && rel.confidence_score > 70)) {
        relationships.set(key, rel);
      }
    });

    return Array.from(relationships.values());
  } catch (error) {
    console.error("Failed to load relationship data:", error);
    throw error;
  }
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

function transformRelationship(
  relationship: LegacyRelationship,
  recordMaps: DesignerBrandMap
): CreateRelationship | null {
  // Get PocketBase IDs for the designers and brand
  const sourceDesignerId = recordMaps.designers.get(
    relationship.source_designer_name
  );
  const targetDesignerId = recordMaps.designers.get(
    relationship.target_designer_name
  );
  const brandId = recordMaps.brands.get(relationship.brand_name);

  if (!sourceDesignerId || !targetDesignerId || !brandId) {
    return null; // Skip if we can't find any of the related records
  }

  return {
    source_designer: sourceDesignerId,
    target_designer: targetDesignerId,
    brand: brandId,
    type: relationship.type as RelationshipType,
    start_year: relationship.start_year,
    end_year: relationship.end_year,
    description: relationship.description,
    impact: relationship.impact,
    collaboration_projects: relationship.collaboration_projects || [],
  };
}

async function validateRelationship(
  relationship: CreateRelationship
): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!relationship.source_designer) {
    errors.push("Source designer ID is required");
  }
  if (!relationship.target_designer) {
    errors.push("Target designer ID is required");
  }
  if (!relationship.brand) {
    errors.push("Brand ID is required");
  }
  if (!relationship.type) {
    errors.push("Relationship type is required");
  }

  // Validate relationship type
  const validTypes = ["mentorship", "succession", "collaboration", "familial"];
  if (!validTypes.includes(relationship.type)) {
    errors.push(
      `Invalid relationship type. Must be one of: ${validTypes.join(", ")}`
    );
  }

  // Validate years if provided
  const currentYear = new Date().getFullYear();

  if (
    relationship.start_year !== null &&
    relationship.start_year !== undefined
  ) {
    if (
      relationship.start_year < 1800 ||
      relationship.start_year > currentYear
    ) {
      errors.push(`Start year must be between 1800 and ${currentYear}`);
    }
  }

  if (relationship.end_year !== null && relationship.end_year !== undefined) {
    if (relationship.end_year < 1800 || relationship.end_year > currentYear) {
      errors.push(`End year must be between 1800 and ${currentYear}`);
    }

    if (
      relationship.start_year &&
      relationship.end_year < relationship.start_year
    ) {
      errors.push("End year must be after start year");
    }
  }

  return errors;
}

export async function migrateRelationships(
  options: {
    dryRun?: boolean;
    onProgress?: (stats: RelationshipMigrationStats) => void;
  } = {}
): Promise<RelationshipMigrationStats> {
  const stats: RelationshipMigrationStats = {
    total: 0,
    processed: 0,
    errors: [],
    skipped: [],
  };

  try {
    // Load relationship data and get existing record maps
    const [relationships, recordMaps] = await Promise.all([
      loadRelationshipData(),
      getExistingRecordMaps(),
    ]);

    stats.total = relationships.length;

    // Transform and validate relationships
    const validRelationships = [];
    for (const relationship of relationships) {
      const transformed = transformRelationship(relationship, recordMaps);

      if (!transformed) {
        stats.skipped.push({
          id: `${relationship.source_designer_name}-${relationship.target_designer_name}`,
          reason: "Missing designer or brand reference",
        });
        continue;
      }

      const validationErrors = await validateRelationship(transformed);

      if (validationErrors.length > 0) {
        stats.errors.push({
          id: `${relationship.source_designer_name}-${relationship.target_designer_name}`,
          error: validationErrors.join(", "),
        });
        continue;
      }

      validRelationships.push(transformed);
    }

    if (!options.dryRun && validRelationships.length > 0) {
      // Perform the actual migration using PocketBase batch operations
      await batchUpsert(pb, "relationships", validRelationships, {
        onProgress: (processed) => {
          stats.processed = processed;
          options.onProgress?.(stats);
        },
      });
    }

    return stats;
  } catch (error) {
    console.error("Relationship migration failed:", error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      console.log("Starting relationship migration...");
      const stats = await migrateRelationships({
        onProgress: (stats) => {
          console.log(
            `Processed ${stats.processed}/${stats.total} relationships`
          );
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
