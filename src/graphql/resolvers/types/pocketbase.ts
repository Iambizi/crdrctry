import { BaseModel } from 'pocketbase';

export interface PocketBaseRecord extends BaseModel {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

export interface ListResult<T extends PocketBaseRecord> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}
