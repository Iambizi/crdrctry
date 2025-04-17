import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import type { Request } from 'express';
import http from 'http';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { resolvers } from './resolvers';
import { GraphQLError } from 'graphql';
import { BaseContext } from '@apollo/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read schema
const typeDefs = readFileSync(
  path.join(__dirname, 'schemas', 'schema.graphql'),
  'utf-8'
);

interface MyContext extends BaseContext {
  token?: string;
}

async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return new GraphQLError(error.message);
    },
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }: { req: Request }) => ({
        token: req.headers.authorization || undefined
      })
    })
  );

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
}

startApolloServer().catch((err) => {
  console.error('Error starting server:', err);
});
