import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

import { healthSchema } from './schemas';

const server = fastify({ logger: false });

async function run() {
  server.register(async (api) => {
    await api.register(swagger, {
      swagger: {
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      },
    });

    await api.register(swaggerUI, {
      routePrefix: '/docs',
    });

    api.get('/health', {
      schema: healthSchema,
      handler: async () => ({ status: 'healthy', timestamp: new Date().toISOString() })
    });
  });

  await server.ready();
  console.log('SWAGGER SPEC:');
  // @ts-ignore
  console.log(JSON.stringify(server.swagger ? server.swagger() : 'undefined on server', null, 2));
}

run().catch(console.error);
