import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';
import { handleControllerError, sendSuccess } from '../../utils/response';
import {
  StudentFilters,
  CreateStudentDto,
  BulkEnrollDto,
  RevokeCourseDto,
  SendMessageDto,
  UpdateSiteSettingsDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
} from './admin.types';

export class AdminController {
  // ─── Students CRM ─────────────────────────────────────────────────────────
  static async getStudents(request: FastifyRequest<{ Querystring: StudentFilters }>, reply: FastifyReply) {
    try {
      const students = await AdminService.listStudents(request.query || {});
      return sendSuccess(reply, students);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch students');
    }
  }

  static async addStudent(request: FastifyRequest<{ Body: CreateStudentDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const result = await AdminService.addStudent(request.body, adminUserId);
      return reply.status(201).send({
        success: true,
        student: result.student,
        tempPassword: result.tempPassword,
        message: 'Student created successfully',
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not create student');
    }
  }

  static async bulkEnrollStudents(request: FastifyRequest<{ Body: BulkEnrollDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { count } = await AdminService.bulkEnroll(request.body, adminUserId);
      return sendSuccess(reply, { success: true, enrolledCount: count, message: `Successfully enrolled ${count} students` });
    } catch (error) {
      return handleControllerError(reply, error, 'Bulk enrollment failed');
    }
  }

  static async revokeCourseAccess(request: FastifyRequest<{ Body: RevokeCourseDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { count } = await AdminService.revokeCourse(request.body, adminUserId);
      if (count === 0) {
        return reply.status(404).send({ error: 'Not Found', message: 'Active enrollment not found for this student and course' });
      }
      return sendSuccess(reply, { success: true, message: 'Course access revoked successfully' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not revoke course access');
    }
  }

  static async sendMessageToStudent(request: FastifyRequest<{ Body: SendMessageDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      await AdminService.sendMessage(request.body, adminUserId);
      return sendSuccess(reply, { success: true, message: 'Message logged and queued for delivery' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not send message');
    }
  }

  static async exportStudents(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const csv = await AdminService.exportStudentsCsv();
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename=students_export.csv')
        .status(200)
        .send(csv);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not export students');
    }
  }

  static async suspendStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { isSuspended } = await AdminService.suspendStudent(request.params.id, adminUserId);
      return sendSuccess(reply, {
        success: true,
        message: isSuspended ? 'Student suspended successfully' : 'Student activated successfully',
        isSuspended,
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update student status');
    }
  }

  static async resetStudentPassword(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { tempPassword } = await AdminService.resetStudentPassword(request.params.id, adminUserId);
      return sendSuccess(reply, {
        success: true,
        tempPassword,
        message: `Password reset successfully. Temporary password: ${tempPassword}`,
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not reset student password');
    }
  }

  static async deleteStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      await AdminService.deleteStudent(request.params.id, adminUserId);
      return sendSuccess(reply, { success: true, message: 'Student account and progress deleted permanently' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete student');
    }
  }

  static async enrollStudent(
    request: FastifyRequest<{ Params: { id: string }; Body: { courseId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const adminUserId = request.user!.userId;
      const result = await AdminService.enrollStudent(request.params.id, request.body.courseId, adminUserId);
      if (result.alreadyEnrolled) {
        return reply.status(400).send({ error: 'Bad Request', message: 'Student is already enrolled in this course' });
      }
      return sendSuccess(reply, { success: true, message: 'Student enrolled successfully' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not enroll student');
    }
  }

  static async importStudents(request: FastifyRequest, reply: FastifyReply) {
    try {
      let studentsList: Array<{ name: string; email: string }> = [];
      if (request.body && typeof request.body === 'object' && Array.isArray((request.body as { students?: unknown }).students)) {
        studentsList = (request.body as { students: Array<{ name: string; email: string }> }).students;
      }

      if (!studentsList || studentsList.length === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: 'No student records provided in payload',
        });
      }

      const { importedCount } = await AdminService.importStudents(
        studentsList,
        request.user!.userId,
        request.user?.impersonatedBy,
        request.ip
      );

      return sendSuccess(reply, {
        success: true,
        importedCount,
        message: 'Credentials printed to standard system logs. Force-reset scheduled.',
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Bulk student onboarding failed');
    }
  }

  // ─── Payments ─────────────────────────────────────────────────────────────
  static async getPayments(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const payments = await AdminService.getPayments();
      return sendSuccess(reply, payments);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch payments');
    }
  }

  static async issueRefund(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      await AdminService.issueRefund(request.params.id, adminUserId);
      return sendSuccess(reply, { success: true, message: 'Refund issued successfully' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not issue refund');
    }
  }

  static async exportPayments(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const csv = await AdminService.exportPaymentsCsv();
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename=revenue_export.csv')
        .status(200)
        .send(csv);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not export payments');
    }
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  static async getSiteSettings(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await AdminService.getSettings();
      return sendSuccess(reply, settings);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch site settings');
    }
  }

  static async getPublicSettings(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await AdminService.getSettings();
      // Only expose non-sensitive public fields — never email templates to unauthenticated callers
      return sendSuccess(reply, {
        activeBanner: settings.activeBanner,
        bannerEnabled: settings.bannerEnabled,
        maintenanceMode: settings.maintenanceMode,
        dailyTip: settings.dailyTip,
      });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch public settings');
    }
  }

  static async updateSiteSettings(request: FastifyRequest<{ Body: UpdateSiteSettingsDto }>, reply: FastifyReply) {
    try {
      const settings = await AdminService.updateSettings(request.body);
      return sendSuccess(reply, settings);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update site settings');
    }
  }

  // ─── Analytics ────────────────────────────────────────────────────────────
  static async getDashboardAnalytics(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const analytics = await AdminService.getDashboardAnalytics();
      return sendSuccess(reply, analytics);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch dashboard analytics');
    }
  }

  static async getCourseAnalytics(request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) {
    try {
      const analytics = await AdminService.getCourseAnalytics(request.params.courseId);
      return sendSuccess(reply, analytics);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch course analytics');
    }
  }

  // ─── Content ──────────────────────────────────────────────────────────────
  static async createModule(request: FastifyRequest<{ Params: { id: string }; Body: { title: string; orderIndex?: number; locale?: string } }>, reply: FastifyReply) {
    try {
      const courseId = request.params.id;
      const { title, orderIndex, locale = 'en' } = request.body;
      const newMod = await AdminService.createModule({ courseId, title, orderIndex, locale });
      return reply.status(201).send({ success: true, moduleId: newMod.id });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not create module');
    }
  }

  static async updateModule(request: FastifyRequest<{ Params: { id: string }; Body: UpdateModuleDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateModule(request.params.id, request.body);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update module');
    }
  }

  static async deleteModule(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteModule(request.params.id);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete module');
    }
  }

  static async createLesson(request: FastifyRequest<{ Params: { id: string }; Body: Omit<CreateLessonDto, 'moduleId'> }>, reply: FastifyReply) {
    try {
      const moduleId = request.params.id;
      const newLesson = await AdminService.createLesson({ moduleId, ...request.body });
      return reply.status(201).send({ success: true, lessonId: newLesson.id });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not create lesson');
    }
  }

  static async updateLesson(request: FastifyRequest<{ Params: { id: string }; Body: UpdateLessonDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateLesson(request.params.id, request.body);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update lesson');
    }
  }

  static async deleteLesson(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteLesson(request.params.id);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete lesson');
    }
  }

  static async uploadLessonFile(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'Bad Request', message: 'No file uploaded' });
      }
      const { filePath } = await AdminService.uploadLessonFile(request.params.id, data);
      return sendSuccess(reply, { success: true, filePath });
    } catch (error) {
      return handleControllerError(reply, error, 'File upload failed');
    }
  }

