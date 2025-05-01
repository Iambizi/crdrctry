import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Brand, Designer, Relationship, Tenure } from '../src/types/fashion';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EntityMapping {
  oldId: string;
  newDesignerId: string;
  newBrandId: string;
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
  // Load all data files
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const newDesignersPath = join(__dirname, '../src/data/updates/newDesigners.json');
  const newBrandsPath = join(__dirname, '../src/data/updates/newBrands.json');

  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  const newDesignersData = JSON.parse(readFileSync(newDesignersPath, 'utf-8')) as {
    designers: Designer[];
  };

  const newBrandsData = JSON.parse(readFileSync(newBrandsPath, 'utf-8')) as {
    brands: Brand[];
  };

  // Create name-to-id mappings
  const designerNameToId = new Map<string, string>();
  const brandNameToId = new Map<string, string>();
  const designerIdToName = new Map<string, string>();
  const brandIdToName = new Map<string, string>();

  newDesignersData.designers.forEach(d => {
    const normalizedName = d.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    designerNameToId.set(normalizedName, d.id);
    designerIdToName.set(d.id, d.name);
  });

  newBrandsData.brands.forEach(b => {
    const normalizedName = b.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    brandNameToId.set(normalizedName, b.id);
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
        // Try to find the proper UUIDs
        let newDesignerId = '';
        let newBrandId = '';
        let designerName = '';
        let brandName = '';

        if (id.includes('-')) {
          // This is a hyphenated name format
          newDesignerId = designerNameToId.get(id) || '';
          newBrandId = brandNameToId.get(id) || '';
          designerName = designerIdToName.get(newDesignerId) || '';
          brandName = brandIdToName.get(newBrandId) || '';
        } else {
          // This is a UUID format, try reverse lookup
          designerName = designerIdToName.get(id) || '';
          brandName = brandIdToName.get(id) || '';
          if (designerName) {
            const normalizedName = designerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            newDesignerId = designerNameToId.get(normalizedName) || '';
            newBrandId = brandNameToId.get(normalizedName) || '';
          }
        }

        if (newDesignerId && newBrandId) {
          plan.mappings[id] = {
            oldId: id,
            newDesignerId,
            newBrandId,
            designerName,
            brandName,
            affectedTenures: [],
            affectedRelationships: []
          };
          plan.summary.totalMappings++;
        }
      }

      if (plan.mappings[id]) {
        plan.mappings[id].affectedTenures.push({
          id: tenure.id,
          role: tenure.role,
          startYear: tenure.startYear,
          endYear: tenure.endYear
        });
        plan.summary.totalAffectedTenures++;
      }
    }
  });

  // Find affected relationships
  fashionGenealogyData.relationships.forEach(rel => {
    const sourceId = rel.sourceDesignerId;
    const targetId = rel.targetDesignerId;
    
    if (plan.mappings[sourceId] && plan.mappings[targetId]) {
      // Both source and target need updating
      plan.mappings[sourceId].affectedRelationships.push({
        id: rel.id,
        type: 'both'
      });
      plan.summary.totalAffectedRelationships++;
    } else if (plan.mappings[sourceId]) {
      // Only source needs updating
      plan.mappings[sourceId].affectedRelationships.push({
        id: rel.id,
        type: 'source'
      });
      plan.summary.totalAffectedRelationships++;
    } else if (plan.mappings[targetId]) {
      // Only target needs updating
      plan.mappings[targetId].affectedRelationships.push({
        id: rel.id,
        type: 'target'
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
      console.log(`  → Designer: ${mapping.designerName} (${mapping.newDesignerId})`);
      console.log(`  → Brand: ${mapping.brandName} (${mapping.newBrandId})`);
      console.log(`  Affects: ${mapping.affectedTenures.length} tenure(s), ${mapping.affectedRelationships.length} relationship(s)`);
    });
  }
  
  console.log('\nDetailed plan saved to: src/data/self_referential_update_plan.json');
} catch (error) {
  console.error('Failed to create update plan:', error);
}
