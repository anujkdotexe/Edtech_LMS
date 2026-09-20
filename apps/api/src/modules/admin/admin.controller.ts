import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';
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
      reply.status(200).send(students);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async addStudent(request: FastifyRequest<{ Body: CreateStudentDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const result = await AdminService.addStudent(request.body, adminUserId);
      reply.status(201).send({
        success: true,
        student: result.student,
        tempPassword: result.tempPassword,
        message: 'Student created successfully',
      });
    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS') {
        return reply.status(409).send({ error: 'Conflict', message: 'A student with this email already exists' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async bulkEnrollStudents(request: FastifyRequest<{ Body: BulkEnrollDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { count } = await AdminService.bulkEnroll(request.body, adminUserId);
      reply.status(200).send({ success: true, enrolledCount: count, message: `Successfully enrolled ${count} students` });
    } catch (error: any) {
      if (error.message === 'COURSE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async revokeCourseAccess(request: FastifyRequest<{ Body: RevokeCourseDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { count } = await AdminService.revokeCourse(request.body, adminUserId);
      if (count === 0) {
        return reply.status(404).send({ error: 'Not Found', message: 'Active enrollment not found for this student and course' });
      }
      reply.status(200).send({ success: true, message: 'Course access revoked successfully' });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async sendMessageToStudent(request: FastifyRequest<{ Body: SendMessageDto }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      await AdminService.sendMessage(request.body, adminUserId);
      reply.status(200).send({ success: true, message: 'Message logged and queued for delivery' });
    } catch (error: any) {
      if (error.message === 'STUDENT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async exportStudents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const csv = await AdminService.exportStudentsCsv();
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename=students_export.csv')
        .status(200)
        .send(csv);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async suspendStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { isSuspended } = await AdminService.suspendStudent(request.params.id, adminUserId);
      reply.status(200).send({
        success: true,
        message: isSuspended ? 'Student suspended successfully' : 'Student activated successfully',
        isSuspended,
      });
    } catch (error: any) {
      if (error.message === 'STUDENT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async resetStudentPassword(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      const { tempPassword } = await AdminService.resetStudentPassword(request.params.id, adminUserId);
      reply.status(200).send({
        success: true,
        tempPassword,
        message: `Password reset successfully. Temporary password: ${tempPassword}`,
      });
    } catch (error: any) {
      if (error.message === 'STUDENT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async deleteStudent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      await AdminService.deleteStudent(request.params.id, adminUserId);
      reply.status(200).send({ success: true, message: 'Student account and progress deleted permanently' });
    } catch (error: any) {
      if (error.message === 'STUDENT_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
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
      reply.status(200).send({ success: true, message: 'Student enrolled successfully' });
    } catch (error: any) {
      if (error.message === 'COURSE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async importStudents(request: FastifyRequest, reply: FastifyReply) {
    try {
      let studentsList: Array<{ name: string; email: string }> = [];
      if (request.body && typeof request.body === 'object' && Array.isArray((request.body as any).students)) {
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

      reply.status(200).send({
        success: true,
        importedCount,
        message: 'Credentials printed to standard system logs. Force-reset scheduled.',
      });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error', message: 'Bulk student onboarding failed' });
    }
  }

  // ─── Payments ─────────────────────────────────────────────────────────────
  static async getPayments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payments = await AdminService.getPayments();
      reply.status(200).send(payments);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async issueRefund(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const adminUserId = request.user!.userId;
      await AdminService.issueRefund(request.params.id, adminUserId);
      reply.status(200).send({ success: true, message: 'Refund issued successfully' });
    } catch (error: any) {
      if (error.message === 'ORDER_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Order not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async exportPayments(request: FastifyRequest, reply: FastifyReply) {
    try {
      const csv = await AdminService.exportPaymentsCsv();
      reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename=revenue_export.csv')
        .status(200)
        .send(csv);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  static async getSiteSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await AdminService.getSettings();
      reply.status(200).send(settings);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getPublicSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      const settings = await AdminService.getSettings();
      reply.status(200).send(settings);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateSiteSettings(request: FastifyRequest<{ Body: UpdateSiteSettingsDto }>, reply: FastifyReply) {
    try {
      const settings = await AdminService.updateSettings(request.body);
      reply.status(200).send(settings);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  // ─── Analytics ────────────────────────────────────────────────────────────
  static async getDashboardAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const analytics = await AdminService.getDashboardAnalytics();
      reply.status(200).send(analytics);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getCourseAnalytics(request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) {
    try {
      const analytics = await AdminService.getCourseAnalytics(request.params.courseId);
      reply.status(200).send(analytics);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  // ─── Content ──────────────────────────────────────────────────────────────
  static async createModule(request: FastifyRequest<{ Params: { id: string }; Body: { title: string; orderIndex?: number; locale?: string } }>, reply: FastifyReply) {
    try {
      const courseId = request.params.id;
      const { title, orderIndex, locale = 'en' } = request.body;
      const newMod = await AdminService.createModule({ courseId, title, orderIndex, locale });
      reply.status(201).send({ success: true, moduleId: newMod.id });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateModule(request: FastifyRequest<{ Params: { id: string }; Body: UpdateModuleDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateModule(request.params.id, request.body);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async deleteModule(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteModule(request.params.id);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async createLesson(request: FastifyRequest<{ Params: { id: string }; Body: Omit<CreateLessonDto, 'moduleId'> }>, reply: FastifyReply) {
    try {
      const moduleId = request.params.id;
      const newLesson = await AdminService.createLesson({ moduleId, ...request.body });
      reply.status(201).send({ success: true, lessonId: newLesson.id });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateLesson(request: FastifyRequest<{ Params: { id: string }; Body: UpdateLessonDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateLesson(request.params.id, request.body);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async deleteLesson(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteLesson(request.params.id);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async uploadLessonFile(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'Bad Request', message: 'No file uploaded' });
      }
      const { filePath } = await AdminService.uploadLessonFile(request.params.id, data);
      reply.status(200).send({ success: true, filePath });
    } catch (error: any) {
      if (error.message === 'LESSON_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Lesson not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error', message: 'File upload failed' });
    }
  }

  static async reorderLessons(
    request: FastifyRequest<{ Params: { id: string }; Body: { orderedLessonIds: string[] } }>,
    reply: FastifyReply
  ) {
    try {
      const { count } = await AdminService.reorderLessons(request.params.id, request.body.orderedLessonIds);
      reply.status(200).send({ success: true, message: `Reordered ${count} lessons successfully` });
    } catch (error: any) {
      if (error.message === 'MODULE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Not Found', message: 'Module not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  // ─── Quizzes ──────────────────────────────────────────────────────────────
  static async getQuizDetails(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const locale = (request.headers['accept-language'] || 'en').split(',')[0].trim().substring(0, 2);
      const quiz = await AdminService.getQuizDetails(request.params.id, locale);
      reply.status(200).send(quiz);
    } catch (error: any) {
      if (error?.name === 'NotFoundError' || error?.statusCode === 404) {
        return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: error.message || 'Quiz not found' });
      }
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async createQuiz(request: FastifyRequest<{ Body: CreateQuizDto }>, reply: FastifyReply) {
    try {
      const newQuiz = await AdminService.createQuiz(request.body);
      reply.status(201).send({ success: true, quizId: newQuiz.id });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateQuiz(request: FastifyRequest<{ Params: { id: string }; Body: UpdateQuizDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateQuiz(request.params.id, request.body);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async deleteQuiz(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteQuiz(request.params.id);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async createQuestion(request: FastifyRequest<{ Params: { id: string }; Body: Omit<CreateQuestionDto, 'quizId'> }>, reply: FastifyReply) {
    try {
      const quizId = request.params.id;
      const newQuestion = await AdminService.createQuestion({ quizId, ...request.body });
      reply.status(201).send({ success: true, questionId: newQuestion.id });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async updateQuestion(request: FastifyRequest<{ Params: { id: string }; Body: UpdateQuestionDto }>, reply: FastifyReply) {
    try {
      await AdminService.updateQuestion(request.params.id, request.body);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async deleteQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await AdminService.deleteQuestion(request.params.id);
      reply.status(200).send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}
