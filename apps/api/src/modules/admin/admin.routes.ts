import { FastifyInstance } from 'fastify';
import { verifyJWT, checkRole } from '../auth/auth.middleware';
import * as schemas from '../../schemas';
import { AdminController } from './admin.controller';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyJWT);
  fastify.addHook('preHandler', checkRole(['ADMIN', 'DEVELOPER']));

  // Students CRM
  fastify.post('/students/import', { schema: schemas.adminImportStudentsSchema }, AdminController.importStudents);
  fastify.get('/students', { schema: schemas.adminGetStudentsSchema }, AdminController.getStudents);
  fastify.post('/students', { schema: schemas.adminAddStudentSchema }, AdminController.addStudent);
  fastify.post('/students/bulk-enroll', { schema: schemas.adminBulkEnrollStudentsSchema }, AdminController.bulkEnrollStudents);
  fastify.post('/students/revoke-course', { schema: schemas.adminRevokeCourseAccessSchema }, AdminController.revokeCourseAccess);
  fastify.post('/students/message', { schema: schemas.adminSendMessageSchema }, AdminController.sendMessageToStudent);
  fastify.get('/students/export', { schema: schemas.adminExportStudentsSchema }, AdminController.exportStudents);
  fastify.post('/students/:id/suspend', { schema: schemas.adminSuspendStudentSchema }, AdminController.suspendStudent);
  fastify.post('/students/:id/reset-password', { schema: schemas.adminResetStudentPasswordSchema }, AdminController.resetStudentPassword);
  fastify.delete('/students/:id', { schema: schemas.adminDeleteStudentSchema }, AdminController.deleteStudent);
  fastify.post('/students/:id/enroll', { schema: schemas.adminEnrollStudentSchema }, AdminController.enrollStudent);

  // Payments
  fastify.get('/payments', { schema: schemas.adminGetPaymentsSchema }, AdminController.getPayments);
  fastify.post('/payments/:id/refund', { schema: schemas.adminRefundPaymentSchema }, AdminController.issueRefund);
  fastify.get('/payments/export', { schema: schemas.adminExportPaymentsSchema }, AdminController.exportPayments);

  // Settings
  fastify.get('/settings', { schema: schemas.adminGetSettingsSchema }, AdminController.getSiteSettings);
  fastify.put('/settings', { schema: schemas.adminUpdateSettingsSchema }, AdminController.updateSiteSettings);

  // Analytics
  fastify.get('/analytics/dashboard', { schema: schemas.adminGetAnalyticsSchema }, AdminController.getDashboardAnalytics);
  fastify.get('/analytics/course/:courseId', { schema: schemas.getCourseAnalyticsSchema }, AdminController.getCourseAnalytics);

  // Content (Modules & Lessons)
  fastify.post('/courses/:id/modules', { schema: schemas.adminCreateModuleSchema }, AdminController.createModule);
  fastify.put('/modules/:id', { schema: schemas.adminUpdateModuleSchema }, AdminController.updateModule);
  fastify.delete('/modules/:id', { schema: schemas.adminDeleteModuleSchema }, AdminController.deleteModule);

  fastify.post('/modules/:id/lessons', { schema: schemas.adminCreateLessonSchema }, AdminController.createLesson);
  fastify.put('/lessons/:id', { schema: schemas.adminUpdateLessonSchema }, AdminController.updateLesson);
  fastify.delete('/lessons/:id', { schema: schemas.adminDeleteLessonSchema }, AdminController.deleteLesson);
  fastify.post('/lessons/:id/upload', { schema: schemas.adminUploadLessonFileSchema }, AdminController.uploadLessonFile);
  fastify.put('/lessons/:id/upload', { schema: schemas.adminUploadLessonFileSchema }, AdminController.uploadLessonFile);
  fastify.put('/modules/:id/lessons/reorder', { schema: schemas.reorderLessonsSchema }, AdminController.reorderLessons);

  // Quiz Management
  fastify.post('/quizzes', { schema: schemas.adminCreateQuizSchema }, AdminController.createQuiz);
  fastify.put('/quizzes/:id', { schema: schemas.adminUpdateQuizSchema }, AdminController.updateQuiz);
  fastify.delete('/quizzes/:id', { schema: schemas.adminDeleteQuizSchema }, AdminController.deleteQuiz);

  fastify.post('/quizzes/:id/questions', { schema: schemas.adminCreateQuestionSchema }, AdminController.createQuestion);
  fastify.put('/questions/:id', { schema: schemas.adminUpdateQuestionSchema }, AdminController.updateQuestion);
  fastify.delete('/questions/:id', { schema: schemas.adminDeleteQuestionSchema }, AdminController.deleteQuestion);
}
