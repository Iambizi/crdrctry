import { Designer, Brand, Tenure, Relationship } from '../../database/types/types';

export interface QueryResolvers {
  designer: (parent: unknown, args: { id: string }) => Promise<Designer | null>;
  designers: (
    parent: unknown,
    args: {
      status?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ) => Promise<Designer[]>;

  brand: (parent: unknown, args: { id: string }) => Promise<Brand | null>;
  brands: (
    parent: unknown,
    args: {
      category?: string;
      limit?: number;
      offset?: number;
    }
  ) => Promise<Brand[]>;

  tenure: (parent: unknown, args: { id: string }) => Promise<Tenure | null>;
  tenures: (
    parent: unknown,
    args: {
      designerId?: string;
      brandId?: string;
      department?: string;
      limit?: number;
      offset?: number;
    }
  ) => Promise<Tenure[]>;

  relationship: (parent: unknown, args: { id: string }) => Promise<Relationship | null>;
  relationships: (
    parent: unknown,
    args: {
      sourceDesignerId?: string;
      targetDesignerId?: string;
      brandId?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ) => Promise<Relationship[]>;
}

export interface DesignerResolvers {
  tenures: (parent: Designer) => Promise<Tenure[]>;
  relationships: (parent: Designer) => Promise<Relationship[]>;
}

export interface BrandResolvers {
  designers: (parent: Brand) => Promise<Designer[]>;
  tenures: (parent: Brand) => Promise<Tenure[]>;
}

export interface TenureResolvers {
  designer: (parent: Tenure) => Promise<Designer>;
  brand: (parent: Tenure) => Promise<Brand>;
}

export interface RelationshipResolvers {
  source_designer: (parent: Relationship) => Promise<Designer>;
  target_designer: (parent: Relationship) => Promise<Designer>;
  brand: (parent: Relationship) => Promise<Brand>;
}

export interface Resolvers {
  Query: QueryResolvers;
  Designer: DesignerResolvers;
  Brand: BrandResolvers;
  Tenure: TenureResolvers;
  Relationship: RelationshipResolvers;
}
