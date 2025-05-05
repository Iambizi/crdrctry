import PocketBase from 'pocketbase';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
    try {
        // Authenticate with PocketBase
        await pb.admins.authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || '',
            process.env.POCKETBASE_ADMIN_PASSWORD || ''
        );
        console.log('🔐 Successfully authenticated with PocketBase\n');

        // Read source data
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const dataPath = join(__dirname, '..', 'src', 'data', 'fashionGenealogy.json');
        const sourceData = JSON.parse(readFileSync(dataPath, 'utf-8'));

        // Get all brands and designers from source
        const sourceBrands = sourceData.brands.map((b: any) => b.name).sort();
        const sourceDesigners = sourceData.designers.map((d: any) => d.name).sort();

        // Get all brands and designers from PocketBase
        const pbBrands = await pb.collection('fd_brands').getFullList({ fields: 'name' });
        const pbDesigners = await pb.collection('fd_designers').getFullList({ fields: 'name' });
        const pbBrandNames = pbBrands.map(b => b.name).sort();
        const pbDesignerNames = pbDesigners.map(d => d.name).sort();

        console.log('Source Brands:', sourceBrands.length);
        console.log('PocketBase Brands:', pbBrandNames.length);
        console.log('\nSource Designers:', sourceDesigners.length);
        console.log('PocketBase Designers:', pbDesignerNames.length);

        console.log('\nComparing Brands:');
        console.log('━━━━━━━━━━━━━━━━');
        for (let i = 0; i < Math.max(sourceBrands.length, pbBrandNames.length); i++) {
            const source = sourceBrands[i] || '';
            const pb = pbBrandNames[i] || '';
            if (source !== pb) {
                console.log(`Mismatch at position ${i}:`);
                console.log(`Source: "${source}"`);
                console.log(`PB:     "${pb}"`);
            }
        }

        console.log('\nComparing Designers:');
        console.log('━━━━━━━━━━━━━━━━━━━');
        for (let i = 0; i < Math.max(sourceDesigners.length, pbDesignerNames.length); i++) {
            const source = sourceDesigners[i] || '';
            const pb = pbDesignerNames[i] || '';
            if (source !== pb) {
                console.log(`Mismatch at position ${i}:`);
                console.log(`Source: "${source}"`);
                console.log(`PB:     "${pb}"`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
