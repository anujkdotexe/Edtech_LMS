import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { CoursesService } from './courses.service';
import { serverEnv } from '../../config';
import { handleControllerError, sendSuccess } from '../../utils/response';

function getOptionalUser(request: FastifyRequest) {
  const { impersonationToken, token: primaryToken } = request.cookies;

  if (impersonationToken) {
    try {
      return jwt.verify(impersonationToken, serverEnv.JWT_SECRET) as {
        userId: string;
        role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
        impersonatedBy?: string;
      };
    } catch {
      // Impersonation token expired or invalid: fall back to primary session
    }
  }

  if (primaryToken) {
    try {
      return jwt.verify(primaryToken, serverEnv.JWT_SECRET) as {
        userId: string;
        role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
      };
    } catch {
      return null;
    }
  }

  return null;
}

export class CoursesController {
  static async getAllCourses(request: FastifyRequest, reply: FastifyReply) {
    const requestedLocale = (request.headers['accept-language'] || 'en')
      .split(',')[0]
      .trim()
      .substring(0, 2);
    const currentUser = getOptionalUser(request);

    try {
      const courses = await CoursesService.getAllCourses(requestedLocale, currentUser);
      return sendSuccess(reply, courses);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch courses');
    }
  }

  static async getCourseById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const requestedLocale = (request.headers['accept-language'] || 'en')
      .split(',')[0]
      .trim()
      .substring(0, 2);
    const currentUser = getOptionalUser(request);

    try {
      const course = await CoursesService.getCourseById(id, requestedLocale, currentUser);
      return sendSuccess(reply, course);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not fetch course syllabus');
    }
  }

  static async completeLesson(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user?.userId;
    if (!userId) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Not authenticated' });
    }

    try {
      const result = await CoursesService.completeLesson(id, request.user!);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleControllerError(reply, error, 'Could not complete lesson');
    }
  }

  static async purchaseCourse(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User context is missing' });
    }

    const { id } = request.params as { id: string };
    const { simulatedStatus } = (request.body as { simulatedStatus?: 'SUCCESS' | 'FAILED' }) || {};

    try {
      const result = await CoursesService.purchaseCourse(
        id,
        request.user,
        simulatedStatus,
        request.ip
      );
      const statusCode = result.success ? 200 : 400;
      return sendSuccess(reply, result, statusCode);
    } catch (error) {
      return handleControllerError(reply, error, 'Checkout transaction failed');
    }
  }

  static async createCourse(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Insufficient privileges' });
    }

    const { cefrLevel, price, isPremium, title, description, locale, language } = request.body as {
      cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      price: number;
      isPremium: boolean;
      title: string;
      description: string;
      locale?: string;
      language?: string;
    };

    const targetLocale = locale || language || 'en';

    try {
      const course = await CoursesService.createCourse(
        {
          cefrLevel,
          price,
          isPremium,
          title,
          description,
          locale: targetLocale,
        },
        request.user,
        request.ip
      );

      return sendSuccess(
        reply,
        {
          success: true,
          message: 'Course created successfully',
          course,
        },
        201
      );
    } catch (error) {
      return handleControllerError(reply, error, 'Could not create course');
    }
  }

  static async updateCourse(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Insufficient privileges' });
    }

    const { id } = request.params as { id: string };
    const { cefrLevel, price, isPremium, isPublished, title, description, locale, language } = request.body as {
      cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      price?: number;
      isPremium?: boolean;
      isPublished?: boolean;
      title?: string;
      description?: string;
      locale?: string;
      language?: string;
    };

    const targetLocale = locale || language || 'en';

    try {
      await CoursesService.updateCourse(
        id,
        {
          cefrLevel,
          price,
          isPremium,
          isPublished,
          title,
          description,
          locale: targetLocale,
        },
        request.user,
        request.ip
      );

      return sendSuccess(reply, { success: true, message: 'Course updated successfully' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not update course');
    }
  }

  static async deleteCourse(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
      return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message: 'Insufficient privileges' });
    }

    const { id } = request.params as { id: string };

    try {
      await CoursesService.deleteCourse(id, request.user, request.ip);
      return sendSuccess(reply, { success: true, message: 'Course deleted successfully' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete course');
    }
  }
}
