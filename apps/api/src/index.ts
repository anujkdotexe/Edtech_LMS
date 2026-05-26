import fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { serverEnv } from './config';
import { signupHandler, loginHandler, refreshHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler, googleOAuthHandler } from './modules/auth/auth.handlers';
import { verifyJWT, checkRole } from './modules/auth/auth.middleware';
import { impersonateHandler, unimpersonateHandler, getAuditLogsHandler, getSystemHealthHandler, adminOverrideHandler, getAdvancedLogsHandler, getFeatureFlagsHandler, toggleFeatureFlagHandler, getCacheKeysHandler, deleteCacheKeyHandler, getReconciliationReportHandler, getQueueMonitorHandler } from './modules/dev/dev.handlers';
import { importStudentsHandler } from './modules/admin/admin.handlers';
import { getStudentsHandler, suspendStudentHandler, resetStudentPasswordHandler, deleteStudentHandler, enrollStudentHandler, exportStudentsHandler, addStudentHandler, bulkEnrollStudentsHandler, revokeCourseAccessHandler, sendMessageToStudentHandler } from './modules/admin/students.handlers';
import { getPaymentsHandler, issueRefundHandler, exportPaymentsHandler } from './modules/admin/payments.handlers';
import { getSiteSettingsHandler, updateSiteSettingsHandler, getPublicSettingsHandler } from './modules/admin/settings.handlers';
import { getCoursesHandler, getCourseByIdHandler, purchaseCourseHandler, createCourseHandler, updateCourseHandler, deleteCourseHandler } from './modules/courses/courses.handlers';
import { getQuizzesHandler, getQuizQuestionsHandler, submitQuizAnswersHandler } from './modules/quizzes/quizzes.handlers';
import { createModuleHandler, updateModuleHandler, deleteModuleHandler, createLessonHandler, updateLessonHandler, deleteLessonHandler, uploadLessonFileHandler, reorderLessonsHandler } from './modules/admin/content.handlers';
import { createQuizHandler, updateQuizHandler, deleteQuizHandler, createQuestionHandler, updateQuestionHandler, deleteQuestionHandler } from './modules/admin/quiz.handlers';
import { getDashboardAnalyticsHandler, getCourseAnalyticsHandler } from './modules/admin/analytics.handlers';
import { getProfileHandler, updateProfileHandler } from './modules/profile/profile.handlers';
import { getLeaderboardHandler } from './modules/leaderboard/leaderboard.handlers';
import fastifyMultipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import * as schemas from './schemas';

const server = fastify({
  logger: true,
  ajv: {
    customOptions: {
      strict: false,
    }
  }
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
  }
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
        in: 'cookie'
      }
    }
  },
});

