import * as fs from 'fs';
import * as path from 'path';

// Read the JSON file
const filePath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Remove the duplicate Brioni entry
data.brands = data.brands.filter((brand: any) => brand.id !== '5f49ddd6-c1a3-4005-8c82-fe90b91ca48b');

// Write the updated data back to the file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
