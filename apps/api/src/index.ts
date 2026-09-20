import fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { serverEnv } from './config';
import { verifyJWT } from './modules/auth/auth.middleware';
import { AdminController } from './modules/admin/admin.controller';
import { authRoutes } from './modules/auth/auth.routes';
import { coursesRoutes } from './modules/courses/courses.routes';
import { CoursesController } from './modules/courses/courses.controller';
import { quizzesRoutes } from './modules/quizzes/quizzes.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { ProfileController } from './modules/profile/profile.controller';
import { leaderboardRoutes } from './modules/leaderboard/leaderboard.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { devRoutes } from './modules/dev/dev.routes';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import * as schemas from './schemas';

const server = fastify({
  logger: true,
  keepAliveTimeout: 65000,
  forceCloseConnections: false,
  ajv: {
    customOptions: {
      strict: false,
    },
  },
});

// Configure Keep-Alive persistent connection response headers
server.addHook('onSend', async (_request, reply) => {
  reply.header('Connection', 'keep-alive');
  reply.header('Keep-Alive', 'timeout=65');
});

// Ensure upload directory exists for local PDF syllabus courseware storage
const absoluteUploadDir = path.resolve(process.cwd(), serverEnv.UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

// 1. Register Plugins
server.register(cookie);
server.register(fastifyMultipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for PDFs/MP4s
  },
});

server.register(cors, {
  origin: [serverEnv.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

server.register(fastifyStatic, {
  root: absoluteUploadDir,
  prefix: '/public/uploads/',
});

// 1.5 Register Swagger API Documentation
server.register(swagger, {
  swagger: {
    info: {
      title: 'Antigravity LMS API',
      description: 'API documentation for the gamified language learning system.',
      version: '1.0.0',
    },
    host: `localhost:${serverEnv.PORT}`,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      cookieAuth: {
        type: 'apiKey',
        name: 'token',
        in: 'cookie',
      },
    },
  },
});

// Register routes inside a plugin scope to allow @fastify/swagger's onRoute hook to capture them during Fastify's boot cycle.
server.register(async (api) => {
  // Root / Health check
  api.get('/health', {
    schema: schemas.healthSchema,
    handler: async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    },
  });

  // Public settings & rotating daily tips
  api.get('/api/public/settings', {
    schema: schemas.publicSettingsSchema,
    handler: AdminController.getPublicSettings,
  });

  // 2. Authentication Router
  await api.register(authRoutes, { prefix: '/api/auth' });

  // 3. Courses & Lessons Router
  await api.register(coursesRoutes, { prefix: '/api/courses' });
  // Convenience alias for lesson completion: /api/lessons/:id/complete
  api.post(
    '/api/lessons/:id/complete',
    { schema: schemas.completeLessonSchema, preHandler: [verifyJWT] },
    CoursesController.completeLesson
  );

  // 4. Interactive Gamified MCQ Quiz Router
  await api.register(quizzesRoutes, { prefix: '/api/quizzes' });

  // 5. User Profile Stats Grid Router
  await api.register(profileRoutes, { prefix: '/api/profile' });
  // Convenience alias for daily warmup claim: /api/warmup/claim
  api.post(
    '/api/warmup/claim',
    { schema: schemas.claimWarmupSchema, preHandler: [verifyJWT] },
    ProfileController.claimDailyWarmup
  );

  // 6. Weekly Leaderboard Router
  await api.register(leaderboardRoutes, { prefix: '/api/leaderboard' });

  // 7. Developer Control & Monitoring Router
  await api.register(devRoutes, { prefix: '/api/dev' });

  // 8. Admin Unified CRM & Content Router
  await api.register(adminRoutes, { prefix: '/api/admin' });
});

server.register(swaggerUI, {
  routePrefix: '/docs/swagger',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});

server.get('/docs', async (request, reply) => {
  let htmlPath = path.join(__dirname, 'templates', 'docs.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(__dirname, '..', 'src', 'templates', 'docs.html');
  }
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  reply.type('text/html').send(htmlContent);
});

server.get('/docs/', async (request, reply) => {
  let htmlPath = path.join(__dirname, 'templates', 'docs.html');
  if (!fs.existsSync(htmlPath)) {
    htmlPath = path.join(__dirname, '..', 'src', 'templates', 'docs.html');
  }
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  reply.type('text/html').send(htmlContent);
});

server.get('/test-swagger', async () => {
  return {
    routes: server.printRoutes(),
    swagger: server.swagger(),
  };
});

// Start Server
const start = async () => {
  try {
    await server.listen({ port: serverEnv.PORT, host: '0.0.0.0' });
    console.log(`[OK] Standalone Fastify backend running on http://localhost:${serverEnv.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