// Register routes inside a plugin scope to allow @fastify/swagger's onRoute hook to capture them during Fastify's boot cycle.
server.register(async (api) => {
  // Root / Health check
  api.get('/health', {
    schema: schemas.healthSchema,
    handler: async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }
  });

  // Public settings & rotating daily tips
  api.get('/api/public/settings', {
    schema: schemas.publicSettingsSchema,
    handler: getPublicSettingsHandler
  });

  // 2. Authentication Router
  api.post('/api/auth/signup', { schema: schemas.signupSchema, handler: signupHandler });
  api.post('/api/auth/google', { schema: schemas.googleOAuthSchema, handler: googleOAuthHandler });
  api.post('/api/auth/login', { schema: schemas.loginSchema, handler: loginHandler });
  api.post('/api/auth/refresh', { schema: schemas.refreshSchema, handler: refreshHandler });
  api.post('/api/auth/logout', { schema: schemas.logoutSchema, handler: logoutHandler });
  api.post('/api/auth/forgot-password', { schema: schemas.forgotPasswordSchema, handler: forgotPasswordHandler });
  api.post('/api/auth/reset-password', { schema: schemas.resetPasswordSchema, handler: resetPasswordHandler });

  // 3. Syllabus & Course Catalog Router
  api.get('/api/courses', { schema: schemas.coursesSchema, handler: getCoursesHandler });
  api.post('/api/courses', {
    schema: schemas.createCourseSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: createCourseHandler,
  });
  api.get('/api/courses/:id', { schema: schemas.courseByIdSchema, handler: getCourseByIdHandler });
  api.put('/api/courses/:id', {
    schema: schemas.updateCourseSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: updateCourseHandler,
  });
  api.delete('/api/courses/:id', {
    schema: schemas.deleteCourseSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: deleteCourseHandler,
  });
  api.post('/api/courses/:id/purchase', {
    schema: schemas.purchaseCourseSchema,
    preHandler: [verifyJWT],
    handler: purchaseCourseHandler,
  });

  // 4. Interactive Gamified MCQ Quiz Router
  api.get('/api/quizzes', { schema: schemas.quizzesSchema, handler: getQuizzesHandler });
  api.get('/api/quizzes/:id', {
    schema: schemas.quizByIdSchema,
    preHandler: [verifyJWT],
    handler: getQuizQuestionsHandler,
  });
  api.post('/api/quizzes/:id/submit', {
    schema: schemas.submitQuizSchema,
    preHandler: [verifyJWT],
    handler: submitQuizAnswersHandler,
  });

  // 5. User Profile Stats Grid Router
  api.get('/api/profile', {
    schema: schemas.profileSchema,
    preHandler: [verifyJWT],
    handler: getProfileHandler,
  });
  api.put('/api/profile', {
    schema: schemas.updateProfileSchema,
    preHandler: [verifyJWT],
    handler: updateProfileHandler,
  });

  // 6. Weekly Leaderboard Router
  api.get('/api/leaderboard', { schema: schemas.leaderboardSchema, handler: getLeaderboardHandler });

  // 7. Developer Control & Monitoring Router (Protected)
  api.post('/api/dev/impersonate', {
    schema: schemas.devImpersonateSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: impersonateHandler,
  });
  api.post('/api/dev/unimpersonate', {
    schema: schemas.devUnimpersonateSchema,
    preHandler: [verifyJWT],
    handler: unimpersonateHandler,
  });
  api.get('/api/dev/monitoring/logs', {
    schema: schemas.devLogsSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getAuditLogsHandler,
  });
  api.get('/api/dev/monitoring/health', {
    schema: schemas.devHealthSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getSystemHealthHandler,
  });
  api.post('/api/dev/monitoring/override', {
    schema: schemas.devOverrideSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: adminOverrideHandler,
  });
  api.get('/api/dev/monitoring/advanced-logs', {
    schema: schemas.devAdvancedLogsSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getAdvancedLogsHandler,
  });

  // 8. Onboarding CRM Admin Router (Protected)
  api.post('/api/admin/students/import', {
    schema: schemas.adminImportStudentsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: importStudentsHandler,
  });
  api.get('/api/admin/students', {
    schema: schemas.adminGetStudentsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: getStudentsHandler,
  });
  api.post('/api/admin/students/:id/suspend', {
    schema: schemas.adminSuspendStudentSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: suspendStudentHandler,
  });
  api.post('/api/admin/students/:id/reset-password', {
    schema: schemas.adminResetStudentPasswordSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: resetStudentPasswordHandler,
  });
  api.delete('/api/admin/students/:id', {
    schema: schemas.adminDeleteStudentSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: deleteStudentHandler,
  });
  api.post('/api/admin/students/:id/enroll', {
    schema: schemas.adminEnrollStudentSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: enrollStudentHandler,
  });
  api.get('/api/admin/students/export', {
    schema: schemas.adminExportStudentsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: exportStudentsHandler,
  });
  api.post('/api/admin/students', {
    schema: schemas.adminAddStudentSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: addStudentHandler,
  });
  api.post('/api/admin/students/bulk-enroll', {
    schema: schemas.adminBulkEnrollStudentsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: bulkEnrollStudentsHandler,
  });
  api.post('/api/admin/students/revoke', {
    schema: schemas.adminRevokeCourseAccessSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: revokeCourseAccessHandler,
  });
  api.post('/api/admin/students/message', {
    schema: schemas.adminSendMessageSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: sendMessageToStudentHandler,
  });

  // 8.5 Admin Payments Router (Protected)
  api.get('/api/admin/payments', {
    schema: schemas.adminGetPaymentsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: getPaymentsHandler,
  });
  api.post('/api/admin/payments/:id/refund', {
    schema: schemas.adminRefundPaymentSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: issueRefundHandler,
  });
  api.get('/api/admin/payments/export', {
    schema: schemas.adminExportPaymentsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: exportPaymentsHandler,
  });

  // 8.6 Admin Site Settings Router (Protected)
  api.get('/api/admin/settings', {
    schema: schemas.adminGetSettingsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: getSiteSettingsHandler,
  });
  api.put('/api/admin/settings', {
    schema: schemas.adminUpdateSettingsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: updateSiteSettingsHandler,
  });

  // 9. Admin Content Management Router (Protected)
  api.post('/api/admin/courses/:id/modules', {
    schema: schemas.adminCreateModuleSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: createModuleHandler,
  });
  api.put('/api/admin/modules/:id', {
    schema: schemas.adminUpdateModuleSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: updateModuleHandler,
  });
  api.delete('/api/admin/modules/:id', {
    schema: schemas.adminDeleteModuleSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: deleteModuleHandler,
  });
  api.post('/api/admin/modules/:moduleId/lessons', {
    schema: schemas.adminCreateLessonSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: createLessonHandler,
  });
  api.put('/api/admin/lessons/:id', {
    schema: schemas.adminUpdateLessonSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: updateLessonHandler,
  });
  api.delete('/api/admin/lessons/:id', {
    schema: schemas.adminDeleteLessonSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: deleteLessonHandler,
  });
  api.put('/api/admin/lessons/:id/upload', {
    schema: schemas.adminUploadLessonFileSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: uploadLessonFileHandler,
  });

  // 10. Admin Quiz Management Router (Protected)
  api.post('/api/admin/quizzes', {
    schema: schemas.adminCreateQuizSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: createQuizHandler,
  });
  api.put('/api/admin/quizzes/:id', {
    schema: schemas.adminUpdateQuizSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: updateQuizHandler,
  });
  api.delete('/api/admin/quizzes/:id', {
    schema: schemas.adminDeleteQuizSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: deleteQuizHandler,
  });
  api.post('/api/admin/quizzes/:id/questions', {
    schema: schemas.adminCreateQuestionSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: createQuestionHandler,
  });
  api.put('/api/admin/questions/:questionId', {
    schema: schemas.adminUpdateQuestionSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: updateQuestionHandler,
  });
  api.delete('/api/admin/questions/:questionId', {
    schema: schemas.adminDeleteQuestionSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: deleteQuestionHandler,
  });

  // 11. Admin Analytics Router (Protected)
  api.get('/api/admin/analytics/dashboard', {
    schema: schemas.adminGetAnalyticsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: getDashboardAnalyticsHandler,
  });
  api.get('/api/admin/analytics/courses/:courseId', {
    schema: schemas.getCourseAnalyticsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: getCourseAnalyticsHandler,
  });

  // 12. Admin Content Reorder Router (Protected)
  api.put('/api/admin/modules/:moduleId/reorder-lessons', {
    schema: schemas.reorderLessonsSchema,
    preHandler: [verifyJWT, checkRole(['ADMIN', 'DEVELOPER'])],
    handler: reorderLessonsHandler,
  });

  // 13. Developer Feature Flags Router (Protected)
  api.get('/api/dev/feature-flags', {
    schema: schemas.getFeatureFlagsSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getFeatureFlagsHandler,
  });
  api.post('/api/dev/feature-flags/toggle', {
    schema: schemas.toggleFeatureFlagSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: toggleFeatureFlagHandler,
  });

  // 14. Developer Cache Inspector Router (Protected)
  api.get('/api/dev/cache', {
    schema: schemas.getCacheKeysSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getCacheKeysHandler,
  });
  api.delete('/api/dev/cache/:key', {
    schema: schemas.deleteCacheKeySchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: deleteCacheKeyHandler,
  });

  // 15. Developer Payment Reconciliation Router (Protected)
  api.get('/api/dev/reconciliation', {
    schema: schemas.getReconciliationSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getReconciliationReportHandler,
  });

  // 16. Developer Queue Monitor Router (Protected)
  api.get('/api/dev/queue', {
    schema: schemas.getQueueMonitorSchema,
    preHandler: [verifyJWT, checkRole(['DEVELOPER'])],
    handler: getQueueMonitorHandler,
  });
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
    swagger: server.swagger()
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
