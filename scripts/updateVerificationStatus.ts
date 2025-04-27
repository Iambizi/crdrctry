import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Designer, FashionGenealogyData, VerificationStatus } from '../src/types/fashion';

async function updateVerificationStatus() {
    const dataPath = join(process.cwd(), 'src/data/fashionGenealogy.tmp.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as FashionGenealogyData;
    
    // Update designers
    if (data.designers) {
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

        // Print summary for designers
        console.log('\nVerification Status Summary:');
        
        const unverified = data.designers.filter(d => d.verificationStatus === VerificationStatus.unverified);
        const verified = data.designers.filter(d => d.verificationStatus === VerificationStatus.verified);
        const pending = data.designers.filter(d => d.verificationStatus === VerificationStatus.pending);
        
        console.log('\nDesigners:');
        console.log(`- Verified: ${verified.length}`);
        console.log(`- Unverified: ${unverified.length}`);
        console.log(`- Pending: ${pending.length}`);
        
        if (unverified.length > 0) {
            console.log('\nUnverified designers:');
            unverified.forEach(d => {
                console.log(`- ${d.name} (confidence: ${d.confidence || 'N/A'})`);
                if (d.sources && d.sources.length > 0) {
                    console.log(`  Sources: ${d.sources.join(', ')}`);
                }
            });
        }
    } else {
        console.log('No designers found in the data file.');
    }

    // Write back to temp file
    writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

updateVerificationStatus().catch(console.error);
