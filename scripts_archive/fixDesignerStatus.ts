import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DesignerStatus, Designer, Tenure } from '../src/types/fashion';

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Fixing invalid designer status values...\n');

let fixedCount = 0;

// Helper function to determine designer status
function determineDesignerStatus(designer: Designer, tenures: Tenure[]): DesignerStatus {
    // If designer has deathYear, they are deceased
    if (designer.deathYear) {
        return DesignerStatus.DECEASED;
    }

    // Check if designer has any current roles
    const designerTenures = tenures.filter(t => t.designerId === designer.id);
    const hasCurrentRole = designerTenures.some(t => t.isCurrentRole);
    
    if (hasCurrentRole) {
        return DesignerStatus.ACTIVE;
    }

    // Default to retired if no current roles and not deceased
    return DesignerStatus.RETIRED;
}

// Fix designer status values
for (const designer of data.designers) {
    if (!designer.status || !Object.values(DesignerStatus).includes(designer.status)) {
        const newStatus = determineDesignerStatus(designer, data.tenures);
        designer.status = newStatus;
        fixedCount++;
        console.log(`Fixed status for designer ${designer.name} (${designer.id}) -> ${newStatus}`);
    }
}

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\nFixed ${fixedCount} invalid designer status values`);
console.log('Please run verify script to confirm fixes.');
