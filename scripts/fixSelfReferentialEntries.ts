import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Brand, Designer, Relationship, Tenure } from '../src/types/fashion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EntityMapping {
  oldId: string;
  designerName: string;
  brandName: string;
  affectedTenures: Array<{
    id: string;
    role: string;
    startYear: number;
    endYear: number | null;
  }>;
  affectedRelationships: Array<{
    id: string;
    type: 'source' | 'target' | 'both';
  }>;
}

interface UpdatePlan {
  mappings: { [key: string]: EntityMapping };
  summary: {
    totalMappings: number;
    totalAffectedTenures: number;
    totalAffectedRelationships: number;
  };
}

function createUpdatePlan(): UpdatePlan {
  // Load fashion genealogy data
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  // Create id-to-name mappings
  const designerIdToName = new Map<string, string>();
  const brandIdToName = new Map<string, string>();

  fashionGenealogyData.designers.forEach(d => {
    designerIdToName.set(d.id, d.name);
  });

  fashionGenealogyData.brands.forEach(b => {
    brandIdToName.set(b.id, b.name);
  });

  const plan: UpdatePlan = {
    mappings: {},
    summary: {
      totalMappings: 0,
      totalAffectedTenures: 0,
      totalAffectedRelationships: 0
    }
  };

  // Find self-referential entries in tenures
  fashionGenealogyData.tenures.forEach(tenure => {
    if (tenure.designerId === tenure.brandId) {
      // This is a self-referential entry
      const id = tenure.designerId;
      
      if (!plan.mappings[id]) {
        const designerName = designerIdToName.get(id) || 'Unknown Designer';
        const brandName = brandIdToName.get(id) || 'Unknown Brand';

        plan.mappings[id] = {
          oldId: id,
          designerName,
          brandName,
          affectedTenures: [],
          affectedRelationships: []
        };
        plan.summary.totalMappings++;
      }

      plan.mappings[id].affectedTenures.push({
        id: tenure.id,
        role: tenure.role,
        startYear: tenure.startYear,
        endYear: tenure.endYear
      });
      plan.summary.totalAffectedTenures++;
    }
  });

  // Find self-referential entries in relationships
  fashionGenealogyData.relationships.forEach(rel => {
    if (rel.sourceDesignerId === rel.targetDesignerId) {
      const id = rel.sourceDesignerId;
      
      if (!plan.mappings[id]) {
        const designerName = designerIdToName.get(id) || 'Unknown Designer';
        const brandName = brandIdToName.get(id) || 'Unknown Brand';

        plan.mappings[id] = {
          oldId: id,
          designerName,
          brandName,
          affectedTenures: [],
          affectedRelationships: []
        };
        plan.summary.totalMappings++;
      }

      plan.mappings[id].affectedRelationships.push({
        id: rel.id,
        type: 'both'
      });
      plan.summary.totalAffectedRelationships++;
    }
  });

  // Save the plan
  const planPath = join(__dirname, '../src/data/self_referential_update_plan.json');
  writeFileSync(planPath, JSON.stringify(plan, null, 2));

  return plan;
}

// Generate update plan
try {
  console.log('Analyzing self-referential entries...\n');
  const plan = createUpdatePlan();
  
  console.log('Summary:');
  console.log(`Total mappings found: ${plan.summary.totalMappings}`);
  console.log(`Total affected tenures: ${plan.summary.totalAffectedTenures}`);
  console.log(`Total affected relationships: ${plan.summary.totalAffectedRelationships}\n`);
  
  if (Object.keys(plan.mappings).length > 0) {
    console.log('Sample mappings:');
    Object.entries(plan.mappings).slice(0, 5).forEach(([oldId, mapping]) => {
      console.log(`\n${oldId}:`);
      console.log(`  → Name: ${mapping.designerName}`);
      console.log(`  Affects: ${mapping.affectedTenures.length} tenure(s), ${mapping.affectedRelationships.length} relationship(s)`);
    });
  }
  
  console.log('\nDetailed plan saved to: src/data/self_referential_update_plan.json');
} catch (error) {
  console.error('Failed to create update plan:', error);
}
