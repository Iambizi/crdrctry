import PocketBase from 'pocketbase';
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

        // Get counts from each collection
        const brandCount = await pb.collection('fd_brands').getList(1, 1, { $autoCancel: false });
        const designerCount = await pb.collection('fd_designers').getList(1, 1, { $autoCancel: false });
        const tenureCount = await pb.collection('fd_tenures').getList(1, 1, { $autoCancel: false });
        const relationshipCount = await pb.collection('fd_relationships').getList(1, 1, { $autoCancel: false });

        // Get active designers count
        const activeDesignerCount = await pb.collection('fd_designers').getList(1, 1, {
            filter: 'isActive = true',
            $autoCancel: false
        });

        // Get current tenures count
        const currentTenureCount = await pb.collection('fd_tenures').getList(1, 1, {
            filter: 'isCurrentRole = true',
            $autoCancel: false
        });

        console.log('PocketBase Database Statistics:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Brands: ${brandCount.totalItems}`);
        console.log(`Designers: ${designerCount.totalItems} (${activeDesignerCount.totalItems} active)`);
        console.log(`Tenures: ${tenureCount.totalItems} (${currentTenureCount.totalItems} current)`);
        console.log(`Relationships: ${relationshipCount.totalItems}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
