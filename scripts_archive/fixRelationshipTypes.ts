import fs from 'fs';
import path from 'path';
import { RelationshipType, Relationship } from '../src/types/fashion';

// Load fashion genealogy data
const fashionGenealogyPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const fashionGenealogyData: { relationships: Relationship[] } = JSON.parse(fs.readFileSync(fashionGenealogyPath, 'utf-8'));

// Helper function to convert invalid relationship types to valid ones
const convertRelationshipType = (type: string): RelationshipType => {
  // Map CREATIVE_DIRECTOR to SUCCESSION since it represents a leadership role
  if (type === 'CREATIVE_DIRECTOR') {
    return RelationshipType.SUCCESSION;
  }

  // For other cases, try to match with existing enum values
  const upperType = type.toUpperCase();
  switch (upperType) {
    case 'MENTORSHIP':
      return RelationshipType.MENTORSHIP;
    case 'SUCCESSION':
      return RelationshipType.SUCCESSION;
    case 'COLLABORATION':
      return RelationshipType.COLLABORATION;
    case 'FAMILIAL':
      return RelationshipType.FAMILIAL;
    default:
      // Default to SUCCESSION for any unknown types
      console.warn(`Unknown relationship type: ${type}, defaulting to SUCCESSION`);
      return RelationshipType.SUCCESSION;
  }
};

// Process relationships
console.log('Fixing invalid relationship types...');
let fixCount = 0;

fashionGenealogyData.relationships = fashionGenealogyData.relationships.map((relationship: Relationship) => {
  const relationshipTypeStr = relationship.type.toString();
  if (relationshipTypeStr === 'CREATIVE_DIRECTOR' || !Object.values(RelationshipType).map(String).includes(relationshipTypeStr)) {
    fixCount++;
    return {
      ...relationship,
      type: convertRelationshipType(relationshipTypeStr)
    };
  }
  return relationship;
});

// Save updated data
fs.writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));

console.log(`\nFixed ${fixCount} invalid relationship types`);
console.log('Updated statistics:');
console.log('--------------------------------------');
console.log(`Total Relationships: ${fashionGenealogyData.relationships.length}`);
console.log('\nPlease run verify script to confirm fixes.');
