import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FieldMap {
  [key: string]: string;
}

interface DataItem {
  [key: string]: unknown;
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface Data {
  designers: DataItem[];
  brands: DataItem[];
  tenures: DataItem[];
  relationships: DataItem[];
}

// Load the backup data
const backupPath = join(__dirname, '../src/data/fashionGenealogy.backup.json');
const data = JSON.parse(readFileSync(backupPath, 'utf-8')) as Data;

// Field name mappings
const designerFieldMap: FieldMap = {
  current_role: 'currentRole',
  is_active: 'isActive',
  image_url: 'imageUrl',
  birth_year: 'birthYear',
  death_year: 'deathYear',
  signature_styles: 'signatureStyles',
  social_media: 'socialMedia',
};

const brandFieldMap: FieldMap = {
  founding_year: 'foundedYear',
  parent_company: 'parentCompany',
  logo_url: 'logoUrl',
  social_media: 'socialMedia',
};

const tenureFieldMap: FieldMap = {
  start_year: 'startYear',
  end_year: 'endYear',
  is_current_role: 'isCurrentRole',
  notable_works: 'notableWorks',
  notable_collections: 'notableCollections',
  impact_description: 'impactDescription',
};

const relationshipFieldMap: FieldMap = {
  source_designer_id: 'sourceDesignerId',
  target_designer_id: 'targetDesignerId',
  brand_id: 'brandId',
  start_year: 'startYear',
  end_year: 'endYear',
  collaboration_projects: 'collaborationProjects',
};

// Convert object fields from snake_case to camelCase
function convertFields(obj: DataItem, fieldMap: FieldMap): DataItem {
  const result = { ...obj };
  for (const [oldKey, newKey] of Object.entries(fieldMap)) {
    if (oldKey in result) {
      result[newKey] = result[oldKey];
      delete result[oldKey];
    }
  }
  return result;
}

// Convert arrays of objects
function convertArray(arr: DataItem[], fieldMap: FieldMap): DataItem[] {
  return arr.map(item => convertFields(item, fieldMap));
}

// Convert all data
const convertedData: Data = {
  designers: convertArray(data.designers, designerFieldMap),
  brands: convertArray(data.brands, brandFieldMap),
  tenures: convertArray(data.tenures, tenureFieldMap),
  relationships: convertArray(data.relationships, relationshipFieldMap),
};

// Save the converted data
const outputPath = join(__dirname, '../src/data/fashionGenealogy.json');
writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));

console.log('✅ Data conversion complete');
console.log('📝 Original data:', backupPath);
console.log('📝 Converted data:', outputPath);
