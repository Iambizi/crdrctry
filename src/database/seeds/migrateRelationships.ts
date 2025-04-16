import { withTransaction } from "../client";
import { Relationship, CreateRelationship } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);

async function loadRelationshipData(): Promise<Relationship[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return (data.relationships || []).filter((r: Relationship) => r.source_designer && r.target_designer && r.brand);
}

async function findDesignerId(name: string, client: PocketBase): Promise<string> {
  if (!name) {
    throw new Error("Designer name is required");
  }
  try {
    const records = await client.collection("designers").getFullList();
    const searchName = name.toLowerCase();
    const match = records.find(r => r.name && r.name.toLowerCase() === searchName);
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
    const searchName = name.toLowerCase();
    const match = records.find(r => r.name && r.name.toLowerCase() === searchName);
    if (match) {
      return match.id;
    }
    throw new Error(`Brand not found: ${name}`);
  } catch (error) {
    console.error(`Error finding brand ${name}:`, error);
    throw error;
  }
}

function transformRelationship(
  relationship: Relationship,
  sourceDesignerId: string,
  targetDesignerId: string,
  brandId: string
): CreateRelationship {
  return {
    source_designer: sourceDesignerId,
    target_designer: targetDesignerId,
    brand: brandId,
    type: relationship.type,
    start_year: relationship.start_year,
    end_year: relationship.end_year,
    description: relationship.description,
    impact: relationship.impact,
    collaboration_projects: relationship.collaboration_projects || [],
  };
}

async function validateRelationship(relationship: CreateRelationship): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!relationship.source_designer) {
    errors.push("Source designer is required");
  }
  if (!relationship.target_designer) {
    errors.push("Target designer is required");
  }
  if (!relationship.brand) {
    errors.push("Brand is required");
  }
  if (!relationship.type) {
    errors.push("Relationship type is required");
  }

  return errors;
}

export async function migrateRelationships(): Promise<void> {
  const relationships = await loadRelationshipData();
  let created = 0;
  let errors = 0;

  await withTransaction(async (client) => {
    for (const relationship of relationships) {
      try {
        const sourceDesignerId = await findDesignerId(relationship.source_designer, client);
        const targetDesignerId = await findDesignerId(relationship.target_designer, client);
        const brandId = await findBrandId(relationship.brand, client);

        const transformedRelationship = transformRelationship(
          relationship,
          sourceDesignerId,
          targetDesignerId,
          brandId
        );

        const validationErrors = await validateRelationship(transformedRelationship);

        if (validationErrors.length > 0) {
          console.error(
            `Validation errors for relationship between ${relationship.source_designer} and ${relationship.target_designer}:`,
            validationErrors
          );
          errors++;
          continue;
        }

        await client.collection("relationships").create(transformedRelationship);
        created++;
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `Error creating relationship between ${relationship.source_designer} and ${relationship.target_designer}:`,
            error.message
          );
        } else {
          console.error(
            `Error creating relationship between ${relationship.source_designer} and ${relationship.target_designer}:`,
            error
          );
        }
        errors++;
      }
    }
  });

  console.log(`Relationship migration complete:
    Created: ${created}
    Errors: ${errors}
  `);
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  (async () => {
    try {
      console.log("Starting relationship migration...");
      await migrateRelationships();
      console.log("Migration completed");
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
