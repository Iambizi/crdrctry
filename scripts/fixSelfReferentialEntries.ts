import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Brand, Designer, Relationship, Tenure } from '../src/types/fashion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EntityMapping {
  oldId: string;
  name: string;
  type: 'designer' | 'brand';
  affectedTenures: number;
  affectedRelationships: number;
}

function analyzeAndFixSelfRefs() {
  // Load data
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  // Create name lookup maps
  const designerNames = new Map<string, string>();
  const brandNames = new Map<string, string>();
  fashionGenealogyData.designers.forEach(d => designerNames.set(d.id, d.name));
  fashionGenealogyData.brands.forEach(b => brandNames.set(b.id, b.name));

  // Track self-referential entries
  const selfRefs = new Map<string, EntityMapping>();

  // Check tenures for self-references
  console.log('Analyzing tenures for self-references...');
  const selfRefTenures = fashionGenealogyData.tenures.filter(tenure => {
    if (tenure.designerId === tenure.brandId) {
      const designerName = designerNames.get(tenure.designerId) || 'Unknown Designer';
      const mapping: EntityMapping = selfRefs.get(tenure.designerId) || {
        oldId: tenure.designerId,
        name: designerName,
        type: 'designer',
        affectedTenures: 0,
        affectedRelationships: 0
      };
      mapping.affectedTenures++;
      selfRefs.set(tenure.designerId, mapping);
      return true;
    }
    return false;
  });

  // Check relationships for self-references
  console.log('Analyzing relationships for self-references...');
  const selfRefRelationships = fashionGenealogyData.relationships.filter(rel => {
    if (rel.sourceDesignerId === rel.targetDesignerId) {
      const designerName = designerNames.get(rel.sourceDesignerId) || 'Unknown Designer';
      const mapping: EntityMapping = selfRefs.get(rel.sourceDesignerId) || {
        oldId: rel.sourceDesignerId,
        name: designerName,
        type: 'designer',
        affectedTenures: 0,
        affectedRelationships: 0
      };
      mapping.affectedRelationships++;
      selfRefs.set(rel.sourceDesignerId, mapping);
      return true;
    }
    return false;
  });

  // Remove self-referential relationships
  console.log('\nRemoving self-referential entries...');
  fashionGenealogyData.relationships = fashionGenealogyData.relationships.filter(
    rel => rel.sourceDesignerId !== rel.targetDesignerId
  );

  // Remove self-referential tenures
  fashionGenealogyData.tenures = fashionGenealogyData.tenures.filter(
    tenure => tenure.designerId !== tenure.brandId
  );

  // Save backup
  const backupPath = fashionGenealogyPath.replace('.json', '.backup.json');
  writeFileSync(backupPath, readFileSync(fashionGenealogyPath));

  // Save updated data
  writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));

  // Generate report
  console.log('\nSelf-referential entries found:');
  for (const [id, mapping] of selfRefs.entries()) {
    console.log(`\n${mapping.name} (${id}):`);
    if (mapping.affectedTenures > 0) {
      console.log(`- ${mapping.affectedTenures} tenure(s)`);
    }
    if (mapping.affectedRelationships > 0) {
      console.log(`- ${mapping.affectedRelationships} relationship(s)`);
    }
  }

  console.log('\nSummary:');
  console.log(`- Removed ${selfRefTenures.length} self-referential tenures`);
  console.log(`- Removed ${selfRefRelationships.length} self-referential relationships`);
  console.log('- Backup saved to: src/data/fashionGenealogy.backup.json');
}

try {
  console.log('Analyzing and fixing self-referential entries...\n');
  analyzeAndFixSelfRefs();
} catch (error) {
  console.error('Failed to fix self-referential entries:', error);
}
