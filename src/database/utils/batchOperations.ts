import PocketBase from "pocketbase";

type BatchOperationOptions = {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
};

const DEFAULT_BATCH_SIZE = 50;

export async function batchInsert<T extends object>(
  client: PocketBase,
  collection: string,
  items: T[],
  options: BatchOperationOptions = {}
): Promise<void> {
  const { batchSize = DEFAULT_BATCH_SIZE, onProgress } = options;
  const totalItems = items.length;
  let processedItems = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      await Promise.all(
        batch.map((item) => client.collection(collection).create(item))
      );
    } catch (error) {
      console.error(`Batch insert failed at index ${i}:`, error);
      throw error;
    }

    processedItems += batch.length;
    onProgress?.(processedItems, totalItems);
  }
}

export async function batchUpsert<T extends object>(
  client: PocketBase,
  collection: string,
  items: Array<T & { id?: string }>,
  options: BatchOperationOptions = {}
): Promise<void> {
  const { batchSize = DEFAULT_BATCH_SIZE, onProgress } = options;
  const totalItems = items.length;
  let processedItems = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      await Promise.all(
        batch.map((item) => {
          if (item.id) {
            return client.collection(collection).update(item.id, item);
          } else {
            return client.collection(collection).create(item);
          }
        })
      );
    } catch (error) {
      console.error(`Batch upsert failed at index ${i}:`, error);
      throw error;
    }

    processedItems += batch.length;
    onProgress?.(processedItems, totalItems);
  }
}

export async function batchDelete(
  client: PocketBase,
  collection: string,
  ids: string[],
  options: BatchOperationOptions = {}
): Promise<void> {
  const { batchSize = DEFAULT_BATCH_SIZE, onProgress } = options;
  const totalItems = ids.length;
  let processedItems = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    try {
      await Promise.all(
        batchIds.map((id) => client.collection(collection).delete(id))
      );
    } catch (error) {
      console.error(`Batch delete failed at index ${i}:`, error);
      throw error;
    }

    processedItems += batchIds.length;
    onProgress?.(processedItems, totalItems);
  }
}

export async function batchUpdate<T extends object>(
  client: PocketBase,
  collection: string,
  updates: Array<{ id: string; data: Partial<T> }>,
  options: BatchOperationOptions = {}
): Promise<void> {
  const { batchSize = DEFAULT_BATCH_SIZE, onProgress } = options;
  const totalItems = updates.length;
  let processedItems = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    try {
      await Promise.all(
        batch.map(({ id, data }) =>
          client.collection(collection).update(id, data)
        )
      );
    } catch (error) {
      console.error(`Batch update failed:`, error);
      throw error;
    }

    processedItems += batch.length;
    onProgress?.(processedItems, totalItems);
  }
}
