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
      brandId: string;
    }>;
    relationships: Array<{
      index: number;
      role: 'source' | 'target' | 'both';
      brandId: string;
      otherDesignerId?: string;
    }>;
  };
  patterns?: {
    commonBrands: Array<{ brandId: string; count: number }>;
    commonDesigners: Array<{ designerId: string; count: number }>;
    timeframe?: { start: number; end: number };
  };
}

interface AnalysisReport {
  invalidReferences: { [key: string]: InvalidReference };
  summary: {
    totalInvalidDesignerRefs: number;
    totalInvalidBrandRefs: number;
    totalAffectedTenures: number;
    totalAffectedRelationships: number;
    commonPatterns: Array<{
      type: string;
      description: string;
      count: number;
    }>;
  };
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function analyzeInvalidReferences(): AnalysisReport {
  // Load data file
  const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
  const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
    brands: Brand[];
    designers: Designer[];
    tenures: Tenure[];
    relationships: Relationship[];
  };

  // Create sets of valid IDs from the main data file
  const validDesignerIds = new Set(fashionGenealogyData.designers.map(d => d.id));
  const validBrandIds = new Set(fashionGenealogyData.brands.map(b => b.id));

  const report: AnalysisReport = {
    invalidReferences: {},
    summary: {
      totalInvalidDesignerRefs: 0,
      totalInvalidBrandRefs: 0,
      totalAffectedTenures: 0,
      totalAffectedRelationships: 0,
      commonPatterns: []
    }
  };

  // Analyze tenures
  fashionGenealogyData.tenures.forEach((tenure, index) => {
    const invalidDesigner = !validDesignerIds.has(tenure.designerId) || !isValidUUID(tenure.designerId);
    const invalidBrand = !validBrandIds.has(tenure.brandId) || !isValidUUID(tenure.brandId);
    const isSelfReferential = tenure.designerId === tenure.brandId;

    if (invalidDesigner || isSelfReferential) {
      if (!report.invalidReferences[tenure.designerId]) {
        report.invalidReferences[tenure.designerId] = {
          type: 'designer',
          id: tenure.designerId,
          occurrences: { tenures: [], relationships: [] }
        };
        report.summary.totalInvalidDesignerRefs++;
      }
      report.invalidReferences[tenure.designerId].occurrences.tenures.push({
        index,
        role: tenure.role,
        brandId: tenure.brandId
      });
      report.summary.totalAffectedTenures++;
    }

    if (invalidBrand) {
      if (!report.invalidReferences[tenure.brandId]) {
        report.invalidReferences[tenure.brandId] = {
          type: 'brand',
          id: tenure.brandId,
          occurrences: { tenures: [], relationships: [] }
        };
        report.summary.totalInvalidBrandRefs++;
      }
      report.invalidReferences[tenure.brandId].occurrences.tenures.push({
        index,
        role: tenure.role,
        brandId: tenure.brandId
      });
    }
  });

  // Analyze relationships
  fashionGenealogyData.relationships.forEach((rel, index) => {
    const invalidSource = !validDesignerIds.has(rel.sourceDesignerId) || !isValidUUID(rel.sourceDesignerId);
    const invalidTarget = !validDesignerIds.has(rel.targetDesignerId) || !isValidUUID(rel.targetDesignerId);
    const invalidBrand = !validBrandIds.has(rel.brandId) || !isValidUUID(rel.brandId);
    const isSelfReferential = rel.sourceDesignerId === rel.targetDesignerId;

    if (invalidSource || isSelfReferential) {
      if (!report.invalidReferences[rel.sourceDesignerId]) {
        report.invalidReferences[rel.sourceDesignerId] = {
          type: 'designer',
          id: rel.sourceDesignerId,
          occurrences: { tenures: [], relationships: [] }
        };
        report.summary.totalInvalidDesignerRefs++;
      }
      report.invalidReferences[rel.sourceDesignerId].occurrences.relationships.push({
        index,
        role: 'source',
        brandId: rel.brandId,
        otherDesignerId: rel.targetDesignerId
      });
      report.summary.totalAffectedRelationships++;
    }

    if (invalidTarget) {
      if (!report.invalidReferences[rel.targetDesignerId]) {
        report.invalidReferences[rel.targetDesignerId] = {
          type: 'designer',
          id: rel.targetDesignerId,
          occurrences: { tenures: [], relationships: [] }
        };
        report.summary.totalInvalidDesignerRefs++;
      }
      report.invalidReferences[rel.targetDesignerId].occurrences.relationships.push({
        index,
        role: 'target',
        brandId: rel.brandId,
        otherDesignerId: rel.sourceDesignerId
      });
      report.summary.totalAffectedRelationships++;
    }

    if (invalidBrand) {
      if (!report.invalidReferences[rel.brandId]) {
        report.invalidReferences[rel.brandId] = {
          type: 'brand',
          id: rel.brandId,
          occurrences: { tenures: [], relationships: [] }
        };
        report.summary.totalInvalidBrandRefs++;
      }
      report.invalidReferences[rel.brandId].occurrences.relationships.push({
        index,
        role: 'both',
        brandId: rel.brandId,
        otherDesignerId: invalidSource ? rel.targetDesignerId : rel.sourceDesignerId
      });
    }
  });

