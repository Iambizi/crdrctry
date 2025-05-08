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
    designers: async (parent: Brand) => {
      try {
        const tenures = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `field_brand = "${parent.id}"`,
        });
        
        const designerIds = [...new Set(tenures.items.map(t => t.designerId as string))];
        const designers = await Promise.all(
          designerIds.map(id => pb.collection('fd_designers').getOne(id))
        );
        
        return designers as Designer[];
      } catch (error) {
        return handleError('Error fetching brand designers', error);
      }
    },

    tenures: async (parent: Brand) => {
      try {
        const result = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `field_brand = "${parent.id}"`,
        });
        return result.items as Tenure[];
      } catch (error) {
        return handleError('Error fetching brand tenures', error);
      }
    },
  },
};
