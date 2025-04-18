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
        const record = await pb.collection('designers').getOne(id!);
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
          filter += `is_active = ${isActive}`;
        }

        console.log('🔍 Fetching designers with filter:', filter || 'none');
        const result = await pb.collection('designers').getList(offset / limit + 1, limit, {
          filter,
        });
        console.log('📊 Found designers:', result.items.length);
        return result.items as Designer[];
      } catch (error) {
        console.error('❌ Error fetching designers:', error);
        return [];
      }
    },
    brand: async (_: unknown, { id }: QueryArgs) => {
      try {
        const record = await pb.collection('brands').getOne(id!);
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
        const result = await pb.collection('brands').getList(offset / limit + 1, limit, {
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
        const record = await pb.collection('tenures').getOne(id!);
        return record as Tenure;
      } catch (error) {
        console.error('Error fetching tenure:', error);
        return null;
      }
    },
    tenures: async (_: unknown, { designerId, brandId, department, limit = 10, offset = 0 }: QueryArgs) => {
      try {
        let filter = '';
        if (designerId) filter += `designer = "${designerId}"`;
        if (brandId) {
          filter += filter ? ' && ' : '';
          filter += `brand = "${brandId}"`;
        }
        if (department) {
          filter += filter ? ' && ' : '';
          filter += `department = "${department}"`;
        }

        console.log('🔍 Fetching tenures with filter:', filter || 'none');
        const result = await pb.collection('tenures').getList(offset / limit + 1, limit, {
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
        const record = await pb.collection('relationships').getOne(id!);
        return record as Relationship;
      } catch (error) {
        console.error('Error fetching relationship:', error);
        return null;
      }
    },
    relationships: async (_: unknown, { sourceDesignerId, targetDesignerId, brandId, type, limit = 10, offset = 0 }: QueryArgs) => {
      try {
        let filter = '';
        if (sourceDesignerId) filter += `source_designer = "${sourceDesignerId}"`;
        if (targetDesignerId) {
          filter += filter ? ' && ' : '';
          filter += `target_designer = "${targetDesignerId}"`;
        }
        if (brandId) {
          filter += filter ? ' && ' : '';
          filter += `brand = "${brandId}"`;
        }
        if (type) {
          filter += filter ? ' && ' : '';
          filter += `type = "${type}"`;
        }

        console.log('🔍 Fetching relationships with filter:', filter || 'none');
        const result = await pb.collection('relationships').getList(offset / limit + 1, limit, {
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
        const result = await pb.collection('tenures').getList(1, 50, {
          filter: `designer = "${parent.id}"`,
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
        const result = await pb.collection('relationships').getList(1, 50, {
          filter: `source_designer = "${parent.id}" || target_designer = "${parent.id}"`,
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
        const tenures = await pb.collection('tenures').getList(1, 50, {
          filter: `brand = "${parent.id}"`,
        });
        const designerIds = [...new Set(tenures.items.map(t => t.designer))];
        const designers = await Promise.all(
          designerIds.map(id => pb.collection('designers').getOne(id))
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
        const result = await pb.collection('tenures').getList(1, 50, {
          filter: `brand = "${parent.id}"`,
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
        const record = await pb.collection('designers').getOne(parent.designer);
        return record as Designer;
      } catch (error) {
        console.error('❌ Error fetching tenure designer:', error);
        throw error;
      }
    },
    brand: async (parent: Tenure) => {
      try {
        const record = await pb.collection('brands').getOne(parent.brand);
        return record as Brand;
      } catch (error) {
        console.error('❌ Error fetching tenure brand:', error);
        throw error;
      }
    },
  },
  Relationship: {
    source_designer: async (parent: Relationship) => {
      try {
        const record = await pb.collection('designers').getOne(parent.source_designer);
        return record as Designer;
      } catch (error) {
        console.error('❌ Error fetching relationship source designer:', error);
        throw error;
      }
    },
    target_designer: async (parent: Relationship) => {
      try {
        const record = await pb.collection('designers').getOne(parent.target_designer);
        return record as Designer;
      } catch (error) {
        console.error('❌ Error fetching relationship target designer:', error);
        throw error;
      }
    },
    brand: async (parent: Relationship) => {
      try {
        const record = await pb.collection('brands').getOne(parent.brand);
        return record as Brand;
      } catch (error) {
        console.error('❌ Error fetching relationship brand:', error);
        throw error;
      }
    },
  },
};
