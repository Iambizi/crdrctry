import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Designer {
    id: string;
    name: string;
}

interface Relationship {
    id: string;
    sourceDesignerId: string;
    targetDesignerId: string;
    brandId?: string;
    type: string;
    startYear?: number;
    endYear?: number;
    description?: string;
}

interface FashionData {
    designers: Designer[];
    relationships: Relationship[];
}

function findSelfReferences() {
    // Read the data
    const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
    const data: FashionData = JSON.parse(readFileSync(dataPath, 'utf8'));
    
    // Find self-referential relationships
    const selfRefs = data.relationships.filter(rel => 
        rel.sourceDesignerId === rel.targetDesignerId
    );

    // Create a map of designer IDs to names
    const designerMap = new Map(data.designers.map(d => [d.id, d.name]));

    // Create detailed report
    const report = selfRefs.map(rel => ({
        relationshipId: rel.id,
        designerId: rel.sourceDesignerId,
        designerName: designerMap.get(rel.sourceDesignerId) || 'Unknown',
        type: rel.type,
        description: rel.description || 'No description',
        years: `${rel.startYear || 'Unknown'} - ${rel.endYear || 'Present'}`
    }));

    // Sort by designer name
    report.sort((a, b) => a.designerName.localeCompare(b.designerName));

    // Print report
    console.log('\nSelf-Referential Relationships Report');
    console.log('===================================');
    console.log(`Total found: ${report.length}\n`);

    report.forEach(entry => {
        console.log(`Designer: ${entry.designerName}`);
        console.log(`Relationship ID: ${entry.relationshipId}`);
        console.log(`Type: ${entry.type}`);
        console.log(`Years: ${entry.years}`);
        console.log(`Description: ${entry.description}`);
        console.log('-----------------------------------\n');
    });

    // Save detailed report to file
    const reportPath = join(__dirname, '../src/data/self_references_report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Detailed report saved to: ${reportPath}`);
}

findSelfReferences();
