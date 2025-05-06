import { pb } from './client';
import { ConnectionArgs, Connection, Edge, PageInfo } from './types';
import { encodeCursor, decodeCursor } from './utils';
import { PocketBaseRecord, ListResult } from './types/pocketbase';

export async function createConnection<T extends PocketBaseRecord>(
  collectionName: string,
  filter: string,
  { first, after, last, before }: ConnectionArgs
): Promise<Connection<T>> {
  const defaultPageSize = 10;
  let pageSize = first || last || defaultPageSize;
  const page = 1;

  if (after) {
    const afterId = decodeCursor(after);
    filter = filter ? `${filter} && id > "${afterId}"` : `id > "${afterId}"`;
  } else if (before) {
    const beforeId = decodeCursor(before);
    filter = filter ? `${filter} && id < "${beforeId}"` : `id < "${beforeId}"`;
    if (last) {
      pageSize = last;
    }
  }

  try {
    const result: ListResult<T> = await pb.collection(collectionName).getList<T>(page, pageSize + 1, {
      filter,
      sort: 'id',
    });

    const hasMore = result.items.length > pageSize;
    const items = hasMore ? result.items.slice(0, pageSize) : result.items;
    const edges: Edge<T>[] = items.map((item: T) => ({
      node: item,
      cursor: encodeCursor(item.id),
    }));

    const pageInfo: PageInfo = {
      hasNextPage: hasMore,
      hasPreviousPage: !!after || !!before,
      startCursor: edges.length > 0 ? edges[0].cursor : undefined,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : undefined,
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
