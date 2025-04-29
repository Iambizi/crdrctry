import * as fs from 'fs';
import * as path from 'path';

// Read the main data file
const mainDataPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));

// Read the new designers
const newDesignersPath = path.join(__dirname, '../src/data/updates/newDesigners.json');
const newDesigners = JSON.parse(fs.readFileSync(newDesignersPath, 'utf8'));

// Read the new brands
const newBrandsPath = path.join(__dirname, '../src/data/updates/newBrands.json');
const newBrands = JSON.parse(fs.readFileSync(newBrandsPath, 'utf8'));

// Add new designers
for (const designer of newDesigners.designers) {
    // Check if designer already exists
    const existingDesigner = mainData.designers.find(d => d.id === designer.id);
    if (!existingDesigner) {
        mainData.designers.push(designer);
        console.log(`Added designer: ${designer.name}`);
    }
}

// Add new brands
for (const brand of newBrands.brands) {
    // Check if brand already exists
    const existingBrand = mainData.brands.find(b => b.id === brand.id);
    if (!existingBrand) {
        mainData.brands.push(brand);
        console.log(`Added brand: ${brand.name}`);
    }
}

// Write back to the main file
fs.writeFileSync(mainDataPath, JSON.stringify(mainData, null, 2));
console.log('Updates merged successfully!');
