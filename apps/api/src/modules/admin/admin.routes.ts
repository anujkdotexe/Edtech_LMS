import { FastifyInstance } from 'fastify';
import { verifyJWT, checkRole } from '../auth/auth.middleware';
import * as schemas from '../../schemas';
import { importStudentsHandler } from './admin.handlers';
import {
  getStudentsHandler,
  suspendStudentHandler,
  resetStudentPasswordHandler,
  deleteStudentHandler,
  enrollStudentHandler,
  exportStudentsHandler,
  addStudentHandler,
  bulkEnrollStudentsHandler,
  revokeCourseAccessHandler,
  sendMessageToStudentHandler,
} from './students.handlers';
import {
  getPaymentsHandler,
  issueRefundHandler,
  exportPaymentsHandler,
} from './payments.handlers';
import {
  getSiteSettingsHandler,
  updateSiteSettingsHandler,
} from './settings.handlers';
import {
  getDashboardAnalyticsHandler,
  getCourseAnalyticsHandler,
} from './analytics.handlers';
import {
  createModuleHandler,
  updateModuleHandler,
  deleteModuleHandler,
  createLessonHandler,
  updateLessonHandler,
  deleteLessonHandler,
  uploadLessonFileHandler,
  reorderLessonsHandler,
} from './content.handlers';
import {
  createQuizHandler,
  updateQuizHandler,
  deleteQuizHandler,
  createQuestionHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
} from './quiz.handlers';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT);
  fastify.addHook('preHandler', checkRole(['ADMIN', 'DEVELOPER']));

  // Students CRM
  fastify.post('/students/import', { schema: schemas.adminImportStudentsSchema }, importStudentsHandler);
  fastify.get('/students', { schema: schemas.adminGetStudentsSchema }, getStudentsHandler);
  fastify.post('/students', { schema: schemas.adminAddStudentSchema }, addStudentHandler);
  fastify.post('/students/bulk-enroll', { schema: schemas.adminBulkEnrollStudentsSchema }, bulkEnrollStudentsHandler);
  fastify.post('/students/revoke-course', { schema: schemas.adminRevokeCourseAccessSchema }, revokeCourseAccessHandler);
  fastify.post('/students/message', { schema: schemas.adminSendMessageSchema }, sendMessageToStudentHandler);
  fastify.get('/students/export', { schema: schemas.adminExportStudentsSchema }, exportStudentsHandler);
  fastify.post('/students/:id/suspend', { schema: schemas.adminSuspendStudentSchema }, suspendStudentHandler);
  fastify.post('/students/:id/reset-password', { schema: schemas.adminResetStudentPasswordSchema }, resetStudentPasswordHandler);
  fastify.delete('/students/:id', { schema: schemas.adminDeleteStudentSchema }, deleteStudentHandler);
  fastify.post('/students/:id/enroll', { schema: schemas.adminEnrollStudentSchema }, enrollStudentHandler);

  // Payments
  fastify.get('/payments', { schema: schemas.adminGetPaymentsSchema }, getPaymentsHandler);
  fastify.post('/payments/:id/refund', { schema: schemas.adminRefundPaymentSchema }, issueRefundHandler);
  fastify.get('/payments/export', { schema: schemas.adminExportPaymentsSchema }, exportPaymentsHandler);

  // Settings
  fastify.get('/settings', { schema: schemas.adminGetSettingsSchema }, getSiteSettingsHandler);
  fastify.put('/settings', { schema: schemas.adminUpdateSettingsSchema }, updateSiteSettingsHandler);

  // Analytics
  fastify.get('/analytics/dashboard', { schema: schemas.adminGetAnalyticsSchema }, getDashboardAnalyticsHandler);
  fastify.get('/analytics/course/:courseId', { schema: schemas.getCourseAnalyticsSchema }, getCourseAnalyticsHandler);

  // Content (Modules & Lessons)
  fastify.post('/courses/:id/modules', { schema: schemas.adminCreateModuleSchema }, createModuleHandler);
  fastify.put('/modules/:id', { schema: schemas.adminUpdateModuleSchema }, updateModuleHandler);
  fastify.delete('/modules/:id', { schema: schemas.adminDeleteModuleSchema }, deleteModuleHandler);

  fastify.post('/modules/:id/lessons', { schema: schemas.adminCreateLessonSchema }, createLessonHandler);
  fastify.put('/lessons/:id', { schema: schemas.adminUpdateLessonSchema }, updateLessonHandler);
  fastify.delete('/lessons/:id', { schema: schemas.adminDeleteLessonSchema }, deleteLessonHandler);
  fastify.post('/lessons/upload', { schema: schemas.adminUploadLessonFileSchema }, uploadLessonFileHandler);
  fastify.put('/modules/:id/lessons/reorder', { schema: schemas.reorderLessonsSchema }, reorderLessonsHandler);

  // Quiz Management
  fastify.post('/quizzes', { schema: schemas.adminCreateQuizSchema }, createQuizHandler);
  fastify.put('/quizzes/:id', { schema: schemas.adminUpdateQuizSchema }, updateQuizHandler);
  fastify.delete('/quizzes/:id', { schema: schemas.adminDeleteQuizSchema }, deleteQuizHandler);

  fastify.post('/quizzes/:id/questions', { schema: schemas.adminCreateQuestionSchema }, createQuestionHandler);
  fastify.put('/questions/:id', { schema: schemas.adminUpdateQuestionSchema }, updateQuestionHandler);
  fastify.delete('/questions/:id', { schema: schemas.adminDeleteQuestionSchema }, deleteQuestionHandler);
}