  // Analyze patterns for each invalid reference
  for (const [id, ref] of Object.entries(report.invalidReferences)) {
    // Find common brands
    const brandCounts = new Map<string, number>();
    ref.occurrences.tenures.forEach(t => {
      brandCounts.set(t.brandId, (brandCounts.get(t.brandId) || 0) + 1);
    });
    ref.occurrences.relationships.forEach(r => {
      brandCounts.set(r.brandId, (brandCounts.get(r.brandId) || 0) + 1);
    });

    // Find common designers in relationships
    const designerCounts = new Map<string, number>();
    ref.occurrences.relationships.forEach(r => {
      if (r.otherDesignerId) {
        designerCounts.set(r.otherDesignerId, (designerCounts.get(r.otherDesignerId) || 0) + 1);
      }
    });

    ref.patterns = {
      commonBrands: Array.from(brandCounts.entries())
        .map(([brandId, count]) => ({ brandId, count }))
        .sort((a, b) => b.count - a.count),
      commonDesigners: Array.from(designerCounts.entries())
        .map(([designerId, count]) => ({ designerId, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  // Identify common patterns
  const patterns = new Map<string, number>();
  for (const ref of Object.values(report.invalidReferences)) {
    // Check for malformed UUIDs
    if (!isValidUUID(ref.id)) {
      const pattern = 'Malformed UUID';
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    // Check for self-referential entries
    const hasSelfRef = ref.occurrences.relationships.some(r => 
      r.otherDesignerId === ref.id || r.brandId === ref.id
    );
    if (hasSelfRef) {
      const pattern = 'Self-referential entry';
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    // Check for single brand/designer patterns
    if (ref.patterns?.commonBrands.length === 1) {
      const pattern = `Single brand association: ${ref.patterns.commonBrands[0].brandId}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    if (ref.patterns?.commonDesigners.length === 1) {
      const pattern = `Single designer relationship: ${ref.patterns.commonDesigners[0].designerId}`;
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
  }

  report.summary.commonPatterns = Array.from(patterns.entries())
    .map(([description, count]) => ({
      type: description.startsWith('Single brand') ? 'brand_pattern' : 
            description === 'Malformed UUID' ? 'uuid_error' :
            description === 'Self-referential entry' ? 'self_ref_error' :
            'designer_pattern',
      description,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // Save the report
  const reportPath = join(__dirname, '../src/data/invalid_references_report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

// Run analysis
try {
  console.log('Analyzing invalid references...\n');
  const report = analyzeInvalidReferences();
  
  console.log('Summary:');
  console.log(`Total invalid designer references: ${report.summary.totalInvalidDesignerRefs}`);
  console.log(`Total invalid brand references: ${report.summary.totalInvalidBrandRefs}`);
  console.log(`Total affected tenures: ${report.summary.totalAffectedTenures}`);
  console.log(`Total affected relationships: ${report.summary.totalAffectedRelationships}\n`);
  
  if (report.summary.commonPatterns.length > 0) {
    console.log('Common Patterns:');
    report.summary.commonPatterns.forEach(pattern => {
      console.log(`- ${pattern.description} (${pattern.count} occurrences)`);
    });
  }
  
  console.log('\nDetailed report saved to: src/data/invalid_references_report.json');
} catch (error) {
  console.error('Failed to analyze invalid references:', error);
}
