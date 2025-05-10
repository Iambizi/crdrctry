import { Brand, Designer, Tenure } from '../../../database/types/types';
import { pb } from '../client';
import { ResolverContext } from '../types';
import { handleError } from '../utils';
import { createConnection } from '../pagination';
import { 
  BrandFilter,
  CreateBrandInput, 
  UpdateBrandInput,
  ConnectionArgs 
} from './inputs';

export const BrandResolvers = {
  Query: {
    brand: async (_: unknown, { id }: { id: string }) => {
      try {
        const record = await pb.collection('fd_brands').getOne(id);
        return record as Brand;
      } catch (error) {
        return handleError('Error fetching brand', error);
      }
    },

    brands: async (_: unknown, args: ConnectionArgs & { filter: BrandFilter }) => {
      try {
        const { first, after, last, before, filter } = args;
        let queryFilter = '';
        
        if (filter) {
          const conditions = [];
          if (filter.category) conditions.push(`category = "${filter.category}"`);
          if (filter.hasParentCompany !== undefined) {
            conditions.push(filter.hasParentCompany ? 'parentCompany != null' : 'parentCompany = null');
          }
          if (filter.foundedYearRange) {
            const { start, end } = filter.foundedYearRange;
            if (start) conditions.push(`foundedYear >= ${start}`);
            if (end) conditions.push(`foundedYear <= ${end}`);
          }
          if (filter.search) conditions.push(`name ~ "${filter.search}" || description ~ "${filter.search}"`);
          
          queryFilter = conditions.join(' && ');
        }

        return createConnection<Brand>('fd_brands', queryFilter, { first, after, last, before });
      } catch (error) {
        return handleError('Error fetching brands', error);
      }
    },

    searchBrands: async (_: unknown, { query }: { query: string }) => {
      try {
        const result = await pb.collection('fd_brands').getList(1, 20, {
          filter: `name ~ "${query}" || description ~ "${query}" || headquarters ~ "${query}"`,
        });
        return result.items as Brand[];
      } catch (error) {
        return handleError('Error searching brands', error);
      }
    },
  },

  Mutation: {
    createBrand: async (_: unknown, { input }: { input: CreateBrandInput }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const record = await pb.collection('fd_brands').create(input);
        return {
          success: true,
          message: 'Brand created successfully',
          brand: record as Brand,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to create brand: ${error.message}`,
            code: 'CREATION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to create brand: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    updateBrand: async (
      _: unknown, 
      { id, input }: { id: string; input: UpdateBrandInput }, 
      context: ResolverContext
    ) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const record = await pb.collection('fd_brands').update(id, input);
        return {
          success: true,
          message: 'Brand updated successfully',
          brand: record as Brand,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to update brand: ${error.message}`,
            code: 'UPDATE_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to update brand: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    deleteBrand: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        await pb.collection('fd_brands').delete(id);
        return {
          success: true,
          message: 'Brand deleted successfully',
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to delete brand: ${error.message}`,
            code: 'DELETION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to delete brand: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },
  },

  Brand: {
    description: (parent: Brand) => parent.description || null,
    foundedYear: (parent: Brand) => parent.foundedYear || null,
    headquarters: (parent: Brand) => parent.headquarters || null,
    parentCompany: (parent: Brand) => parent.parentCompany || null,
    website: (parent: Brand) => parent.website || null,
    socialMedia: (parent: Brand) => parent.socialMedia || null,
    logoUrl: (parent: Brand) => parent.logoUrl || null,

    designers: async (parent: Brand) => {
      try {
        console.log('DEBUG: Brand parent object:', JSON.stringify(parent, null, 2));
        console.log('DEBUG: Attempting to fetch tenures for brand:', parent.id);
        
        // Fetch tenures for this brand
        console.log('DEBUG: Fetching tenures with filter:', `brand = "${parent.id}"`);
        const tenures = await pb.collection('fd_tenures').getList(1, 100, {
          filter: `brand = "${parent.id}"`,
          sort: '-startYear',
          $cancelKey: parent.id, // Use brand ID as cancel key to prevent auto-cancellation conflicts
        });
        
        console.log('DEBUG: Raw tenures response:', JSON.stringify(tenures, null, 2));
        
        if (tenures.items.length === 0) {
          console.log('DEBUG: No tenures found for brand:', parent.id);
          return [];
        }
        
        // Extract unique designer IDs
        const designerIds = [...new Set(tenures.items.map(t => t.designer))];
        console.log('DEBUG: Extracted designer IDs:', designerIds);
        
        if (designerIds.length === 0) {
          console.log('DEBUG: No designer IDs found in tenures');
          return [];
        }
        
        if (designerIds.length === 0) {
          console.log('DEBUG: No designers found for brand:', parent.id);
          return [];
        }

        // Fetch all designers in one batch instead of individually
        console.log('DEBUG: Fetching designers with filter:', `id ?~ "${designerIds.join('|')}"`);        
        const designers = await pb.collection('fd_designers').getList(1, designerIds.length, {
          filter: designerIds.map(id => `id = "${id}"`).join(' || '),
          $cancelKey: `designers-${parent.id}`, // Unique cancel key for designer fetch
        });
        
        console.log('DEBUG: Fetched designers:', designers.items.map(d => ({ id: d.id, name: d.name })));
        return designers.items as Designer[];
      } catch (error) {
        console.error('DEBUG: Error in designers resolver:', error);
        return [];
      }
    },

    tenures: async (parent: Brand) => {
      try {
        const result = await pb.collection('fd_tenures').getList(1, 100, {
          filter: `brand = "${parent.id}"`,
          sort: '-startYear',
        });
        return result.items as Tenure[];
      } catch (error) {
        console.error('Error fetching brand tenures:', error);
        return [];
      }
    },
  },
};
