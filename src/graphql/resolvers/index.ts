import { Designer, Brand, Tenure, Relationship, DesignerStatus, RelationshipType, Department } from '../../database/types/types';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Authenticate with PocketBase
async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );
    console.log('🔐 Successfully authenticated with PocketBase');
  } catch (error) {
    console.error('❌ Failed to authenticate with PocketBase:', error);
    throw error;
  }
}

// Call authentication immediately
authenticateAdmin();

interface QueryArgs {
  id?: string;
  status?: DesignerStatus;
  isActive?: boolean;
  category?: string;
  designerId?: string;
  brandId?: string;
  department?: Department;
  sourceDesignerId?: string;
  targetDesignerId?: string;
  type?: RelationshipType;
  limit?: number;
  offset?: number;
}

export const resolvers = {
  Query: {
    designer: async (_: unknown, { id }: QueryArgs) => {
      try {
        const record = await pb.collection('fd_designers').getOne(id!);
        return record as Designer;
      } catch (error) {
        console.error('Error fetching designer:', error);
        return null;
      }
    },
    designers: async (_: unknown, { status, isActive, limit = 10, offset = 0 }: QueryArgs) => {
      try {
        let filter = '';
        if (status) filter += `status = "${status}"`;
        if (isActive !== undefined) {
          filter += filter ? ' && ' : '';
          filter += `isActive = ${isActive}`;
        }

        console.log('🔍 Fetching designers with filter:', filter || 'none');
        const result = await pb.collection('fd_designers').getList(offset / limit + 1, limit, {
          filter,
        });
        console.log('📊 Found designers:', result.items.length);
        
        // Ensure all required fields are present
        const validDesigners = result.items.filter(designer => 
          designer && 
          designer.id && 
          designer.name && 
          designer.isActive !== undefined && 
          designer.status
        );
        
        return validDesigners as Designer[];
      } catch (error) {
        console.error('❌ Error fetching designers:', error);
        throw error; // Let Apollo handle the error instead of returning null
      }
    },
    brand: async (_: unknown, { id }: QueryArgs) => {
      try {
        const record = await pb.collection('fd_brands').getOne(id!);
        return record as Brand;
      } catch (error) {
        console.error('Error fetching brand:', error);
        return null;
      }
    },
    brands: async (_: unknown, { category, limit = 10, offset = 0 }: QueryArgs) => {
      try {
        const filter = category ? `categories ~ "${category}"` : '';
        console.log('🔍 Fetching brands with filter:', filter || 'none');
        const result = await pb.collection('fd_brands').getList(offset / limit + 1, limit, {
          filter,
        });
        console.log('📊 Found brands:', result.items.length);
        return result.items as Brand[];
      } catch (error) {
        console.error('❌ Error fetching brands:', error);
        return [];
      }
    },
    tenure: async (_: unknown, { id }: QueryArgs) => {
      try {
        const record = await pb.collection('fd_tenures').getOne(id!);
        return record as Tenure;
      } catch (error) {
        console.error('Error fetching tenure:', error);
        return null;
      }
    },
    tenures: async (_: unknown, { designerId, brandId, department, limit = 10, offset = 0 }: QueryArgs) => {
      try {
        let filter = '';
        if (designerId) filter += `designerId = "${designerId}"`;
        if (brandId) {
          filter += filter ? ' && ' : '';
          filter += `brandId = "${brandId}"`;
        }
        if (department) {
          filter += filter ? ' && ' : '';
          filter += `department = "${department}"`;
        }

        console.log('🔍 Fetching tenures with filter:', filter || 'none');
        const result = await pb.collection('fd_tenures').getList(offset / limit + 1, limit, {
          filter,
        });
        console.log('📊 Found tenures:', result.items.length);
        return result.items as Tenure[];
      } catch (error) {
        console.error('❌ Error fetching tenures:', error);
        return [];
      }
    },
    relationship: async (_: unknown, { id }: QueryArgs) => {
      try {
        const record = await pb.collection('fd_relationships').getOne(id!);
        return record as Relationship;
      } catch (error) {
        console.error('Error fetching relationship:', error);
        return null;
      }
    },
    relationships: async (_: unknown, { sourceDesignerId, targetDesignerId, brandId, type, limit = 10, offset = 0 }: QueryArgs) => {
      try {
        let filter = '';
        if (sourceDesignerId) filter += `sourceDesignerId = "${sourceDesignerId}"`;
        if (targetDesignerId) {
          filter += filter ? ' && ' : '';
          filter += `targetDesignerId = "${targetDesignerId}"`;
        }
        if (brandId) {
          filter += filter ? ' && ' : '';
          filter += `brandId = "${brandId}"`;
        }
        if (type) {
          filter += filter ? ' && ' : '';
          filter += `type = "${type}"`;
        }

        console.log('🔍 Fetching relationships with filter:', filter || 'none');
        const result = await pb.collection('fd_relationships').getList(offset / limit + 1, limit, {
          filter,
        });
        console.log('📊 Found relationships:', result.items.length);
        return result.items as Relationship[];
      } catch (error) {
        console.error('❌ Error fetching relationships:', error);
        return [];
      }
    },
  },
  Designer: {
    tenures: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `designerId = "${parent.id}"`,
        });
        console.log('📊 Found tenures for designer:', result.items.length);
        return result.items as Tenure[];
      } catch (error) {
        console.error('❌ Error fetching designer tenures:', error);
        return [];
      }
    },
    relationships: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_relationships').getList(1, 50, {
          filter: `sourceDesignerId = "${parent.id}" || targetDesignerId = "${parent.id}"`,
        });
        console.log('📊 Found relationships for designer:', result.items.length);
        return result.items as Relationship[];
      } catch (error) {
        console.error('❌ Error fetching designer relationships:', error);
        return [];
      }
    },
  },
  Brand: {
    designers: async (parent: Brand) => {
      try {
        const tenures = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `brandId = "${parent.id}"`,
        });
        const designerIds = [...new Set(tenures.items.map(t => t.designerId))];
        const designers = await Promise.all(
          designerIds.map(id => pb.collection('fd_designers').getOne(id))
        );
        console.log('📊 Found designers for brand:', designers.length);
        return designers as Designer[];
      } catch (error) {
        console.error('❌ Error fetching brand designers:', error);
        return [];
      }
    },
    tenures: async (parent: Brand) => {
      try {
        const result = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `brandId = "${parent.id}"`,
        });
        console.log('📊 Found tenures for brand:', result.items.length);
        return result.items as Tenure[];
      } catch (error) {
        console.error('❌ Error fetching brand tenures:', error);
        return [];
      }
    },
  },
  Tenure: {
    designer: async (parent: Tenure) => {
      try {
        const record = await pb.collection('fd_designers').getOne(parent.designerId);
        return record as Designer;
      } catch (error) {
        console.error('❌ Error fetching tenure designer:', error);
        throw error;
      }
    },
    brand: async (parent: Tenure) => {
      try {
        const record = await pb.collection('fd_brands').getOne(parent.brandId);
        return record as Brand;
      } catch (error) {
        console.error('❌ Error fetching tenure brand:', error);
        throw error;
      }
    },
  },
  Relationship: {
    sourceDesigner: async (parent: Relationship) => {
      try {
        const record = await pb.collection('fd_designers').getOne(parent.sourceDesignerId);
        return record as Designer;
      } catch (error) {
        console.error('❌ Error fetching relationship source designer:', error);
        throw error;
      }
    },
    targetDesigner: async (parent: Relationship) => {
      try {
        const record = await pb.collection('fd_designers').getOne(parent.targetDesignerId);
        return record as Designer;
      } catch (error) {
        console.error('❌ Error fetching relationship target designer:', error);
        throw error;
      }
    },
    brand: async (parent: Relationship) => {
      try {
        const record = await pb.collection('fd_brands').getOne(parent.brandId);
        return record as Brand;
      } catch (error) {
        console.error('❌ Error fetching relationship brand:', error);
        throw error;
      }
    },
  },
};
