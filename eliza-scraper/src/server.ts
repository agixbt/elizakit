import { Elysia } from 'elysia';
import swagger from '@elysiajs/swagger';
import { tweetRoutes } from './routes/tweets';
import { cors } from '@elysiajs/cors';
import { docsRoutes } from './routes/docs';
import { tokenRoutes } from './routes/token';

export function createServer() {
  const app = new Elysia()
    .use(cors())
    .use(swagger())
    .onRequest(({ request }) => {
      console.log(`📥 ${request.method} ${request.url}`);
    })
    .onError(({ code, error }) => {
      console.error(`❌ Error [${code}]: ${error}`);
      return {
        status: 'error',
        code,
        message: error.toString()
      };
    })
    .derive(() => {
      console.log('⚡ Processing request...');
      return {};
    })
    .use(tweetRoutes)
    .use(docsRoutes)
    .use(tokenRoutes);
    
  return app;
}

export function startServer(port = 3000) {
  const app = createServer();
  app.listen(port);
  console.log(`🚀 API server running on port ${port}`);
  return app;
}

export default startServer;