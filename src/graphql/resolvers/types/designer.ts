import { Designer, Tenure, Relationship } from '../../../database/types/types';
import { pb } from '../client';
import { ResolverContext } from '../types';
import { handleError } from '../utils';
import { createConnection } from '../pagination';

export const DesignerResolvers = {
  Query: {
    designer: async (_: unknown, { id }: { id: string }) => {
      try {
        const record = await pb.collection('fd_designers').getOne(id);
        return record as Designer;
      } catch (error) {
        return handleError('Error fetching designer', error);
      }
    },

    designers: async (_: unknown, args: any) => {
      try {
        const { first, after, last, before, filter } = args;
        let queryFilter = '';
        
        if (filter) {
          const conditions = [];
          if (filter.status) conditions.push(`status = "${filter.status}"`);
          if (filter.isActive !== undefined) conditions.push(`isActive = ${filter.isActive}`);
          if (filter.nationality) conditions.push(`nationality = "${filter.nationality}"`);
          if (filter.birthYearRange) {
            const { start, end } = filter.birthYearRange;
            if (start) conditions.push(`birthYear >= ${start}`);
            if (end) conditions.push(`birthYear <= ${end}`);
          }
          if (filter.hasAwards) conditions.push('awards != null && awards != "[]"');
          if (filter.search) conditions.push(`name ~ "${filter.search}"`);
          
          queryFilter = conditions.join(' && ');
        }

        return createConnection('fd_designers', queryFilter, { first, after, last, before });
      } catch (error) {
        return handleError('Error fetching designers', error);
      }
    },

    searchDesigners: async (_: unknown, { query }: { query: string }) => {
      try {
        const result = await pb.collection('fd_designers').getList(1, 20, {
          filter: `name ~ "${query}" || biography ~ "${query}" || nationality ~ "${query}"`,
        });
        return result.items as Designer[];
      } catch (error) {
        return handleError('Error searching designers', error);
      }
    },
  },

  Mutation: {
    createDesigner: async (_: unknown, { input }: { input: any }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const record = await pb.collection('fd_designers').create(input);
        return {
          success: true,
          message: 'Designer created successfully',
          designer: record as Designer,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to create designer: ${error.message}`,
          code: error.code,
        };
      }
    },

    updateDesigner: async (_: unknown, { id, input }: { id: string; input: any }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        const record = await pb.collection('fd_designers').update(id, input);
        return {
          success: true,
          message: 'Designer updated successfully',
          designer: record as Designer,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to update designer: ${error.message}`,
          code: error.code,
        };
      }
    },

    deleteDesigner: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        await pb.collection('fd_designers').delete(id);
        return {
          success: true,
          message: 'Designer deleted successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to delete designer: ${error.message}`,
          code: error.code,
        };
      }
    },
  },

  Designer: {
    tenures: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `designerId = "${parent.id}"`,
        });
        return result.items as Tenure[];
      } catch (error) {
        return handleError('Error fetching designer tenures', error);
      }
    },

    relationships: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_relationships').getList(1, 50, {
          filter: `sourceDesignerId = "${parent.id}" || targetDesignerId = "${parent.id}"`,
        });
        return result.items as Relationship[];
      } catch (error) {
        return handleError('Error fetching designer relationships', error);
      }
    },
  },
};
