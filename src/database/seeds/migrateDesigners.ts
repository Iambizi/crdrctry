import { Designer, CreateDesigner } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const pb = new PocketBase(process.env.POCKETBASE_URL);

async function loadDesignerData(): Promise<Designer[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  
  console.log(`Loaded ${data.designers?.length || 0} designers from JSON`);
  
  // Get unique designers by name
  const uniqueDesigners = new Map();
  data.designers.forEach((designer: Designer) => {
    if (!uniqueDesigners.has(designer.name.toLowerCase())) {
      uniqueDesigners.set(designer.name.toLowerCase(), designer);
    }
  });
  
  const designers = Array.from(uniqueDesigners.values());
  console.log(`Found ${designers.length} valid unique designers`);
  return designers;
}

async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('Successfully authenticated with PocketBase');
  } catch (error) {
    console.error('Failed to authenticate with PocketBase:', error);
    throw error;
  }
}

async function validateDesigner(designer: CreateDesigner): Promise<string[]> {
  const errors: string[] = [];

  if (!designer.name) {
    errors.push("Name is required");
  }
  if (designer.is_active === undefined) {
    errors.push("is_active is required");
  }
  if (!designer.status) {
    errors.push("status is required");
  }

  return errors;
}

export async function migrateDesigners(): Promise<void> {
  console.log("Starting designer migration...");
  const designers = await loadDesignerData();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  await authenticateAdmin();

  // First, delete all existing records
  try {
    const existingDesigners = await pb.collection('designers').getFullList();
    console.log(`Found ${existingDesigners.length} existing designers, deleting...`);
    for (const designer of existingDesigners) {
      await pb.collection('designers').delete(designer.id);
    }
    console.log('Deleted all existing designers');
  } catch (error) {
    console.error('Error deleting existing designers:', error);
  }

  // Create a Set to track unique designer names
  const processedDesigners = new Set<string>();

  for (const designer of designers) {
    try {
      // Skip if we've already processed this designer name
      if (processedDesigners.has(designer.name.toLowerCase())) {
        console.log(`Skipping duplicate designer: ${designer.name}`);
        skipped++;
        continue;
      }

      const transformedDesigner: CreateDesigner = {
        name: designer.name,
        current_role: designer.current_role || '',
        is_active: designer.is_active !== undefined ? designer.is_active : true,
        status: designer.status || 'ACTIVE',
        biography: designer.biography || '',
        image_url: designer.image_url || '',
        nationality: designer.nationality || '',
        birth_year: designer.birth_year,
        death_year: designer.death_year,
        awards: designer.awards || [],
        education: designer.education || [],
        signature_styles: designer.signature_styles || [],
        social_media: designer.social_media || {},
      };

      const validationErrors = await validateDesigner(transformedDesigner);
      if (validationErrors.length > 0) {
        console.error(`Validation errors for designer ${designer.name}:`, validationErrors);
        errors++;
        continue;
      }

      console.log(`Creating designer: ${designer.name}`);
      await pb.collection("designers").create(transformedDesigner);
      processedDesigners.add(designer.name.toLowerCase());
      created++;
    } catch (error) {
      console.error(`Error creating designer ${designer.name}:`, error);
      errors++;
    }
  }

  console.log(`Designer migration complete:
    Created: ${created}
    Skipped: ${skipped}
    Errors: ${errors}
  `);
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  (async () => {
    try {
      console.log("Starting designer migration...");
      await migrateDesigners();
      console.log("Migration completed");
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
