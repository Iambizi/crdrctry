import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Designer, Brand, Tenure, Department } from '../src/types/fashion';

interface FashionData {
  designers: Designer[];
  brands: Brand[];
  tenures: Tenure[];
}

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data: FashionData = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Adding missing tenures and historical data...\n');

// Add missing tenures for designers
const missingTenures: Tenure[] = [
  {
    id: 'tnr-gv-001',
    designerId: 'giambattista-valli',
    brandId: 'giambattista-valli',
    role: 'Founder and Creative Director',
    department: Department.ALL_DEPARTMENTS,
    startYear: 2005,
    endYear: null,
    isCurrentRole: true,
    achievements: [
      'Founded eponymous fashion house',
      'Developed signature romantic aesthetic',
      'Launched successful collaboration with H&M',
      'Created both ready-to-wear and haute couture collections'
    ],
    createdAt: new Date('2025-04-12T14:30:00Z'),
    updatedAt: new Date('2025-04-12T14:30:00Z')
  },
  {
    id: 'tnr-bc-001',
    designerId: 'bernard-cohen',
    brandId: 'thomas-pink',
    role: 'Creative Director',
    department: Department.MENSWEAR,
    startYear: 1984,
    endYear: 2004,
    isCurrentRole: false,
    achievements: [
      'Established Thomas Pink as a leading shirt maker',
      'Developed signature shirt designs',
      'Expanded brand into international markets',
      'Created innovative retail concept'
    ],
    createdAt: new Date('2025-04-12T14:30:00Z'),
    updatedAt: new Date('2025-04-12T14:30:00Z')
  },
  {
    id: 'tnr-pm-001',
    designerId: 'peter-mullen',
    brandId: 'thomas-pink',
    role: 'Founder',
    department: Department.ALL_DEPARTMENTS,
    startYear: 1984,
    endYear: 1999,
    isCurrentRole: false,
    achievements: [
      'Co-founded Thomas Pink',
      'Established brand identity and vision',
      'Created distinctive retail presence',
      'Built global shirt business'
    ],
    createdAt: new Date('2025-04-12T14:30:00Z'),
    updatedAt: new Date('2025-04-12T14:30:00Z')
  }
];

// Add historical data for brands without it
const historicalBrands = [
  'lacoste',
  'uniqlo',
  'adidas',
  'gianni-versace',
  'miyake-design-studio',
  'ann-demeulemeester-serax',
  'sex',
  'walter-van-beirendonck',
  'royal-academy-antwerp'
];

// Add tenures
data.tenures.push(...missingTenures);
console.log('Added tenures for:');
missingTenures.forEach(tenure => {
  const designer = data.designers.find(d => d.id === tenure.designerId);
  const brand = data.brands.find(b => b.id === tenure.brandId);
  console.log(`- ${designer?.name || tenure.designerId} at ${brand?.name || tenure.brandId}`);
});

// Update brands with historical data flag
historicalBrands.forEach(brandId => {
  const brand = data.brands.find(b => b.id === brandId);
  if (brand) {
    brand.hasHistoricalData = true;
    console.log(`\nMarked ${brand.name} as having historical data`);
  }
});

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('\nPlease run verify script to confirm changes.');
