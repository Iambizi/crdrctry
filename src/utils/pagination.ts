import { pb } from '../database/client';
import { ListResult } from 'pocketbase';

interface Edge<T> {
  cursor: string;
  node: T;
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

interface ConnectionArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export async function createConnection<T>(
  collection: string,
  filter: string,
  args: ConnectionArgs
): Promise<Connection<T>> {
  const { first = 10, after, last, before } = args;
  let page = 1;
  let perPage = first;

  // Handle cursor-based pagination
  if (after) {
    page = parseInt(Buffer.from(after, 'base64').toString(), 10);
  } else if (before) {
    page = parseInt(Buffer.from(before, 'base64').toString(), 10) - 1;
  }

  // Handle backwards pagination
  if (last) {
    perPage = last;
  }

  try {
    const result: ListResult<T> = await pb.collection(collection).getList(page, perPage, {
      filter,
      sort: '-created',
    });

    const edges: Edge<T>[] = result.items.map(item => ({
      cursor: Buffer.from(page.toString()).toString('base64'),
      node: item,
    }));

    const pageInfo: PageInfo = {
      hasNextPage: result.totalPages > page,
      hasPreviousPage: page > 1,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    return {
      edges,
      pageInfo,
      totalCount: result.totalItems,
    };
  } catch (error) {
    console.error('Error creating connection:', error);
    throw error;
  }
}
