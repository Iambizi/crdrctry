import { withTransaction } from "../client";
import { CreateRelationship, RelationshipType } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);

interface RawRelationship {
  id: string;
  sourceDesignerId: string;
  targetDesignerId: string;
  brandId: string;
  type: RelationshipType;
  startYear?: number;
  endYear?: number;
  description?: string;
  impact?: string;
  collaborationProjects?: string[];
  createdAt: string;
  updatedAt: string;
}

async function loadRelationshipData(): Promise<RawRelationship[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return (data.relationships || []).filter((r: RawRelationship) => {
    return r.sourceDesignerId && r.targetDesignerId && r.brandId;
  });
}

async function findOrCreateDesigner(name: string, client: PocketBase): Promise<string> {
  if (!name) {
    throw new Error("Designer name is required");
  }
  try {
    const records = await client.collection("designers").getFullList();
    const match = records.find(r => r.name && r.name.toLowerCase() === name.toLowerCase());
    if (match) {
      return match.id;
    }
    // Designer not found, create them
    console.log(`Creating missing designer: ${name}`);
    const newDesigner = await client.collection("designers").create({
      name: name,
      currentRole: '',
      status: 'active',
      isActive: false,
      biography: '',
      education: [],
      awards: [],
      socialMedia: {},
      imageUrl: '',
      nationality: '',
      signatureStyles: []
    });
    return newDesigner.id;
  } catch (error) {
    console.error(`Error finding/creating designer ${name}:`, error);
    throw error;
  }
}

async function findOrCreateBrand(name: string, client: PocketBase): Promise<string> {
  if (!name) {
    throw new Error("Brand name is required");
  }
  try {
    const records = await client.collection("brands").getFullList();
    const match = records.find(r => r.name && r.name.toLowerCase() === name.toLowerCase());
    if (match) {
      return match.id;
    }
    // Brand not found, create it
    console.log(`Creating missing brand: ${name}`);
    const newBrand = await client.collection("brands").create({
      name: name,
      description: '',
      foundingYear: null,
      headquarters: '',
      parentCompany: '',
      website: '',
      socialMedia: {},
      logoUrl: '',
      specialties: [],
      priceRange: '',
      marketSegment: '',
      isActive: true
    });
    return newBrand.id;
  } catch (error) {
    console.error(`Error finding/creating brand ${name}:`, error);
    throw error;
  }
}

function transformRelationship(
  relationship: RawRelationship,
  sourceDesignerId: string,
  targetDesignerId: string,
  brandId: string
): CreateRelationship {
  return {
    sourceDesignerId,
    targetDesignerId,
    brandId,
    type: relationship.type,
    startYear: relationship.startYear,
    endYear: relationship.endYear,
    description: relationship.description,
    impact: relationship.impact,
    collaborationProjects: relationship.collaborationProjects || [],
  };
}

async function validateRelationship(relationship: CreateRelationship): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!relationship.sourceDesignerId) {
    errors.push("Source designer is required");
  }
  if (!relationship.targetDesignerId) {
    errors.push("Target designer is required");
  }
  if (!relationship.brandId) {
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
        const sourceDesignerId = await findOrCreateDesigner(relationship.sourceDesignerId, client);
        const targetDesignerId = await findOrCreateDesigner(relationship.targetDesignerId, client);
        const brandId = await findOrCreateBrand(relationship.brandId, client);

        const transformedRelationship = transformRelationship(
          relationship,
          sourceDesignerId,
          targetDesignerId,
          brandId
        );

        const validationErrors = await validateRelationship(transformedRelationship);

        if (validationErrors.length > 0) {
          console.error(
            `Validation errors for relationship between ${relationship.sourceDesignerId} and ${relationship.targetDesignerId}:`,
            validationErrors
          );
          errors++;
          continue;
        }

        await client.collection("relationships").create(transformedRelationship);
        created++;
      } catch (error) {
        console.error(
          `Error creating relationship between ${relationship.sourceDesignerId} and ${relationship.targetDesignerId}:`,
          error
        );
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
