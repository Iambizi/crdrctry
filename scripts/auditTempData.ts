import { readFileSync } from 'fs';
import { join } from 'path';
import { Brand, FashionGenealogyData } from '../src/types/fashion';

function auditTempData() {
    const dataPath = join(process.cwd(), 'src/data/fashionGenealogy.tmp.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as FashionGenealogyData;

    if (!data.brands) {
        console.log('No brands found in data file');
        return;
    }

    const brands = data.brands;
    console.log(`\nAuditing ${brands.length} brands...\n`);

    // Track missing fields
    const missingFields: Record<string, string[]> = {};
    
    brands.forEach((brand: Brand) => {
        const missing: string[] = [];

        // Check essential fields
        if (!brand.name) missing.push('name');
        if (!brand.foundedYear) missing.push('foundedYear');
        if (!brand.founder) missing.push('founder');
        if (!brand.headquarters) missing.push('headquarters');
        if (!brand.website) missing.push('website');

        // Check brand characteristics
        if (!brand.specialties || brand.specialties.length === 0) missing.push('specialties');
        if (!brand.pricePoint) missing.push('pricePoint');
        if (!brand.markets || brand.markets.length === 0) missing.push('markets');

        // Check verification fields
        if (!brand.confidence) missing.push('confidence');
        if (!brand.sources || brand.sources.length === 0) missing.push('sources');
        if (!brand.verificationStatus) missing.push('verificationStatus');

        if (missing.length > 0) {
            missingFields[brand.name || brand.id || 'Unknown'] = missing;
        }
    });

    // Print results
    const brandsWithMissingFields = Object.keys(missingFields).length;
    console.log(`Found ${brandsWithMissingFields} brands with missing fields:\n`);

    Object.entries(missingFields).forEach(([brandName, fields]) => {
        console.log(`${brandName}:`);
        console.log(`  Missing: ${fields.join(', ')}\n`);
    });

    // Print confidence level statistics
    const confidenceLevels = brands.reduce((acc: { high: number, medium: number, low: number, none: number }, brand: Brand) => {
        if (!brand.confidence) acc.none++;
        else if (brand.confidence >= 0.75) acc.high++;
        else if (brand.confidence >= 0.4) acc.medium++;
        else acc.low++;
        return acc;
    }, { high: 0, medium: 0, low: 0, none: 0 });

    console.log('\nConfidence Level Statistics:');
    console.log(`High (≥75%): ${confidenceLevels.high} brands`);
    console.log(`Medium (40-74%): ${confidenceLevels.medium} brands`);
    console.log(`Low (<40%): ${confidenceLevels.low} brands`);
    console.log(`No confidence score: ${confidenceLevels.none} brands`);

    // Print specialties statistics
    const specialtiesCount: Record<string, number> = {};
    brands.forEach(brand => {
        if (brand.specialties) {
            brand.specialties.forEach(specialty => {
                specialtiesCount[specialty] = (specialtiesCount[specialty] || 0) + 1;
            });
        }
    });

    console.log('\nSpecialties Distribution:');
    Object.entries(specialtiesCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([specialty, count]) => {
            console.log(`${specialty}: ${count} brands`);
        });
}

auditTempData();
