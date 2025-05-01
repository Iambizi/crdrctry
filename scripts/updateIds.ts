import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { validate as validateUUID } from 'uuid';
import type { Brand, Designer, Relationship, Tenure } from '../src/types/fashion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateUUID(): string {
  // Use macOS uuidgen command to generate UUID
  return execSync('uuidgen').toString().trim().toLowerCase();
}

function isValidUUID(id: string): boolean {
  try {
    return validateUUID(id);
  } catch {
    return false;
  }
}

function needsIdUpdate(id: string | undefined): boolean {
  if (!id) return false;
  // Check if it's a legacy hyphenated name (e.g., thomas-pink)
  if (id.includes('-') && !id.includes('-', 9) && /^[a-z-]+$/.test(id)) return true;
  // Check if it's a malformed UUID or other non-UUID format
  return !isValidUUID(id);
}

function updateIds() {
  // Load data
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  // Track ID changes for updating references
  const idMapping = new Map<string, string>();

  // Update brand IDs
  fashionGenealogyData.brands = fashionGenealogyData.brands.map(brand => {
    if (brand.id && needsIdUpdate(brand.id)) {
      const oldId = brand.id;
      const newId = generateUUID();
      idMapping.set(oldId, newId);
      console.log(`Converting brand ID: ${oldId} -> ${newId} (${brand.name})`);
      return { ...brand, id: newId };
    }
    return brand;
  });

  // Update designer IDs
  fashionGenealogyData.designers = fashionGenealogyData.designers.map(designer => {
    if (designer.id && needsIdUpdate(designer.id)) {
      const oldId = designer.id;
      const newId = generateUUID();
      idMapping.set(oldId, newId);
      console.log(`Converting designer ID: ${oldId} -> ${newId} (${designer.name})`);
      return { ...designer, id: newId };
    }
    return designer;
  });

  // Update tenure references
  fashionGenealogyData.tenures = fashionGenealogyData.tenures.map(tenure => {
    let updated = false;
    let newDesignerId = tenure.designerId;
    let newBrandId = tenure.brandId;

    // Check for legacy IDs in tenures
    if (tenure.designerId && needsIdUpdate(tenure.designerId)) {
      const oldId = tenure.designerId;
      const newId = generateUUID();
      idMapping.set(oldId, newId);
      console.log(`Converting tenure designer ID: ${oldId} -> ${newId}`);
      newDesignerId = newId;
      updated = true;
    }

    if (tenure.brandId && needsIdUpdate(tenure.brandId)) {
      const oldId = tenure.brandId;
      const newId = generateUUID();
      idMapping.set(oldId, newId);
      console.log(`Converting tenure brand ID: ${oldId} -> ${newId}`);
      newBrandId = newId;
      updated = true;
    }

    // Check for mapped IDs
    if (!updated) {
      const mappedDesignerId = tenure.designerId ? idMapping.get(tenure.designerId) : undefined;
      const mappedBrandId = tenure.brandId ? idMapping.get(tenure.brandId) : undefined;
      if (mappedDesignerId || mappedBrandId) {
        newDesignerId = mappedDesignerId || tenure.designerId;
        newBrandId = mappedBrandId || tenure.brandId;
        updated = true;
      }
    }

    return updated ? { ...tenure, designerId: newDesignerId, brandId: newBrandId } : tenure;
  });

  // Update relationship references
  fashionGenealogyData.relationships = fashionGenealogyData.relationships.map(rel => {
    const newSourceId = rel.sourceDesignerId ? idMapping.get(rel.sourceDesignerId) : undefined;
    const newTargetId = rel.targetDesignerId ? idMapping.get(rel.targetDesignerId) : undefined;
    const newBrandId = rel.brandId ? idMapping.get(rel.brandId) : undefined;

    if (newSourceId || newTargetId || newBrandId) {
      return {
        ...rel,
        sourceDesignerId: newSourceId || rel.sourceDesignerId,
        targetDesignerId: newTargetId || rel.targetDesignerId,
        brandId: newBrandId || rel.brandId
      };
    }
    return rel;
  });

  // Save backup
  const backupPath = fashionGenealogyPath.replace('.json', '.backup.json');
  writeFileSync(backupPath, readFileSync(fashionGenealogyPath));

  // Save updated data
  writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));

  console.log('\nSummary:');
  console.log(`- Updated ${idMapping.size} IDs`);
  console.log('- Backup saved to: src/data/fashionGenealogy.backup.json');
}

try {
  console.log('Updating legacy and malformed IDs...\n');
  updateIds();
} catch (error) {
  console.error('Failed to update IDs:', error);
}
