import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Brand, Designer, Relationship, Tenure } from '../src/types/fashion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InvalidReference {
  type: 'designer' | 'brand';
  id: string;
  occurrences: {
    tenures: Array<{
      index: number;
      role: string;
      brandId?: string;
      designerId?: string;
    }>;
    relationships: Array<{
      index: number;
      role: 'source' | 'target' | 'both';
      brandId?: string;
      designerId?: string;
      otherDesignerId?: string;
    }>;
  };
}

interface CommonPattern {
  type: 'self_ref_error' | 'designer_pattern' | 'brand_pattern';
  description: string;
  count: number;
  details?: {
    id: string;
    name: string;
    type: 'designer' | 'brand';
  };
}

interface AnalysisReport {
  invalidReferences: { [key: string]: InvalidReference };
  selfReferentialEntries: Array<{
    id: string;
    name: string;
    type: 'designer' | 'brand';
    context: 'tenure' | 'relationship';
    details: string;
  }>;
  commonPatterns: CommonPattern[];
  summary: {
    totalInvalidDesignerRefs: number;
    totalInvalidBrandRefs: number;
    totalAffectedTenures: number;
    totalAffectedRelationships: number;
  };
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function analyzeInvalidReferences(): AnalysisReport {
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  const validDesignerIds = new Set(fashionGenealogyData.designers.map(d => d.id));
  const validBrandIds = new Set(fashionGenealogyData.brands.map(b => b.id));

  const designerNames = new Map<string, string>();
  const brandNames = new Map<string, string>();
  fashionGenealogyData.designers.forEach(d => designerNames.set(d.id, d.name));
  fashionGenealogyData.brands.forEach(b => brandNames.set(b.id, b.name));

  const invalidReferences: { [key: string]: InvalidReference } = {};
  const selfReferentialEntries: Array<{
    id: string;
    name: string;
    type: 'designer' | 'brand';
    context: 'tenure' | 'relationship';
    details: string;
  }> = [];

  fashionGenealogyData.tenures.forEach((tenure, index) => {
    if (tenure.designerId === tenure.brandId) {
      selfReferentialEntries.push({
        id: tenure.designerId,
        name: designerNames.get(tenure.designerId) || 'Unknown',
        type: 'designer',
        context: 'tenure',
        details: `Role: ${tenure.role}, Start: ${tenure.startYear}${tenure.endYear ? `, End: ${tenure.endYear}` : ''}`
      });
    }

    if (!validDesignerIds.has(tenure.designerId)) {
      if (!invalidReferences[tenure.designerId]) {
        invalidReferences[tenure.designerId] = {
          type: 'designer',
          id: tenure.designerId,
          occurrences: { tenures: [], relationships: [] }
        };
      }
      invalidReferences[tenure.designerId].occurrences.tenures.push({
        index,
        role: tenure.role,
        brandId: tenure.brandId
      });
    }

    if (!validBrandIds.has(tenure.brandId)) {
      if (!invalidReferences[tenure.brandId]) {
        invalidReferences[tenure.brandId] = {
          type: 'brand',
          id: tenure.brandId,
          occurrences: { tenures: [], relationships: [] }
        };
      }
      invalidReferences[tenure.brandId].occurrences.tenures.push({
        index,
        role: tenure.role,
        designerId: tenure.designerId
      });
    }
  });

  fashionGenealogyData.relationships.forEach((rel, index) => {
    if (rel.sourceDesignerId === rel.targetDesignerId) {
      selfReferentialEntries.push({
        id: rel.sourceDesignerId,
        name: designerNames.get(rel.sourceDesignerId) || 'Unknown',
        type: 'designer',
        context: 'relationship',
        details: `Type: ${rel.type}`
      });
    }

    if (!validDesignerIds.has(rel.sourceDesignerId)) {
      if (!invalidReferences[rel.sourceDesignerId]) {
        invalidReferences[rel.sourceDesignerId] = {
          type: 'designer',
          id: rel.sourceDesignerId,
          occurrences: { tenures: [], relationships: [] }
        };
      }
      invalidReferences[rel.sourceDesignerId].occurrences.relationships.push({
        index,
        role: 'source',
        otherDesignerId: rel.targetDesignerId
      });
    }

    if (!validDesignerIds.has(rel.targetDesignerId)) {
      if (!invalidReferences[rel.targetDesignerId]) {
        invalidReferences[rel.targetDesignerId] = {
          type: 'designer',
          id: rel.targetDesignerId,
          occurrences: { tenures: [], relationships: [] }
        };
      }
      invalidReferences[rel.targetDesignerId].occurrences.relationships.push({
        index,
        role: 'target',
        otherDesignerId: rel.sourceDesignerId
      });
    }
  });

  let totalInvalidDesignerRefs = 0;
  let totalInvalidBrandRefs = 0;
  let totalAffectedTenures = 0;
  let totalAffectedRelationships = 0;

  Object.values(invalidReferences).forEach(ref => {
    if (ref.type === 'designer') totalInvalidDesignerRefs++;
    if (ref.type === 'brand') totalInvalidBrandRefs++;
    totalAffectedTenures += ref.occurrences.tenures.length;
    totalAffectedRelationships += ref.occurrences.relationships.length;
  });

  const commonPatterns: CommonPattern[] = [];

  if (selfReferentialEntries.length > 0) {
    commonPatterns.push({
      type: 'self_ref_error',
      description: 'Self-referential entry',
      count: selfReferentialEntries.length
    });
  }

  Object.values(invalidReferences)
    .filter(ref => ref.type === 'brand')
    .forEach(ref => {
      commonPatterns.push({
        type: 'brand_pattern',
        description: `Single brand association: ${ref.id}`,
        count: ref.occurrences.tenures.length + ref.occurrences.relationships.length,
        details: {
          id: ref.id,
          name: brandNames.get(ref.id) || 'Unknown Brand',
          type: 'brand'
        }
      });
    });

  Object.values(invalidReferences)
    .filter(ref => ref.type === 'designer')
    .forEach(ref => {
      if (ref.occurrences.relationships.length > 0) {
        commonPatterns.push({
          type: 'designer_pattern',
          description: `Single designer relationship: ${ref.id}`,
          count: ref.occurrences.relationships.length,
          details: {
            id: ref.id,
            name: designerNames.get(ref.id) || 'Unknown Designer',
            type: 'designer'
          }
        });
      }
    });

  commonPatterns.sort((a, b) => b.count - a.count);

  console.log('Analyzing invalid references...\n');
  console.log('Summary:');
  console.log(`Total invalid designer references: ${totalInvalidDesignerRefs}`);
  console.log(`Total invalid brand references: ${totalInvalidBrandRefs}`);
  console.log(`Total affected tenures: ${totalAffectedTenures}`);
  console.log(`Total affected relationships: ${totalAffectedRelationships}\n`);

  if (selfReferentialEntries.length > 0) {
    console.log('Self-referential Entries:');
    selfReferentialEntries.forEach(entry => {
      console.log(`- ${entry.name} (${entry.id}):`);
      console.log(`  Type: ${entry.type}, Context: ${entry.context}`);
      console.log(`  Details: ${entry.details}\n`);
    });
  }

  console.log('Common Patterns:');
  commonPatterns.forEach(pattern => {
    console.log(`- ${pattern.description} (${pattern.count} occurrences)`);
  });

  const report: AnalysisReport = {
    invalidReferences,
    selfReferentialEntries,
    commonPatterns,
    summary: {
      totalInvalidDesignerRefs,
      totalInvalidBrandRefs,
      totalAffectedTenures,
      totalAffectedRelationships
    }
  };

  const reportPath = join(__dirname, '../src/data/invalid_references_report.json');
  const reportJson = JSON.stringify(report, null, 2);
  console.log(`\nDetailed report saved to: ${reportPath}`);
  writeFileSync(reportPath, reportJson);

  return report;
}

try {
  console.log('Analyzing invalid references...\n');
  const report = analyzeInvalidReferences();
} catch (error) {
  console.error('Failed to analyze invalid references:', error);
}
