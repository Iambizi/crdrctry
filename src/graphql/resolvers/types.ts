import { BaseContext } from '@apollo/server';
import { Brand, Designer, Relationship, Tenure } from '../../database/types/types';

export interface ResolverContext extends BaseContext {
  isAuthenticated: boolean;
  userId?: string;
}

export interface ConnectionArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface MutationResponse {
  success: boolean;
  message: string;
  code?: string;
}

export interface DesignerMutationResponse extends MutationResponse {
  designer?: Designer;
}

export interface BrandMutationResponse extends MutationResponse {
  brand?: Brand;
}

export interface TenureMutationResponse extends MutationResponse {
  tenure?: Tenure;
}

export interface RelationshipMutationResponse extends MutationResponse {
  relationship?: Relationship;
}
