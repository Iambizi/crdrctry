import { withTransaction } from "../client";
import { Designer, CreateDesigner } from "../types/types";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

async function loadDesignerData(): Promise<Designer[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData);
  return data.designers || [];
}

function transformDesigner(designer: Designer): CreateDesigner {
  return {
    name: designer.name,
    birth_year: designer.birth_year,
    death_year: designer.death_year,
    nationality: designer.nationality,
    education: designer.education,
    awards: designer.awards || [],
    signature_styles: designer.signature_styles || [],
    biography: designer.biography,
    image_url: designer.image_url,
    social_media: designer.social_media,
    status: designer.status || "ACTIVE",
    current_role: designer.current_role,
    is_active: designer.status === "ACTIVE"
  };
}

async function validateDesigner(designer: CreateDesigner): Promise<string[]> {
  const errors: string[] = [];

  // Validate required fields
  if (!designer.name) {
    errors.push("Name is required");
  }

  return errors;
}

export async function migrateDesigners(): Promise<void> {
  const designers = await loadDesignerData();
  let created = 0;
  let errors = 0;

  await withTransaction(async (client) => {
    for (const designer of designers) {
      const transformedDesigner = transformDesigner(designer);
      const validationErrors = await validateDesigner(transformedDesigner);

      if (validationErrors.length > 0) {
        console.error(`Validation errors for designer ${designer.name}:`, validationErrors);
        errors++;
        continue;
      }

      try {
        await client.collection("designers").create(transformedDesigner);
        created++;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error creating designer ${designer.name}:`, error.message);
        } else {
          console.error(`Error creating designer ${designer.name}:`, error);
        }
        errors++;
      }
    }
  });

  console.log(`Designer migration complete:
    Created: ${created}
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
