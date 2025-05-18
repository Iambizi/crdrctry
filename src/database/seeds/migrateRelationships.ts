import PocketBase from 'pocketbase';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { withTransaction } from "../client";
import { CreateRelationship, RelationshipType, VerificationStatus } from "../types/types";

const __filename = fileURLToPath(import.meta.url);

interface RawRelationship {
  sourceDesignerId: string;
  targetDesignerId: string;
  brandId: string;
  type: RelationshipType;
  startYear?: number;
  endYear?: number;
  description?: string;
  collaborationProjects?: string[];
}

async function loadRelationshipData(): Promise<RawRelationship[]> {
  const filePath = path.join(path.dirname(__filename), '../../data/relationships.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data).map((r: RawRelationship) => ({
    ...r,
    collaborationProjects: r.collaborationProjects || []
  }));
}

async function findDesignerName(id: string, client: PocketBase): Promise<string> {
  try {
    const record = await client.collection("designers").getOne(id);
    if (!record || !record.name) {
      throw new Error(`Designer ${id} not found or missing name`);
    }
    return record.name;
  } catch (error) {
    console.error(`Error finding designer ${id}:`, error);
    throw error;
  }
}

async function findBrandName(id: string, client: PocketBase): Promise<string> {
  try {
    const record = await client.collection("brands").getOne(id);
    if (!record || !record.name) {
      throw new Error(`Brand ${id} not found or missing name`);
    }
    return record.name;
  } catch (error) {
    console.error(`Error finding brand ${id}:`, error);
    throw error;
  }
}

function transformRelationship(
  relationship: RawRelationship,
  sourceDesignerName: string,
  targetDesignerName: string,
  brandName: string
): CreateRelationship {
  return {
    sourceDesigner: sourceDesignerName,
    targetDesigner: targetDesignerName,
    brand: brandName,
    type: relationship.type,
    startYear: relationship.startYear,
    endYear: relationship.endYear,
    description: relationship.description,
    collaborationProjects: relationship.collaborationProjects || [],
    verificationStatus: VerificationStatus.unverified
  };
}

async function validateRelationship(relationship: CreateRelationship): Promise<string[]> {
  const errors: string[] = [];

  if (!relationship.sourceDesigner) {
    errors.push("Source designer is required");
  }
  if (!relationship.targetDesigner) {
    errors.push("Target designer is required");
  }
  if (!relationship.brand) {
    errors.push("Brand is required");
  }
  if (!relationship.type) {
    errors.push("Type is required");
  }

  return errors;
}

export async function migrateRelationships(relationships: RawRelationship[], pocketBaseClient: PocketBase): Promise<{ created: number; errors: number }> {
  let created = 0;
  let errors = 0;
  const processedRelationships = new Set<string>();

  await withTransaction(async (client: PocketBase) => {
    for (const relationship of relationships) {
      try {
        const sourceDesignerName = await findDesignerName(relationship.sourceDesignerId, client);
        const targetDesignerName = await findDesignerName(relationship.targetDesignerId, client);
        const brandName = await findBrandName(relationship.brandId, client);

        const transformedRelationship = transformRelationship(
          relationship,
          sourceDesignerName,
          targetDesignerName,
          brandName
        );

        const validationErrors = await validateRelationship(transformedRelationship);
        if (validationErrors.length > 0) {
          console.error(`Validation errors for relationship ${relationship.sourceDesignerId} -> ${relationship.targetDesignerId}:`, validationErrors);
          errors++;
          continue;
        }

        console.log(`Creating relationship: ${relationship.sourceDesignerId} -> ${relationship.targetDesignerId}`);
        await client.collection("fd_relationships").create(transformedRelationship);
        processedRelationships.add(JSON.stringify([relationship.sourceDesignerId, relationship.targetDesignerId, relationship.brandId]));
        created++;
      } catch (error) {
        console.error(`Error processing relationship ${relationship.sourceDesignerId} -> ${relationship.targetDesignerId}:`, error);
        errors++;
      }
    }
  }, pocketBaseClient);

  console.log(`Created ${created} relationships with ${errors} errors`);
  return { created, errors };
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const relationships = await loadRelationshipData();
  await migrateRelationships(relationships, new PocketBase(process.env.POCKETBASE_URL));
}
