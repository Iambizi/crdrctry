import { readFileSync } from 'fs';
import { join } from 'path';
import { Designer, FashionGenealogyData } from '../src/types/fashion';

async function checkLowConfidence() {
    const dataPath = join(process.cwd(), 'src/data/fashionGenealogy.tmp.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as FashionGenealogyData;
    
    const lowConfidenceDesigners = data.designers.filter(
        (d: any) => d.confidence && d.confidence < 0.7
    );

    console.log('\nDesigners with confidence < 0.7:');
    lowConfidenceDesigners.forEach(d => {
        console.log(`- ${d.name} (confidence: ${d.confidence})`);
    });

    // Check for these designers in relationships
    const relatedDesignerIds = new Set([
        ...data.relationships?.map(r => r.sourceDesignerId) || [],
        ...data.relationships?.map(r => r.targetDesignerId) || []
    ]);

    const tenureDesignerIds = new Set(
        data.tenures?.map(t => t.designerId) || []
    );

    console.log('\nWarning: Following low confidence designers have relationships:');
    lowConfidenceDesigners.forEach(d => {
        if (relatedDesignerIds.has(d.id)) {
            console.log(`- ${d.name} has relationships with other designers`);
        }
    });

    console.log('\nWarning: Following low confidence designers have tenures:');
    lowConfidenceDesigners.forEach(d => {
        if (tenureDesignerIds.has(d.id)) {
            console.log(`- ${d.name} has tenure records`);
        }
    });
}

checkLowConfidence().catch(console.error);
