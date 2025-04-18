import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
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

// Detailed logging middleware
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log('\n🔍 Request Details:');
  console.log('📍 URL:', req.url);
  console.log('📝 Method:', req.method);
  console.log('🔑 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  next();
};

async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      console.error('❌ GraphQL Error:', error);
      return new GraphQLError(error.message);
    },
  });

  await server.start();

  // ✅ Middleware must be applied before Apollo
  app.use(express.json());
  app.use(cors());
  app.use(requestLogger);

  // ✅ Apply Apollo middleware to /graphql
  app.use('/graphql', 
    (req: Request, res: Response, next: NextFunction) => {
      // Handle GET requests (like from the GraphQL playground)
      if (req.method === 'GET') {
        // Serve the GraphQL Playground HTML
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <html>
            <head>
              <title>GraphQL Playground</title>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@apollographql/graphql-playground-react@1.7.42/build/static/css/index.css" />
              <script src="https://cdn.jsdelivr.net/npm/@apollographql/graphql-playground-react@1.7.42/build/static/js/middleware.js"></script>
            </head>
            <body>
              <div id="root">
                <div class="playgroundIn">
                  <div class="loading-wrapper">Loading...</div>
                </div>
              </div>
              <script>
                window.addEventListener('load', function (event) {
                  GraphQLPlayground.init(document.getElementById('root'), {
                    endpoint: '/graphql'
                  })
                })
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      // For POST requests, ensure content type is application/json
      if (req.method === 'POST' && !req.is('application/json')) {
        res.status(415).send('Unsupported Media Type. Please use application/json');
        return;
      }
      
      next();
    },
    expressMiddleware(server, {
      context: async ({ req }) => ({
        token: req.headers.authorization || undefined
      })
    })
  );

  const port = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
}

startApolloServer().catch((err) => {
  console.error('❌ Server Error:', err);
});
