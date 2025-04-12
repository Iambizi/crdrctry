import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load the tenure fixes
const tenureFixesPath = join(__dirname, '..', 'src', 'data', 'updates', '2025-tenure-relationship-fixes.json');
const tenureFixes = JSON.parse(readFileSync(tenureFixesPath, 'utf-8'));

// Load the fashion fixes
const fashionFixesPath = join(__dirname, '..', 'src', 'data', 'updates', '2025-fashion-fixes.json');
const fashionFixes = JSON.parse(readFileSync(fashionFixesPath, 'utf-8'));

// Add tenure updates to fashion fixes
fashionFixes.tenureUpdates = {
  file: 'tenure-updates-2025.json',
  updates: tenureFixes.tenures
};

// Save the merged fixes
writeFileSync(fashionFixesPath, JSON.stringify(fashionFixes, null, 2));
console.log('Successfully merged tenure fixes into fashion fixes');
