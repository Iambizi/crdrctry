import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const backupPath = path.join(__dirname, '../src/data/fashionGenealogy.backup.json');

interface Designer {
    id: string;
    name: string;
    [key: string]: unknown;
}

interface Brand {
    id: string;
    name: string;
    [key: string]: unknown;
}

interface Tenure {
    id: string;
    designerId: string;
    brandId: string;
    [key: string]: unknown;
}

interface Relationship {
    id: string;
    designerId: string;
    brandId: string;
    [key: string]: unknown;
}

interface FashionData {
    designers: Designer[];
    brands: Brand[];
    tenures: Tenure[];
    relationships: Relationship[];
}

// IDs to remove
const designerIdsToRemove = [
    '9d47ec1c-18f7-4171-9e0d-aafa700e1919', // Georges Kern
    '64ae214c-e612-47c2-a0f1-75a8ce1b9041', // Jérôme Lambert
    'b4153c79-b77c-4c35-92f8-563c85fa6bac', // Kurt Klaus
    '5360d91e-4d67-442c-9488-d9da9317a2a3', // Christian Knoop
    '86d7cdda-d52d-4a84-968e-b8284ead3bc8', // Janek Deleskiewicz
    'd8c8c240-0949-4667-a5b8-afc11459a9ac'  // Lionel Favre
];

const brandIdsToRemove = [
    'b930b009-4a22-4b02-8e30-432883e58390', // IWC Schaffhausen
    '5baaac71-be8a-4213-afff-706249ec4bdf'  // Jaeger-LeCoultre
];

function cleanupData(): void {
    // Read the data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as FashionData;
    const originalLength = {
        designers: data.designers.length,
        brands: data.brands.length,
        tenures: data.tenures.length,
        relationships: data.relationships.length
    };

    // Remove designers
    data.designers = data.designers.filter(
        (designer) => !designerIdsToRemove.includes(designer.id)
    );

    // Remove brands
    data.brands = data.brands.filter(
        (brand) => !brandIdsToRemove.includes(brand.id)
    );

    // Remove tenures
    data.tenures = data.tenures.filter((tenure) => 
        !brandIdsToRemove.includes(tenure.brandId) &&
        !designerIdsToRemove.includes(tenure.designerId)
    );

    // Remove relationships
    data.relationships = data.relationships.filter((rel) =>
        !brandIdsToRemove.includes(rel.brandId) &&
        !designerIdsToRemove.includes(rel.designerId)
    );

    // Create backup
    fs.writeFileSync(backupPath, fs.readFileSync(dataPath));

    // Write updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    // Log changes
    console.log('Cleanup complete. Removed:');
    console.log(`Designers: ${originalLength.designers - data.designers.length}`);
    console.log(`Brands: ${originalLength.brands - data.brands.length}`);
    console.log(`Tenures: ${originalLength.tenures - data.tenures.length}`);
    console.log(`Relationships: ${originalLength.relationships - data.relationships.length}`);
}

cleanupData();
