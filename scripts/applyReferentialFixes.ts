import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Brand, Designer, Relationship, Tenure } from '../src/types/fashion.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function applyFixes() {
  // Load data
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  // Create id-to-name mappings for logging
  const designerIdToName = new Map<string, string>();
  fashionGenealogyData.designers.forEach(d => {
    designerIdToName.set(d.id, d.name);
  });

  // Fix legacy IDs first
  const legacyIdFixes = new Map<string, string>();
  fashionGenealogyData.designers = fashionGenealogyData.designers.map(designer => {
    if (designer.id.includes('-') && !designer.id.includes('-', 9)) { // Has hyphen but not UUID format
      const newId = uuidv4();
      legacyIdFixes.set(designer.id, newId);
      console.log(`Converting legacy ID: ${designer.id} -> ${newId} (${designer.name})`);
      return { ...designer, id: newId };
    }
    return designer;
  });

  // Update references to legacy IDs
  if (legacyIdFixes.size > 0) {
    fashionGenealogyData.tenures = fashionGenealogyData.tenures.map(tenure => {
      const newDesignerId = legacyIdFixes.get(tenure.designerId);
      if (newDesignerId) {
        return { ...tenure, designerId: newDesignerId };
      }
      return tenure;
    });

    fashionGenealogyData.relationships = fashionGenealogyData.relationships.map(rel => {
      const newSourceId = legacyIdFixes.get(rel.sourceDesignerId);
      const newTargetId = legacyIdFixes.get(rel.targetDesignerId);
      if (newSourceId || newTargetId) {
        return {
          ...rel,
          sourceDesignerId: newSourceId || rel.sourceDesignerId,
          targetDesignerId: newTargetId || rel.targetDesignerId
        };
      }
      return rel;
    });
  }

  // Remove self-referential relationships
  const selfRefs = fashionGenealogyData.relationships.filter(
    rel => rel.sourceDesignerId === rel.targetDesignerId
  );

  if (selfRefs.length > 0) {
    console.log('\nRemoving self-referential relationships:');
    selfRefs.forEach(rel => {
      const name = designerIdToName.get(rel.sourceDesignerId);
      console.log(`- ${name} (${rel.sourceDesignerId})`);
    });

    fashionGenealogyData.relationships = fashionGenealogyData.relationships.filter(
      rel => rel.sourceDesignerId !== rel.targetDesignerId
    );
  }

  // Save updated data
  const backupPath = fashionGenealogyPath.replace('.json', '.backup.json');
  writeFileSync(backupPath, readFileSync(fashionGenealogyPath));
  writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));

  console.log('\nSummary:');
  console.log(`- Fixed ${legacyIdFixes.size} legacy IDs`);
  console.log(`- Removed ${selfRefs.length} self-referential relationships`);
  console.log('\nBackup saved to: src/data/fashionGenealogy.backup.json');
}

try {
  console.log('Applying fixes to fashion genealogy data...\n');
  applyFixes();
} catch (error) {
  console.error('Failed to apply fixes:', error);
}
