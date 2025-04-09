import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import fashionGenealogyData from "../src/data/fashionGenealogy";
import enrichedData from "../src/data/enrichedData.json";
import {
  Relationship,
  Tenure,
  DesignerStatus,
  RelationshipType,
  Department,
  EnrichedDesigner,
  EnrichedBrand,
  EnrichedBrandDesigner,
} from "../src/types/fashion";

// Types
interface EnrichmentStatus {
  entityId: string;
  entityName: string;
  entityType: "brand" | "designer";
  status: "pending" | "verified" | "failed";
  timestamp: string;
}

interface EnrichmentSuggestion {
  entityId: string;
  entityName: string;
  entityType: "brand" | "designer";
  sources: string[];
  confidence: number;
  content: string;
}

interface EnrichedRelationship {
  brandId: string;
  brandName: string;
  tenures: {
    designerId: string;
    designerName: string;
    role: string;
    department?: string;
    startYear: number;
    endYear?: number;
    achievements?: string[];
    notableWorks?: string[];
    confidence: number;
    sources: string[];
    verificationStatus: "pending" | "verified" | "failed";
  }[];
}

// File paths
const PATHS = {
  statusTracker: path.join(__dirname, "statusTracker.json"),
  knowledgeBase: path.join(__dirname, "enrichedRelationships.json"),
  fashionGenealogy: path.join(__dirname, "../src/data/fashionGenealogy.json"),
};

// Helper functions
function loadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return defaultValue;
  }
}

function saveJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Main enrichment function
async function generateEnrichmentSuggestions(): Promise<
  EnrichmentSuggestion[]
