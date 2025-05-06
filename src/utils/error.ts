// Generic error handler for GraphQL resolvers
export function handleError(message: string, error: unknown): null {
  if (error instanceof Error) {
    console.error(`${message}:`, error.message);
  } else {
    console.error(`${message}:`, error);
  }
  return null;
}
