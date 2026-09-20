import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { CoursesService } from './courses.service';
import { serverEnv } from '../../config';
import { handleControllerError, sendSuccess } from '../../utils/response';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';

function getOptionalUser(request: FastifyRequest) {
  const activeToken = request.cookies.impersonationToken || request.cookies.token;
  if (!activeToken) return null;
  try {
    return jwt.verify(activeToken, serverEnv.JWT_SECRET) as {
      userId: string;
      role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
      impersonatedBy?: string;
    };
  } catch {
    return null;
  }
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

    const { cefrLevel, price, isPremium, title, description, locale } = request.body as {
      cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      price: number;
      isPremium: boolean;
      title: string;
      description: string;
      locale?: string;
    };

    const targetLocale = locale || 'en';

    try {
      const [newCourse] = await db
        .insert(schema.courses)
        .values({
          cefrLevel: cefrLevel || 'A1',
          price: String(price || 0.0),
          isPremium: !!isPremium,
          isPublished: true,
        })
        .returning();

      await db.insert(schema.courseTranslations).values({
        courseId: newCourse.id,
        locale: targetLocale,
        title: title || 'Untitled Course',
        description: description || '',
      });

      await db.insert(schema.auditLogs).values({
        userId: request.user.userId,
        impersonatedBy: request.user.impersonatedBy,
        action: 'COURSE_CREATE',
        details: `Created new course "${title}" (${cefrLevel}) with price $${price}`,
        ipAddress: request.ip,
      });

      return sendSuccess(
        reply,
        {
          success: true,
          message: 'Course created successfully',
          course: {
            id: newCourse.id,
            cefrLevel: newCourse.cefrLevel,
            price: Number(newCourse.price),
            isPremium: newCourse.isPremium,
            title,
            description,
          },
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
    const { cefrLevel, price, isPremium, isPublished, title, description, locale } = request.body as {
      cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      price?: number;
      isPremium?: boolean;
      isPublished?: boolean;
      title?: string;
      description?: string;
      locale?: string;
    };

    const targetLocale = locale || 'en';

    try {
      const courseUpdates: any = { updatedAt: new Date() };
      if (cefrLevel !== undefined) courseUpdates.cefrLevel = cefrLevel;
      if (price !== undefined) courseUpdates.price = String(price);
      if (isPremium !== undefined) courseUpdates.isPremium = isPremium;
      if (isPublished !== undefined) courseUpdates.isPublished = isPublished;

      const [updatedCourse] = await db
        .update(schema.courses)
        .set(courseUpdates)
        .where(eq(schema.courses.id, id))
        .returning();

      if (!updatedCourse) {
        return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Course not found' });
      }

      if (title !== undefined || description !== undefined) {
        const existingTrans = await db
          .select()
          .from(schema.courseTranslations)
          .where(
            and(
              eq(schema.courseTranslations.courseId, id),
              eq(schema.courseTranslations.locale, targetLocale)
            )
          )
          .limit(1);

        if (existingTrans.length > 0) {
          const transUpdates: any = {};
          if (title !== undefined) transUpdates.title = title;
          if (description !== undefined) transUpdates.description = description;

          await db
            .update(schema.courseTranslations)
            .set(transUpdates)
            .where(eq(schema.courseTranslations.id, existingTrans[0].id));
        } else {
          await db.insert(schema.courseTranslations).values({
            courseId: id,
            locale: targetLocale,
            title: title || 'Untitled Course',
            description: description || '',
          });
        }
      }

      await db.insert(schema.auditLogs).values({
        userId: request.user.userId,
        impersonatedBy: request.user.impersonatedBy,
        action: 'COURSE_UPDATE',
        details: `Updated course ID ${id} details`,
        ipAddress: request.ip,
      });

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
      const [deletedCourse] = await db
        .delete(schema.courses)
        .where(eq(schema.courses.id, id))
        .returning();

      if (!deletedCourse) {
        return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Course not found' });
      }

      await db.insert(schema.auditLogs).values({
        userId: request.user.userId,
        impersonatedBy: request.user.impersonatedBy,
        action: 'COURSE_DELETE',
        details: `Deleted course ID ${id}`,
        ipAddress: request.ip,
      });

      return sendSuccess(reply, { success: true, message: 'Course deleted successfully' });
    } catch (error) {
      return handleControllerError(reply, error, 'Could not delete course');
    }
  }
}
