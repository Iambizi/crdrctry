import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Brand, Designer, Relationship, Tenure } from '../src/types/fashion';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InvalidBrandReference {
    brandId: string;
    occurrences: {
        tenures: Array<{
            index: number;
            designerId: string;
            role: string;
            department: string;
        }>;
        relationships: Array<{
            index: number;
            sourceDesignerId: string;
            targetDesignerId: string;
            type: string;
        }>;
    };
}

function analyzeAndFixInvalidBrands() {
    // Load data
    const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
    const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
        brands: Brand[];
        designers: Designer[];
        tenures: Tenure[];
        relationships: Relationship[];
    };

    // Create sets for quick lookup
    const validBrandIds = new Set(fashionGenealogyData.brands.map(b => b.id));
    const designerNames = new Map(fashionGenealogyData.designers.map(d => [d.id, d.name]));

    // Track invalid brand references
    const invalidBrands = new Map<string, InvalidBrandReference>();

    // Check tenures for invalid brand references
    console.log('Analyzing tenures for invalid brand references...');
    fashionGenealogyData.tenures.forEach((tenure, index) => {
        if (!validBrandIds.has(tenure.brandId)) {
            const reference = invalidBrands.get(tenure.brandId) || {
                brandId: tenure.brandId,
                occurrences: { tenures: [], relationships: [] }
            };
            reference.occurrences.tenures.push({
                index,
                designerId: tenure.designerId,
                role: tenure.role,
                department: tenure.department || 'Unknown'
            });
            invalidBrands.set(tenure.brandId, reference);
        }
    });

    // Check relationships for invalid brand references
    console.log('Analyzing relationships for invalid brand references...');
    fashionGenealogyData.relationships.forEach((rel, index) => {
        if (rel.brandId && !validBrandIds.has(rel.brandId)) {
            const reference = invalidBrands.get(rel.brandId) || {
                brandId: rel.brandId,
                occurrences: { tenures: [], relationships: [] }
            };
            reference.occurrences.relationships.push({
                index,
                sourceDesignerId: rel.sourceDesignerId,
                targetDesignerId: rel.targetDesignerId,
                type: rel.type
            });
            invalidBrands.set(rel.brandId, reference);
        }
    });

    // Generate report
    console.log('\nInvalid brand references found:');
    for (const [brandId, reference] of invalidBrands.entries()) {
        console.log(`\nBrand ID: ${brandId}`);
        
        if (reference.occurrences.tenures.length > 0) {
            console.log('Tenures:');
            reference.occurrences.tenures.forEach(t => {
                const designerName = designerNames.get(t.designerId) || 'Unknown Designer';
                console.log(`- ${designerName} as ${t.role} in ${t.department}`);
            });
        }
        
        if (reference.occurrences.relationships.length > 0) {
            console.log('Relationships:');
            reference.occurrences.relationships.forEach(r => {
                const sourceName = designerNames.get(r.sourceDesignerId) || 'Unknown Designer';
                const targetName = designerNames.get(r.targetDesignerId) || 'Unknown Designer';
                console.log(`- ${sourceName} -> ${targetName} (${r.type})`);
            });
        }
    }

    // Save detailed report
    const reportPath = join(__dirname, '../src/data/invalid_brands_report.json');
    writeFileSync(reportPath, JSON.stringify(Array.from(invalidBrands.values()), null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    // Known brand mappings
    const brandMappings = new Map<string, string>([
        // We'll populate this with correct mappings after analyzing the report
    ]);

    // Create backup
    console.log('\nCreating backup...');
    const backupPath = fashionGenealogyPath.replace('.json', '.backup.json');
    writeFileSync(backupPath, readFileSync(fashionGenealogyPath));

    // Fix references if mappings exist
    let fixedTenures = 0;
    let fixedRelationships = 0;

    if (brandMappings.size > 0) {
        console.log('\nApplying fixes...');
        
        // Fix tenures
        fashionGenealogyData.tenures = fashionGenealogyData.tenures.map(tenure => {
            const correctBrandId = brandMappings.get(tenure.brandId);
            if (correctBrandId) {
                fixedTenures++;
                return { ...tenure, brandId: correctBrandId };
            }
            return tenure;
        });

        // Fix relationships
        fashionGenealogyData.relationships = fashionGenealogyData.relationships.map(rel => {
            if (rel.brandId) {
                const correctBrandId = brandMappings.get(rel.brandId);
                if (correctBrandId) {
                    fixedRelationships++;
                    return { ...rel, brandId: correctBrandId };
                }
            }
            return rel;
        });

        // Save updated data
        writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));
        
        console.log(`\nFixed ${fixedTenures} tenures and ${fixedRelationships} relationships`);
    } else {
        console.log('\nNo brand mappings defined yet. Please analyze the report and update the brandMappings.');
    }
}

try {
    console.log('Analyzing and fixing invalid brand references...\n');
    analyzeAndFixInvalidBrands();
} catch (error) {
    console.error('Failed to fix invalid brand references:', error);
}