  static async reorderLessons(
    request: FastifyRequest<{ Params: { id: string }; Body: { orderedLessonIds: string[] } }>,
    reply: FastifyReply
  ) {
    try {
      const { count } = await AdminService.reorderLessons(request.params.id, request.body.orderedLessonIds);
      return sendSuccess(reply, { success: true, message: `Reordered ${count} lessons successfully` });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not reorder lessons');
    }
  }

  // ─── Quizzes ──────────────────────────────────────────────────────────────
  static async getQuizDetails(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const locale = (request.headers['accept-language'] || 'en').split(',')[0].trim().substring(0, 2);
      const quiz = await AdminService.getQuizDetails(request.params.id, locale);
      return sendSuccess(reply, quiz);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch quiz');
    }
  }

  static async createQuiz(request: FastifyRequest<{ Body: CreateQuizDto }>, reply: FastifyReply) {
    try {
      const newQuiz = await AdminService.createQuiz(request.body);
      return reply.status(201).send({ success: true, quizId: newQuiz.id });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not create quiz');
    }
  }

  static async updateQuiz(request: FastifyRequest<{ Params: { id: string }; Body: UpdateQuizDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateQuiz(request.params.id, request.body);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update quiz');
    }
  }

  static async deleteQuiz(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteQuiz(request.params.id);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete quiz');
    }
  }

  static async createQuestion(request: FastifyRequest<{ Params: { id: string }; Body: Omit<CreateQuestionDto, 'quizId'> }>, reply: FastifyReply) {
    try {
      const quizId = request.params.id;
      const newQuestion = await AdminService.createQuestion({ quizId, ...request.body });
      return reply.status(201).send({ success: true, questionId: newQuestion.id });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not create question');
    }
  }

  static async updateQuestion(request: FastifyRequest<{ Params: { id: string }; Body: UpdateQuestionDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateQuestion(request.params.id, request.body);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update question');
    }
  }

  static async deleteQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteQuestion(request.params.id);
      return sendSuccess(reply, { success: true });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete question');
    }
  }
}
