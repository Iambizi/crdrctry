export function handleError(message: string, error: Error | unknown): never {
  console.error(`❌ ${message}:`, error);
  throw new Error(message);
}

export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}