> {
  const suggestions: EnrichmentSuggestion[] = [];
  const statusTracker = loadJsonFile<EnrichmentStatus[]>(
    PATHS.statusTracker,
    []
  );
  const knowledgeBase = loadJsonFile<EnrichedRelationship[]>(
    PATHS.knowledgeBase,
    []
  );

  // Load and prepare to update the main dataset
  const genealogyData = { ...fashionGenealogyData };

  // Process designer tenures from enriched data
  for (const enrichedDesigner of enrichedData.designers as EnrichedDesigner[]) {
    const designer = genealogyData.designers.find(
      (d) => d.name === enrichedDesigner.name
    );
    let existingDesigner = designer;

    if (!existingDesigner) {
      const now = new Date();
      existingDesigner = {
        id: uuidv4(),
        name: enrichedDesigner.name,
        status: "ACTIVE" as DesignerStatus,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      genealogyData.designers.push(existingDesigner);
    }

    for (const tenure of enrichedDesigner.tenures) {
      const brand = genealogyData.brands.find((b) => b.name === tenure.brand);
      if (!brand) continue;

      const now = new Date();

      // Create tenure in main dataset
      const newTenure: Tenure = {
        id: uuidv4(),
        brandId: brand.id,
        designerId: existingDesigner.id,
        role: tenure.role,
        startYear: tenure.startYear,
        endYear: tenure.endYear || undefined,
        isCurrentRole: !tenure.endYear,
        achievements: tenure.achievements || [],
        createdAt: now,
        updatedAt: now,
      };

      genealogyData.tenures.push(newTenure);

      // Create relationship in main dataset
      const newRelationship: Relationship = {
        id: uuidv4(),
        brandId: brand.id,
        sourceDesignerId: existingDesigner.id,
        targetDesignerId: existingDesigner.id,
        type: "CREATIVE_DIRECTOR" as RelationshipType,
        startYear: tenure.startYear,
        endYear: tenure.endYear || undefined,
        createdAt: now,
        updatedAt: now,
      };

      genealogyData.relationships.push(newRelationship);

      // Update knowledge base
      const relationship: EnrichedRelationship = {
        brandId: brand.id,
        brandName: brand.name,
        tenures: [
          {
            designerId: existingDesigner.id,
            designerName: enrichedDesigner.name,
            role: tenure.role,
            startYear: tenure.startYear,
            endYear: tenure.endYear || undefined,
            achievements: tenure.achievements,
            confidence: tenure.confidence,
            sources: [],
            verificationStatus: "pending",
          },
        ],
      };

      knowledgeBase.push(relationship);

      // Update status
      const status: EnrichmentStatus = {
        entityId: existingDesigner.id,
        entityName: enrichedDesigner.name,
        entityType: "designer",
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      const existingStatusIndex = statusTracker.findIndex(
        (s) => s.entityId === existingDesigner.id
      );
      if (existingStatusIndex !== -1) {
        statusTracker[existingStatusIndex] = status;
      } else {
        statusTracker.push(status);
      }
    }
  }

  // Process brand designers from enriched data
  for (const enrichedBrand of enrichedData.brands as EnrichedBrand[]) {
    const brand = genealogyData.brands.find(
      (b) => b.name === enrichedBrand.name
    );
    if (!brand) continue;

    for (const designer of enrichedBrand.designers as EnrichedBrandDesigner[]) {
      // Skip if confidence is too low
      if (designer.confidence < 0.4) continue;

      const now = new Date();

      // Find or create designer in main dataset
      let existingDesigner = genealogyData.designers.find(
        (d) => d.name === designer.name
      );
      if (!existingDesigner) {
        existingDesigner = {
          id: uuidv4(),
          name: designer.name,
          status: "ACTIVE" as DesignerStatus,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        genealogyData.designers.push(existingDesigner);
      }

      // Create tenure in main dataset
      const newTenure: Tenure = {
        id: uuidv4(),
        brandId: brand.id,
        designerId: existingDesigner.id,
        role: designer.role,
        department: designer.department as Department,
        startYear: designer.startYear,
        endYear: designer.endYear || undefined,
        isCurrentRole: !designer.endYear,
        notableWorks: designer.notableWorks || [],
        createdAt: now,
        updatedAt: now,
      };

      genealogyData.tenures.push(newTenure);

      // Create relationship in main dataset
      const newRelationship: Relationship = {
        id: uuidv4(),
        brandId: brand.id,
        sourceDesignerId: existingDesigner.id,
        targetDesignerId: existingDesigner.id,
        type: "CREATIVE_DIRECTOR" as RelationshipType,
        startYear: designer.startYear,
        endYear: designer.endYear || undefined,
        createdAt: now,
        updatedAt: now,
      };

      genealogyData.relationships.push(newRelationship);

      // Update knowledge base
      const relationship: EnrichedRelationship = {
        brandId: brand.id,
        brandName: brand.name,
        tenures: [
          {
            designerId: existingDesigner.id,
            designerName: designer.name,
            role: designer.role,
            department: designer.department,
            startYear: designer.startYear,
            endYear: designer.endYear || undefined,
            notableWorks: designer.notableWorks,
            confidence: designer.confidence,
            sources: [],
            verificationStatus: "pending",
          },
        ],
      };

      knowledgeBase.push(relationship);

      // Update status
      const status: EnrichmentStatus = {
        entityId: brand.id,
        entityName: brand.name,
        entityType: "brand",
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      const existingStatusIndex = statusTracker.findIndex(
        (s) => s.entityId === brand.id
      );
      if (existingStatusIndex !== -1) {
        statusTracker[existingStatusIndex] = status;
      } else {
        statusTracker.push(status);
      }
    }
  }

  // Save all changes
  saveJsonFile(PATHS.statusTracker, statusTracker);
  saveJsonFile(PATHS.knowledgeBase, knowledgeBase);
  saveJsonFile(PATHS.fashionGenealogy, genealogyData);

  return suggestions;
}

// RUN + EXPORT
generateEnrichmentSuggestions().then(() => {
  console.log("\n✅ Enrichment Completed");

  // Group suggestions by status
  const statusTracker = loadJsonFile<EnrichmentStatus[]>(
    PATHS.statusTracker,
    []
  );
  const verified = statusTracker.filter((s) => s.status === "verified").length;
  const pending = statusTracker.filter((s) => s.status === "pending").length;
  const failed = statusTracker.filter((s) => s.status === "failed").length;

  console.log(`\n📊 Status Summary:`);
  console.log(`Verified: ${verified}`);
  console.log(`Pending: ${pending}`);
  console.log(`Failed: ${failed}`);

  // Group by confidence level
  const knowledgeBase = loadJsonFile<EnrichedRelationship[]>(
    PATHS.knowledgeBase,
    []
  );
  const highConfidence = knowledgeBase.filter((r) =>
    r.tenures.some((t) => t.confidence > 0.7)
  );
  const mediumConfidence = knowledgeBase.filter((r) =>
    r.tenures.some((t) => t.confidence >= 0.4 && t.confidence <= 0.7)
  );
  const lowConfidence = knowledgeBase.filter((r) =>
    r.tenures.every((t) => t.confidence < 0.4)
  );

  console.log(`\n🎯 Confidence Levels:`);
  console.log(`High (>70%): ${highConfidence.length}`);
  console.log(`Medium (40-70%): ${mediumConfidence.length}`);
  console.log(`Low (<40%): ${lowConfidence.length}`);

  console.log(`\n💾 Files saved:`);
  console.log(`- Status Tracker: ${PATHS.statusTracker}`);
  console.log(`- Knowledge Base: ${PATHS.knowledgeBase}`);
  console.log(`- Fashion Genealogy: ${PATHS.fashionGenealogy}`);
});
