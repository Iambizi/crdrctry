import { Designer, Tenure, Relationship } from '../../../database/types/types';
import { pb } from '../client';
import { ResolverContext } from '../types';
import { handleError } from '../utils';
import { createConnection } from '../pagination';
import { 
  DesignerFilter,
  CreateDesignerInput, 
  UpdateDesignerInput,
  ConnectionArgs 
} from './inputs';

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

    designers: async (_: unknown, args: ConnectionArgs & { filter?: DesignerFilter }) => {
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
    createDesigner: async (_: unknown, { input }: { input: CreateDesignerInput }, context: ResolverContext) => {
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
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to create designer: ${error.message}`,
            code: 'CREATION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to create designer: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    updateDesigner: async (_: unknown, { id, input }: { id: string; input: UpdateDesignerInput }, context: ResolverContext) => {
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
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to update designer: ${error.message}`,
            code: 'UPDATE_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to update designer: Unknown error',
          code: 'UNKNOWN_ERROR',
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
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to delete designer: ${error.message}`,
            code: 'DELETION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to delete designer: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },
  },

  Designer: {
    awards: (parent: Designer) => parent.awards || [],
    education: (parent: Designer) => parent.education || [],
    signatureStyles: (parent: Designer) => parent.signatureStyles || [],
    birthYear: (parent: Designer) => parent.birthYear || null,
    deathYear: (parent: Designer) => parent.deathYear || null,
    nationality: (parent: Designer) => parent.nationality || null,
    biography: (parent: Designer) => parent.biography || null,
    currentRole: (parent: Designer) => parent.currentRole || null,
    imageUrl: (parent: Designer) => parent.imageUrl || null,
    socialMedia: (parent: Designer) => parent.socialMedia || null,

    tenures: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_tenures').getList(1, 50, {
          filter: `designer = "${parent.id}"`,
          expand: 'brand',
          sort: '-startYear'
        });
        return result.items as Tenure[];
      } catch (error) {
        console.error('Error fetching designer tenures:', error);
        return [];
      }
    },

    relationships: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_relationships').getList(1, 50, {
          filter: `sourceDesigner = "${parent.id}" || targetDesigner = "${parent.id}"`,
          sort: '-startYear'
        });
        return result.items as Relationship[];
      } catch (error) {
        console.error('Error fetching designer relationships:', error);
        return [];
      }
    },
  },
};
