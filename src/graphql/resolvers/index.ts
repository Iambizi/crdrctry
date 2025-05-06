import { DesignerResolvers } from './types/designer';
import { BrandResolvers } from './types/brand';
import { TenureResolvers } from './types/tenure';
import { RelationshipResolvers } from './types/relationship';

export const resolvers = {
  Query: {
    ...DesignerResolvers.Query,
    ...BrandResolvers.Query,
    ...TenureResolvers.Query,
    ...RelationshipResolvers.Query,
  },
  Mutation: {
    ...DesignerResolvers.Mutation,
    ...BrandResolvers.Mutation,
    ...TenureResolvers.Mutation,
    ...RelationshipResolvers.Mutation,
  },
  Designer: DesignerResolvers.Designer,
  Brand: BrandResolvers.Brand,
  Tenure: TenureResolvers.Tenure,
  Relationship: RelationshipResolvers.Relationship,
};
