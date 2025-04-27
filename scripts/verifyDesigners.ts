import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Designer, FashionGenealogyData, VerificationStatus } from '../src/types/fashion';

async function verifyDesigners() {
    const dataPath = join(process.cwd(), 'src/data/fashionGenealogy.tmp.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as FashionGenealogyData;
    
    if (!data.designers || data.designers.length === 0) {
        console.log('No designers found in the data file.');
        return;
    }

    // Update designers
    data.designers = data.designers.map(d => {
        const designer = d as Designer;
        if (designer.confidence && designer.confidence < 0.75) {
            designer.verificationStatus = VerificationStatus.unverified;
        } else if (designer.confidence && designer.confidence >= 0.75) {
            designer.verificationStatus = VerificationStatus.verified;
        } else {
            designer.verificationStatus = VerificationStatus.pending;
        }
        return designer;
    });

    // Print summary
    console.log('\nDesigner Verification Summary:');
    
    const unverified = data.designers.filter(d => d.verificationStatus === VerificationStatus.unverified);
    const verified = data.designers.filter(d => d.verificationStatus === VerificationStatus.verified);
    const pending = data.designers.filter(d => d.verificationStatus === VerificationStatus.pending);
    
    console.log(`Total Designers: ${data.designers.length}`);
    console.log(`- Verified: ${verified.length}`);
    console.log(`- Unverified: ${unverified.length}`);
    console.log(`- Pending: ${pending.length}`);
    
    if (unverified.length > 0) {
        console.log('\nUnverified designers:');
        unverified.forEach(d => {
            console.log(`\n${d.name}:`);
            console.log(`Confidence: ${d.confidence || 'N/A'}`);
            if (d.sources && d.sources.length > 0) {
                console.log(`Sources: ${d.sources.join(', ')}`);
            }
            // Show what fields exist for this designer
            const fields = [
                d.nationality && 'nationality',
                d.birthYear && 'birthYear',
                d.deathYear && 'deathYear',
                d.education?.length && 'education',
                d.signatureStyles?.length && 'signatureStyles',
                d.currentRole && 'currentRole',
                d.biography && 'biography'
            ].filter(Boolean);
            
            if (fields.length > 0) {
                console.log(`Existing fields: ${fields.join(', ')}`);
            }
        });
    }

    // Write back to temp file
    writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log('\nUpdates saved to fashionGenealogy.tmp.json');
}

verifyDesigners().catch(console.error);
