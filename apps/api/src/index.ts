import fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { serverEnv } from './config';
import { signupHandler, loginHandler, refreshHandler, logoutHandler } from './modules/auth/auth.handlers';
import { verifyJWT, checkRole } from './modules/auth/auth.middleware';
import { impersonateHandler, unimpersonateHandler, getAuditLogsHandler, getSystemHealthHandler, adminOverrideHandler } from './modules/dev/dev.handlers';
import { importStudentsHandler } from './modules/admin/admin.handlers';
import { getCoursesHandler, getCourseByIdHandler, purchaseCourseHandler, createCourseHandler, updateCourseHandler, deleteCourseHandler } from './modules/courses/courses.handlers';
import { getQuizzesHandler, getQuizQuestionsHandler, submitQuizAnswersHandler } from './modules/quizzes/quizzes.handlers';
import { getProfileHandler, updateProfileHandler } from './modules/profile/profile.handlers';
import { getLeaderboardHandler } from './modules/leaderboard/leaderboard.handlers';

const server = fastify({
  logger: true,
});

// Ensure upload directory exists for local PDF syllabus courseware storage
const absoluteUploadDir = path.resolve(process.cwd(), serverEnv.UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

// 1. Register Plugins
server.register(cookie);

server.register(cors, {
  origin: [serverEnv.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

server.register(fastifyStatic, {
  root: absoluteUploadDir,
  prefix: '/public/uploads/',
});

// Root / Health check
server.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// 2. Authentication Router
server.post('/api/auth/signup', signupHandler);
server.post('/api/auth/login', loginHandler);
server.post('/api/auth/refresh', refreshHandler);
server.post('/api/auth/logout', logoutHandler);

// 3. Syllabus & Course Catalog Router
server.get('/api/courses', getCoursesHandler);
server.post('/api/courses', {
  preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
  handler: createCourseHandler,
});
server.get('/api/courses/:id', getCourseByIdHandler);
server.put('/api/courses/:id', {
  preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
  handler: updateCourseHandler,
});
server.delete('/api/courses/:id', {
  preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
  handler: deleteCourseHandler,
});
server.post('/api/courses/:id/purchase', {
  preHandler: [verifyJWT],
  handler: purchaseCourseHandler,
});

// 4. Interactive Gamified MCQ Quiz Router
server.get('/api/quizzes', getQuizzesHandler);
server.get('/api/quizzes/:id', {
  preHandler: [verifyJWT],
  handler: getQuizQuestionsHandler,
});
server.post('/api/quizzes/:id/submit', {
  preHandler: [verifyJWT],
  handler: submitQuizAnswersHandler,
});

// 5. User Profile Stats Grid Router
server.get('/api/profile', {
  preHandler: [verifyJWT],
  handler: getProfileHandler,
});
server.put('/api/profile', {
  preHandler: [verifyJWT],
  handler: updateProfileHandler,
});

// 6. Weekly Leaderboard Router
server.get('/api/leaderboard', getLeaderboardHandler);

// 7. Developer Control & Monitoring Router (Protected)
server.post('/api/dev/impersonate', {
  preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  handler: impersonateHandler,
});
server.post('/api/dev/unimpersonate', {
  preHandler: [verifyJWT],
  handler: unimpersonateHandler,
});
server.get('/api/dev/monitoring/logs', {
  preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  handler: getAuditLogsHandler,
});
server.get('/api/dev/monitoring/health', {
  preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  handler: getSystemHealthHandler,
});
server.post('/api/dev/monitoring/override', {
  preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
  handler: adminOverrideHandler,
});

// 8. Onboarding CRM Admin Router (Protected)
server.post('/api/admin/students/import', {
  preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
  handler: importStudentsHandler,
});

// Start Server
const start = async () => {
  try {
    await server.listen({ port: serverEnv.PORT, host: '0.0.0.0' });
    console.log(`🚀 Standalone Fastify backend running on http://localhost:${serverEnv.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
