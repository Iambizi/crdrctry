import { Brand, Designer, Tenure } from '../../../database/types/types';
import { pb } from '../client';
import { ResolverContext } from '../types';
import { handleError } from '../utils';
import { createConnection } from '../pagination';
import { 
  TenureQueryArgs, 
  CreateTenureInput, 
  UpdateTenureInput,
} from './inputs';

export const TenureResolvers = {
  Query: {
    tenure: async (_: unknown, { id }: { id: string }) => {
      try {
        const record = await pb.collection('fd_tenures').getOne(id);
        return record as Tenure;
      } catch (error) {
        return handleError('Error fetching tenure', error);
      }
    },

    tenures: async (_: unknown, args: TenureQueryArgs) => {
      try {
        const { first, after, last, before, filter } = args;
        let queryFilter = '';
        
        if (filter) {
          const conditions = [];
          if (filter.department) conditions.push(`field_department = "${filter.department}"`);
          if (filter.isActive !== undefined) conditions.push(`field_isActive = ${filter.isActive}`);
          if (filter.brandId) conditions.push(`field_brand = "${filter.brandId}"`);
          if (filter.designerId) conditions.push(`field_designer = "${filter.designerId}"`);
          
          if (filter.startYearRange) {
            const { start, end } = filter.startYearRange;
            if (start) conditions.push(`field_startYear >= ${start}`);
            if (end) conditions.push(`field_startYear <= ${end}`);
          }
          
          if (filter.endYearRange) {
            const { start, end } = filter.endYearRange;
            if (start) conditions.push(`field_endYear >= ${start}`);
            if (end) conditions.push(`field_endYear <= ${end}`);
          }
          
          if (filter.search) {
            conditions.push(`field_role ~ "${filter.search}" || field_impactDescription ~ "${filter.search}"`);
          }
          
          queryFilter = conditions.join(' && ');
        }

        return createConnection<Tenure>('fd_tenures', queryFilter, { first, after, last, before });
      } catch (error) {
        return handleError('Error fetching tenures', error);
      }
    },

    activeTenures: async (_: unknown, { brandId, designerId }: { brandId?: string; designerId?: string }) => {
      try {
        const conditions = ['field_isActive = true'];
        if (brandId) conditions.push(`field_brand = "${brandId}"`);
        if (designerId) conditions.push(`field_designer = "${designerId}"`);

        const result = await pb.collection('fd_tenures').getList(1, 50, {
          filter: conditions.join(' && '),
          sort: '-startYear',
        });
        return result.items as Tenure[];
      } catch (error) {
        return handleError('Error fetching active tenures', error);
      }
    },
  },

  Mutation: {
    createTenure: async (_: unknown, { input }: { input: CreateTenureInput }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Validate that brand and designer exist
        await Promise.all([
          pb.collection('fd_brands').getOne(input.brandId),
          pb.collection('fd_designers').getOne(input.designerId),
        ]);

        const record = await pb.collection('fd_tenures').create(input);
        return {
          success: true,
          message: 'Tenure created successfully',
          tenure: record as Tenure,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to create tenure: ${error.message}`,
            code: 'CREATION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to create tenure: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    updateTenure: async (
      _: unknown, 
      { id, input }: { id: string; input: UpdateTenureInput }, 
      context: ResolverContext
    ) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // If brandId or designerId is being updated, validate they exist
        if (input.brandId) {
          await pb.collection('fd_brands').getOne(input.brandId);
        }
        if (input.designerId) {
          await pb.collection('fd_designers').getOne(input.designerId);
        }

        const record = await pb.collection('fd_tenures').update(id, input);
        return {
          success: true,
          message: 'Tenure updated successfully',
          tenure: record as Tenure,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to update tenure: ${error.message}`,
            code: 'UPDATE_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to update tenure: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    deleteTenure: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        await pb.collection('fd_tenures').delete(id);
        return {
          success: true,
          message: 'Tenure deleted successfully',
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to delete tenure: ${error.message}`,
            code: 'DELETION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to delete tenure: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },
  },

  Tenure: {
    role: (parent: Tenure) => parent.role || null,
    department: (parent: Tenure) => parent.department || null,
    startYear: (parent: Tenure) => parent.startYear || null,
    endYear: (parent: Tenure) => parent.endYear || null,
    isCurrentRole: (parent: Tenure) => parent.isCurrentRole || false,
    achievements: (parent: Tenure) => parent.achievements || [],
    notableWorks: (parent: Tenure) => parent.notableWorks || [],
    notableCollections: (parent: Tenure) => parent.notableCollections || [],
    impactDescription: (parent: Tenure) => parent.impactDescription || null,

    brand: async (parent: Tenure) => {
      try {
        const record = await pb.collection('fd_brands').getOne(parent.field_brand);
        return record as Brand;
      } catch (error) {
        return handleError('Error fetching tenure brand', error);
      }
    },

    designer: async (parent: Tenure) => {
      try {
        const record = await pb.collection('fd_designers').getOne(parent.field_designer);
        return record as Designer;
      } catch (error) {
        return handleError('Error fetching tenure designer', error);
      }
    },
  },
};
