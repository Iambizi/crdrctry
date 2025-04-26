import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Brand, Designer, FashionGenealogyData } from '../src/types/fashion';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuditResult {
  brands: {
    id: string;
    name: string;
    missingFields: string[];
    incompleteFields: string[];
    emptyArrays: string[];
  }[];
  designers: {
    id: string;
    name: string;
    missingFields: string[];
    incompleteFields: string[];
    emptyArrays: string[];
    zeroValues: string[];
  }[];
}

const requiredBrandFields = [
  'name',
  'foundedYear',
  'founder',
  'headquarters',
  'website',
  'parentCompany',
  'category',
  'logoUrl'
] as const;

const brandArrayFields = [
  'socialMedia'
] as const;

const requiredDesignerFields = [
  'name',
  'status',
  'nationality',
  'currentRole',
  'biography'
] as const;

const designerArrayFields = [
  'education',
  'awards',
  'signatureStyles'
] as const;

const numericFields = [
  'birthYear',
  'deathYear'
] as const;

async function auditData() {
  // Read the data
  const dataPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as FashionGenealogyData;

  const audit: AuditResult = {
    brands: [],
    designers: []
  };

  // Audit brands
  data.brands.forEach((brand: Brand) => {
    const missingFields: string[] = [];
    const incompleteFields: string[] = [];
    const emptyArrays: string[] = [];

    for (const field of requiredBrandFields) {
      if (!(field in brand)) {
        missingFields.push(field);
      } else if (brand[field as keyof Brand] === 'Unknown' || brand[field as keyof Brand] === 'N/A' || brand[field as keyof Brand] === '') {
        incompleteFields.push(field);
      }
    }

    for (const field of brandArrayFields) {
      const value = brand[field as keyof Brand];
      if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
        emptyArrays.push(field);
      }
    }

    if (missingFields.length > 0 || incompleteFields.length > 0 || emptyArrays.length > 0) {
      audit.brands.push({
        id: brand.id || '',
        name: brand.name,
        missingFields,
        incompleteFields,
        emptyArrays
      });
    }
  });

  // Audit designers
  data.designers.forEach((designer: Designer) => {
    const missingFields: string[] = [];
    const incompleteFields: string[] = [];
    const emptyArrays: string[] = [];
    const zeroValues: string[] = [];

    for (const field of requiredDesignerFields) {
      if (!(field in designer)) {
        missingFields.push(field);
      } else if (designer[field as keyof Designer] === 'Unknown' || designer[field as keyof Designer] === 'N/A' || designer[field as keyof Designer] === '') {
        incompleteFields.push(field);
      }
    }

    for (const field of designerArrayFields) {
      const value = designer[field as keyof Designer];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        emptyArrays.push(field);
      }
    }

    for (const field of numericFields) {
      const value = designer[field as keyof Designer];
      if (typeof value === 'number' && value === 0) {
        zeroValues.push(field);
      }
    }

    if (missingFields.length > 0 || incompleteFields.length > 0 || emptyArrays.length > 0 || zeroValues.length > 0) {
      audit.designers.push({
        id: designer.id || '',
        name: designer.name,
        missingFields,
        incompleteFields,
        emptyArrays,
        zeroValues
      });
    }
  });

  // Write results to separate files for easier review
  const outputDir = path.join(__dirname, '../data-audit');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Write brand audit
  fs.writeFileSync(
    path.join(outputDir, 'brands-audit.json'),
    JSON.stringify(audit.brands, null, 2)
  );

  // Write designer audit
  fs.writeFileSync(
    path.join(outputDir, 'designers-audit.json'),
    JSON.stringify(audit.designers, null, 2)
  );

  // Write summary
  const summary = {
    totalBrands: data.brands.length,
    brandsWithIssues: audit.brands.length,
    totalDesigners: data.designers.length,
    designersWithIssues: audit.designers.length,
    commonIssues: {
      brands: {
        missingFields: audit.brands.reduce((acc, b) => acc + b.missingFields.length, 0),
        incompleteFields: audit.brands.reduce((acc, b) => acc + b.incompleteFields.length, 0),
        emptyArrays: audit.brands.reduce((acc, b) => acc + b.emptyArrays.length, 0)
      },
      designers: {
        missingFields: audit.designers.reduce((acc, d) => acc + d.missingFields.length, 0),
        incompleteFields: audit.designers.reduce((acc, d) => acc + d.incompleteFields.length, 0),
        emptyArrays: audit.designers.reduce((acc, d) => acc + d.emptyArrays.length, 0),
        zeroValues: audit.designers.reduce((acc, d) => acc + d.zeroValues.length, 0)
      }
    }
  };

  fs.writeFileSync(
    path.join(outputDir, 'audit-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('Audit complete! Check the data-audit directory for results.');
}

// Run the audit
auditData().catch(console.error);
