import { withTransaction } from "../client";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';
import PocketBase, { ClientResponseError } from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);

interface RawDesigner {
  id: string;
  name: string;
  biography?: string;
  education?: string[];
  awards?: string[];
  social_media?: Record<string, string>;
  profile_image?: string;
  birth_year?: number;
  death_year?: number;
  nationality?: string;
  signature_styles?: string[];
  status?: 'Active' | 'Inactive' | 'Retired' | 'Deceased' | 'Unknown';
  current_role?: string;
  is_active?: boolean;
}

interface DesignerData {
  designers: Array<{
    id: string;
    name?: string;
    biography?: string;
    education?: string[];
    awards?: string[];
    social_media?: Record<string, string>;
    profile_image?: string;
    birth_year?: string | number;
    death_year?: string | number;
    nationality?: string;
    signature_styles?: string[];
    status?: string;
    current_role?: string;
    is_active?: boolean;
  }>;
}

async function loadDesignerData(): Promise<RawDesigner[]> {
  const dataPath = path.join(process.cwd(), "src/data/fashionGenealogy.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(rawData) as DesignerData;
  
  console.log(`Loaded ${data.designers?.length || 0} designers from JSON`);
  
  // Transform and validate designers
  const designers = (data.designers || []).map((d): RawDesigner => ({
    id: d.id,
    name: d.name?.trim() || '',
    biography: d.biography?.trim(),
    education: Array.isArray(d.education) ? d.education : [],
    awards: Array.isArray(d.awards) ? d.awards : [],
    social_media: typeof d.social_media === 'object' ? d.social_media : {},
    profile_image: d.profile_image?.trim(),
    birth_year: typeof d.birth_year === 'string' ? Number(d.birth_year) : d.birth_year,
    death_year: typeof d.death_year === 'string' ? Number(d.death_year) : d.death_year,
    nationality: d.nationality?.trim(),
    signature_styles: Array.isArray(d.signature_styles) ? d.signature_styles : [],
    status: d.status as RawDesigner['status'] || 'Unknown',
    current_role: d.current_role?.trim(),
    is_active: Boolean(d.is_active)
  }));

  // Filter out invalid designers
  const validDesigners = designers.filter(d => {
    const isValid = Boolean(d.name);
    if (!isValid) {
      console.log('Invalid designer:', d);
    }
    return isValid;
  });

  console.log(`Found ${validDesigners.length} valid designers`);
  return validDesigners;
}

async function createDesigner(designer: RawDesigner, client: PocketBase): Promise<void> {
  try {
    // Check if designer already exists
    const existing = await client.collection('designers').getFirstListItem(`name = "${designer.name}"`);
    if (existing) {
      console.log(`Designer already exists: ${designer.name}`);
      return;
    }
  } catch (error) {
    // 404 means designer doesn't exist, which is what we want
    if (error instanceof ClientResponseError && error.status !== 404) {
      throw error;
    }
  }

  console.log(`Creating designer: ${designer.name}`);
  await client.collection('designers').create({
    name: designer.name,
    biography: designer.biography || '',
    education: designer.education || [],
    awards: designer.awards || [],
    social_media: designer.social_media || {},
    profile_image: designer.profile_image || '',
    birth_year: designer.birth_year,
    death_year: designer.death_year,
    nationality: designer.nationality || '',
    signature_styles: designer.signature_styles || [],
    status: designer.status || 'Unknown',
    current_role: designer.current_role || '',
    is_active: designer.is_active || false
  });
}

export async function migrateDesigners(): Promise<void> {
  console.log('Starting designer migration...');
  const designers = await loadDesignerData();
  let created = 0;
  let errors = 0;

  await withTransaction(async (client) => {
    for (const designer of designers) {
      try {
        await createDesigner(designer, client);
        created++;
      } catch (error) {
        console.error(`Error creating designer ${designer.name}:`, error);
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
      await migrateDesigners();
      console.log('Migration completed');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
