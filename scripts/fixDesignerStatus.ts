import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DesignerStatus, Designer } from '../src/types/fashion';

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data: { designers: Record<string, Designer> } = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Fixing invalid designer status values...\n');

let fixedCount = 0;

// Fix designer status values
for (const [designerId, designer] of Object.entries(data.designers)) {
    if (!designer.status || !Object.values(DesignerStatus).includes(designer.status)) {
        // Default to RETIRED if status is invalid or missing
        designer.status = DesignerStatus.RETIRED;
        fixedCount++;
        console.log(`Fixed status for designer ${designer.name} (${designerId})`);
    }
}

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\nFixed ${fixedCount} invalid designer status values`);
console.log('Please run verify script to confirm fixes.');
