import 'dotenv/config';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { initPocketBase } from '../src/database/client';

// Define collection names centrally
const COLLECTIONS = {
    DESIGNERS: 'designers',
    BRANDS: 'brands',
    TENURES: 'tenures',
    RELATIONSHIPS: 'relationships'
};

// Helper function to safely delete a collection
async function deleteCollectionIfExists(client: PocketBase, name: string) {
    try {
        const collection = await client.collections.getOne(name);
        await client.collections.delete(name);
        console.log(`🗑️ Deleted existing collection: ${name} (ID: ${collection.id})`);
    } catch (error) {
        // PocketBase throws 404 if collection doesn't exist, which is fine
        if (error instanceof ClientResponseError && error.status === 404) {
            console.log(`🔵 Collection ${name} does not exist, skipping deletion.`);
        } else {
            console.error(`❌ Error deleting collection ${name}:`, error);
            throw error; // Re-throw other errors
        }
    }
}

async function resetDatabase() {
    console.log('🔄 Resetting database...');
    let client: PocketBase;

    try {
        // Initialize PocketBase client
        console.log('🔌 Initializing PocketBase client...');
        client = await initPocketBase();

        // --- Delete existing collections ---
        console.log('🧹 Deleting existing collections in reverse order of dependency...');
        // Delete relationships and tenures first as they depend on designers and brands
        await deleteCollectionIfExists(client, COLLECTIONS.RELATIONSHIPS);
        await deleteCollectionIfExists(client, COLLECTIONS.TENURES);
        // Then delete designers and brands
        await deleteCollectionIfExists(client, COLLECTIONS.DESIGNERS);
        await deleteCollectionIfExists(client, COLLECTIONS.BRANDS);

        // --- Create collections with proper schema ---
        console.log('📦 Creating collections with updated schema...');

        // 1. Brands collection
        console.log(`Creating collection: ${COLLECTIONS.BRANDS}...`);
        const brandsCollection = await client.collections.create({
            name: COLLECTIONS.BRANDS,
            type: 'base',
            schema: [
                { 
                    name: 'name',
                    type: 'text',
                    required: true,
                    unique: true,
                    options: {
                        min: 1,
                        max: 255,
                        pattern: ''
                    }
                },
                { name: 'description', type: 'text', required: false },
                { name: 'founding_year', type: 'number', required: false },
                { name: 'headquarters', type: 'text', required: false },
                { name: 'parent_company', type: 'text', required: false },
                { name: 'categories', type: 'json', required: false },
                { name: 'website', type: 'url', required: false },
                { name: 'social_media', type: 'json', required: false },
                { name: 'logo_url', type: 'url', required: false }
            ]
        });
        console.log(`✅ Created ${COLLECTIONS.BRANDS} collection (ID: ${brandsCollection.id})`);

        // 2. Designers collection
        console.log(`Creating collection: ${COLLECTIONS.DESIGNERS}...`);
        const designersCollection = await client.collections.create({
            name: COLLECTIONS.DESIGNERS,
            type: 'base',
            schema: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    unique: true,
                    options: {
                        min: 1,
                        max: 255,
                        pattern: ''
                    }
                },
                { name: 'biography', type: 'text', required: false },
                { name: 'education', type: 'json', required: false },
                { name: 'awards', type: 'json', required: false },
                { name: 'social_media', type: 'json', required: false },
                { name: 'profile_image', type: 'url', required: false },
                { name: 'birth_year', type: 'number', required: false },
                { name: 'death_year', type: 'number', required: false },
                { name: 'nationality', type: 'text', required: false },
                { name: 'signature_styles', type: 'json', required: false },
                {
                    name: 'status',
                    type: 'select',
                    required: false,
                    options: {
                        maxSelect: 1,
                        values: ['Active', 'Inactive', 'Retired', 'Deceased', 'Unknown']
                    }
                },
                { name: 'current_role', type: 'text', required: false },
                { name: 'is_active', type: 'bool', required: false }
            ]
        });
        console.log(`✅ Created ${COLLECTIONS.DESIGNERS} collection (ID: ${designersCollection.id})`);

        // 3. Tenures collection
        console.log(`Creating collection: ${COLLECTIONS.TENURES}...`);
        const tenuresCollection = await client.collections.create({
            name: COLLECTIONS.TENURES,
            type: 'base',
            schema: [
                {
                    name: 'designer',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: designersCollection.id,
                        cascadeDelete: true,
                        maxSelect: 1,
                        minSelect: 1,
                        displayFields: ['name']
                    }
                },
                {
                    name: 'brand',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: brandsCollection.id,
                        cascadeDelete: true,
                        maxSelect: 1,
                        minSelect: 1,
                        displayFields: ['name']
                    }
                },
                { name: 'role', type: 'text', required: false },
                { name: 'department', type: 'text', required: false },
                { name: 'start_year', type: 'number', required: true },
                { name: 'end_year', type: 'number', required: false },
                { name: 'is_current_role', type: 'bool', defaultValue: false },
                { name: 'achievements', type: 'json', required: false },
                { name: 'notable_works', type: 'json', required: false },
                { name: 'notable_collections', type: 'json', required: false },
                { name: 'impact_description', type: 'text', required: false }
            ]
        });
        console.log(`✅ Created ${COLLECTIONS.TENURES} collection (ID: ${tenuresCollection.id})`);

        // 4. Relationships collection
        console.log(`Creating collection: ${COLLECTIONS.RELATIONSHIPS}...`);
        const relationshipsCollection = await client.collections.create({
            name: COLLECTIONS.RELATIONSHIPS,
            type: 'base',
            schema: [
                {
                    name: 'source_designer',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: designersCollection.id,
                        cascadeDelete: true,
                        maxSelect: 1,
                        minSelect: 1,
                        displayFields: ['name']
                    }
                },
                {
                    name: 'target_designer',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: designersCollection.id,
                        cascadeDelete: true,
                        maxSelect: 1,
                        minSelect: 1,
                        displayFields: ['name']
                    }
                },
                {
                    name: 'brand',
                    type: 'relation',
                    required: true,
                    options: {
                        collectionId: brandsCollection.id,
                        cascadeDelete: true,
                        maxSelect: 1,
                        minSelect: 1,
                        displayFields: ['name']
                    }
                },
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: {
                        maxSelect: 1,
                        values: ['Mentor', 'Collaborator', 'Successor', 'Predecessor', 'Competitor', 'Other']
                    }
                },
                { name: 'start_year', type: 'number', required: false },
                { name: 'end_year', type: 'number', required: false },
                { name: 'description', type: 'text', required: false },
                { name: 'impact', type: 'text', required: false },
                { name: 'collaboration_projects', type: 'json', required: false }
            ]
        });
        console.log(`✅ Created ${COLLECTIONS.RELATIONSHIPS} collection (ID: ${relationshipsCollection.id})`);

        console.log('✅ Database schema reset complete!');

    } catch (error) {
        console.error('❌ Error resetting database schema:', error);
        // Log specific PocketBase errors if available
        if (error instanceof ClientResponseError) {
            console.error('PocketBase Error Details:', JSON.stringify(error.originalError, null, 2));
        }
        // Ensure process exits with error code if reset fails
        process.exit(1);
    }
}

// Run the reset function
(async () => {
    await resetDatabase();
})();