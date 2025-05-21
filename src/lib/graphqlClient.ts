import { GraphQLClient } from 'graphql-request';

// Create a GraphQL client instance
export const gqlClient = new GraphQLClient('http://localhost:3000/api/graphql', {
  headers: {},
});

// You can add authentication and other configuration as needed
export function configureGraphQLClient(token?: string) {
  if (token) {
    gqlClient.setHeader('Authorization', `Bearer ${token}`);
  }
}
