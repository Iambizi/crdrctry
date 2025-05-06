import { Designer, Relationship } from '../../../database/types/types';
import { pb } from '../client';
import { ResolverContext } from '../types';
import { handleError } from '../utils';
import { createConnection } from '../pagination';
import { 
  RelationshipQueryArgs, 
  CreateRelationshipInput, 
  UpdateRelationshipInput 
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

    relationships: async (_: unknown, args: RelationshipQueryArgs) => {
      try {
        const { first, after, last, before, filter } = args;
        let queryFilter = '';
        
        if (filter) {
          const conditions = [];
          if (filter.type) conditions.push(`type = "${filter.type}"`);
          if (filter.sourceDesigner) conditions.push(`sourceDesigner = "${filter.sourceDesigner}"`);
          if (filter.targetDesigner) conditions.push(`targetDesigner = "${filter.targetDesigner}"`);
          
          if (filter.yearRange) {
            const { start, end } = filter.yearRange;
            if (start) conditions.push(`year >= ${start}`);
            if (end) conditions.push(`year <= ${end}`);
          }
          
          if (filter.search) {
            conditions.push(`description ~ "${filter.search}" || source ~ "${filter.search}"`);
          }
          
          queryFilter = conditions.join(' && ');
        }

        return createConnection<Relationship>('fd_relationships', queryFilter, { first, after, last, before });
      } catch (error) {
        return handleError('Error fetching relationships', error);
      }
    },

    designerRelationships: async (parent: Designer) => {
      try {
        const result = await pb.collection('fd_relationships').getList(1, 50, {
          filter: `sourceDesigner = "${parent.id}" || targetDesigner = "${parent.id}"`,
        });
        console.log(' Found relationships for designer:', result.items.length);
        return result.items as Relationship[];
      } catch (error) {
        console.error(' Error fetching designer relationships:', error);
        return [];
      }
    },
  },

  Mutation: {
    createRelationship: async (_: unknown, { input }: { input: CreateRelationshipInput }, context: ResolverContext) => {
      try {
        if (!context.isAuthenticated) {
          throw new Error('Authentication required');
        }

        // Validate that both designers exist and are different
        if (input.sourceDesigner === input.targetDesigner) {
          throw new Error('Designer cannot have a relationship with themselves');
        }

        await Promise.all([
          pb.collection('fd_designers').getOne(input.sourceDesigner),
          pb.collection('fd_designers').getOne(input.targetDesigner),
        ]);

        // Check for duplicate relationship
        const existingRelationships = await pb.collection('fd_relationships').getList(1, 1, {
          filter: `(sourceDesigner = "${input.sourceDesigner}" && targetDesigner = "${input.targetDesigner}") || (sourceDesigner = "${input.targetDesigner}" && targetDesigner = "${input.sourceDesigner}")`,
        });

        if (existingRelationships.items.length > 0) {
          throw new Error('A relationship between these designers already exists');
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

        const currentRelationship = await pb.collection('fd_relationships').getOne(id);

        // If updating designers, validate they exist and are different
        if (input.sourceDesigner || input.targetDesigner) {
          const newSourceDesigner = input.sourceDesigner || currentRelationship.sourceDesigner;
          const newTargetDesigner = input.targetDesigner || currentRelationship.targetDesigner;

          if (newSourceDesigner === newTargetDesigner) {
            throw new Error('Designer cannot have a relationship with themselves');
          }

          await Promise.all([
            pb.collection('fd_designers').getOne(newSourceDesigner),
            pb.collection('fd_designers').getOne(newTargetDesigner),
          ]);

          // Check for duplicate relationship
          const existingRelationships = await pb.collection('fd_relationships').getList(1, 1, {
            filter: `id != "${id}" && ((sourceDesigner = "${newSourceDesigner}" && targetDesigner = "${newTargetDesigner}") || (sourceDesigner = "${newTargetDesigner}" && targetDesigner = "${newSourceDesigner}"))`,
          });

          if (existingRelationships.items.length > 0) {
            throw new Error('A relationship between these designers already exists');
          }
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
    designer: async (parent: Relationship) => {
      try {
        const record = await pb.collection('fd_designers').getOne(parent.sourceDesigner);
        return record as Designer;
      } catch (error) {
        return handleError('Error fetching relationship designer', error);
      }
    },

    relatedDesigner: async (parent: Relationship) => {
      try {
        const record = await pb.collection('fd_designers').getOne(parent.targetDesigner);
        return record as Designer;
      } catch (error) {
        return handleError('Error fetching related designer', error);
      }
    },
  },
};
