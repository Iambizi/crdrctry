import { Designer, Relationship, Brand } from '../../../database/types/types';
import { pb } from '../client';
import { ResolverContext } from '../types';
import { handleError } from '../utils';
import { createConnection } from '../pagination';
import { 
  RelationshipFilter,
  CreateRelationshipInput, 
  UpdateRelationshipInput,
  ConnectionArgs 
} from './inputs';

export const RelationshipResolvers = {
  Query: {
    relationship: async (_: unknown, { id }: { id: string }) => {
      try {
        const record = await pb.collection('fd_relationships').getOne(id);
        return record as Relationship;
      } catch (error) {
        return handleError('Error fetching relationship', error);
      }
    },

    relationships: async (_: unknown, args: ConnectionArgs & { filter?: RelationshipFilter }) => {
      try {
        const { first, after, last, before, filter } = args;
        let queryFilter = '';
        
        if (filter) {
          const conditions = [];
          if (filter.type) conditions.push(`field_type = "${filter.type}"`);
          if (filter.sourceDesigner) conditions.push(`field_sourceDesigner = "${filter.sourceDesigner}"`);
          if (filter.targetDesigner) conditions.push(`field_targetDesigner = "${filter.targetDesigner}"`);
          if (filter.brand) conditions.push(`field_brand = "${filter.brand}"`);
          queryFilter = conditions.join(' && ');
        }
        console.log('Query filter:', queryFilter);

        return createConnection<Relationship>('fd_relationships', queryFilter, { first, after, last, before });
      } catch (error) {
        return handleError('Error fetching relationships', error);
      }
    },
  },

  Mutation: {
    createRelationship: async (_: unknown, { input }: { input: CreateRelationshipInput }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Validate that designers exist
        await Promise.all([
          pb.collection('fd_designers').getOne(input.sourceDesigner),
          pb.collection('fd_designers').getOne(input.targetDesigner),
        ]);

        // If brand is provided, validate it exists
        if (input.brand) {
          await pb.collection('fd_brands').getOne(input.brand);
        }

        const record = await pb.collection('fd_relationships').create(input);
        return {
          success: true,
          message: 'Relationship created successfully',
          relationship: record as Relationship,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to create relationship: ${error.message}`,
            code: 'CREATION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to create relationship: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    updateRelationship: async (
      _: unknown, 
      { id, input }: { id: string; input: UpdateRelationshipInput }, 
      context: ResolverContext
    ) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // If designers are being updated, validate they exist
        if (input.sourceDesigner) {
          await pb.collection('fd_designers').getOne(input.sourceDesigner);
        }
        if (input.targetDesigner) {
          await pb.collection('fd_designers').getOne(input.targetDesigner);
        }
        // If brand is being updated, validate it exists
        if (input.brand) {
          await pb.collection('fd_brands').getOne(input.brand);
        }

        const record = await pb.collection('fd_relationships').update(id, input);
        return {
          success: true,
          message: 'Relationship updated successfully',
          relationship: record as Relationship,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to update relationship: ${error.message}`,
            code: 'UPDATE_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to update relationship: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },

    deleteRelationship: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        await pb.collection('fd_relationships').delete(id);
        return {
          success: true,
          message: 'Relationship deleted successfully',
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            success: false,
            message: `Failed to delete relationship: ${error.message}`,
            code: 'DELETION_FAILED',
          };
        }
        return {
          success: false,
          message: 'Failed to delete relationship: Unknown error',
          code: 'UNKNOWN_ERROR',
        };
      }
    },
  },

  Relationship: {
    type: (parent: Record<string, string>) => {
      const type = parent.field_type || parent.type;
      if (!type || !['mentorship', 'succession', 'collaboration', 'familial'].includes(type)) {
        throw new Error(`Invalid relationship type: ${type}`);
      }
      return type;
    },
    startYear: (parent: Record<string, number>) => {
      const year = parent.field_startYear || parent.startYear;
      return typeof year === 'number' ? year : null;
    },
    endYear: (parent: Record<string, number>) => {
      const year = parent.field_endYear || parent.endYear;
      return typeof year === 'number' ? year : null;
    },
    description: (parent: Record<string, string>) => parent.field_description || parent.description || null,
    collaborationProjects: (parent: Record<string, string[]>) => parent.field_collaborationProjects || parent.collaborationProjects || [],
    verificationStatus: (parent: Record<string, string>) => {
      const status = parent.field_verificationStatus || parent.verificationStatus;
      if (!status || !['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
        return 'PENDING';
      }
      return status;
    },
    sourceDesigner: async (parent: Relationship) => {
      try {
        if (!parent.field_sourceDesigner) {
          throw new Error('No source designer ID found');
        }
        const record = await pb.collection('fd_designers').getOne(parent.field_sourceDesigner);
        return record as Designer;
      } catch (error) {
        return handleError('Error fetching relationship designer', error);
      }
    },

    targetDesigner: async (parent: Relationship) => {
      try {
        if (!parent.field_targetDesigner) {
          throw new Error('No target designer ID found');
        }
        const record = await pb.collection('fd_designers').getOne(parent.field_targetDesigner);
        return record as Designer;
      } catch (error) {
        return handleError('Error fetching related designer', error);
      }
    },

    brand: async (parent: Relationship) => {
      try {
        if (!parent.field_brand) {
          throw new Error('No brand ID found');
        }
        const record = await pb.collection('fd_brands').getOne(parent.field_brand);
        return record as Brand;
      } catch (error) {
        return handleError('Error fetching relationship brand', error);
      }
    },
  },
};
