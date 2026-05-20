import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { serverEnv } from '../../config';

// Helper to parse optional auth token for guest/logged-in access differences
const getOptionalUser = (request: FastifyRequest) => {
  const activeToken = request.cookies.impersonationToken || request.cookies.token;
  if (!activeToken) return null;
  try {
    return jwt.verify(activeToken, serverEnv.JWT_SECRET) as {
      userId: string;
      role: 'STUDENT' | 'ADMIN' | 'DEVELOPER';
    };
  } catch (err) {
    return null;
  }
};

// 1. GET ALL COURSES (Multilingual, accepts Accept-Language)
export const getCoursesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const requestedLocale = (request.headers['accept-language'] || 'en')
    .split(',')[0]
    .trim()
    .substring(0, 2);

  const currentUser = getOptionalUser(request);

  try {
    // 1. Query courses
    const allCourses = await db.select().from(schema.courses);

    // 2. Fetch translations for requested locale and fallback English ('en')
    const translations = await db.select().from(schema.courseTranslations);

    // 3. Fetch successful orders if user is logged in
    let userOrders: any[] = [];
    if (currentUser) {
      userOrders = await db
        .select()
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.userId, currentUser.userId),
            eq(schema.orders.status, 'SUCCESS')
          )
        );
    }

    // 4. Map and assemble courses with correct translation fallback
    const resolvedCourses = allCourses.map((course) => {
      // Find matching translation
      let trans = translations.find(
        (t) => t.courseId === course.id && t.locale === requestedLocale
      );
      if (!trans) {
        // Fallback to English
        trans = translations.find(
          (t) => t.courseId === course.id && t.locale === 'en'
        );
      }

      // Check if unlocked
      const hasPurchased = userOrders.some((o) => o.courseId === course.id);
      const isUnlocked =
        !course.isPremium ||
        hasPurchased ||
        (currentUser && ['ADMIN', 'DEVELOPER'].includes(currentUser.role));

      return {
        id: course.id,
        cefrLevel: course.cefrLevel,
        price: parseFloat(course.price),
        isPremium: course.isPremium,
        isUnlocked: !!isUnlocked,
        title: trans ? trans.title : 'Untitled Course',
        description: trans ? trans.description : '',
      };
    });

    reply.status(200).send(resolvedCourses);
  } catch (error) {
    console.error('❌ Error loading courses catalog:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not fetch courses' });
  }
};

// 2. GET COURSE BY ID (Detailed syllabus, secures premium asset file paths)
export const getCourseByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const requestedLocale = (request.headers['accept-language'] || 'en')
    .split(',')[0]
    .trim()
    .substring(0, 2);

  const currentUser = getOptionalUser(request);

  try {
    // 1. Fetch course details
    const coursesFound = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
    if (coursesFound.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      return;
    }
    const course = coursesFound[0];

    // 2. Get course translation
    const cTranslations = await db.select().from(schema.courseTranslations).where(eq(schema.courseTranslations.courseId, id));
    let courseTrans = cTranslations.find((t) => t.locale === requestedLocale) || cTranslations.find((t) => t.locale === 'en');

    // 3. Check access permissions
    let isUnlocked = false;
    if (!course.isPremium) {
      isUnlocked = true;
    } else if (currentUser) {
      if (['ADMIN', 'DEVELOPER'].includes(currentUser.role)) {
        isUnlocked = true;
      } else {
        const ordersFound = await db
          .select()
          .from(schema.orders)
          .where(
            and(
              eq(schema.orders.userId, currentUser.userId),
              eq(schema.orders.courseId, id),
              eq(schema.orders.status, 'SUCCESS')
            )
          )
          .limit(1);
        isUnlocked = ordersFound.length > 0;
      }
    }

    // 4. Fetch modules and lessons
    const courseModules = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.courseId, id));

    const moduleIds = courseModules.map((m) => m.id);

    let allLessons: any[] = [];
    let mTranslations: any[] = [];
    let lTranslations: any[] = [];

    if (moduleIds.length > 0) {
      // Fetch modules translation
      mTranslations = await db.select().from(schema.moduleTranslations);

      // Fetch lessons
      allLessons = await db.select().from(schema.lessons);

      // Fetch lesson translations
      lTranslations = await db.select().from(schema.lessonTranslations);
    }

    // 5. Build hierarchy tree
    const syllabusModules = courseModules
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((mod) => {
        // Resolve module translation
        let mTrans = mTranslations.find((t) => t.moduleId === mod.id && t.locale === requestedLocale) ||
                     mTranslations.find((t) => t.moduleId === mod.id && t.locale === 'en');

        // Resolve lessons under this module
        const moduleLessons = allLessons
          .filter((les) => les.moduleId === mod.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((les) => {
            let lTrans = lTranslations.find((t) => t.lessonId === les.id && t.locale === requestedLocale) ||
                         lTranslations.find((t) => t.lessonId === les.id && t.locale === 'en');

            return {
              id: les.id,
              orderIndex: les.orderIndex,
              title: lTrans ? lTrans.title : 'Untitled Lesson',
              summary: lTrans ? lTrans.summary : '',
              // Safeguard PDF filePath if premium course is locked
              filePath: isUnlocked ? les.filePath : null,
            };
          });

        return {
          id: mod.id,
          orderIndex: mod.orderIndex,
          title: mTrans ? mTrans.title : 'Untitled Module',
          lessons: moduleLessons,
        };
      });

    reply.status(200).send({
      id: course.id,
      cefrLevel: course.cefrLevel,
      price: parseFloat(course.price),
      isPremium: course.isPremium,
      isUnlocked,
      title: courseTrans ? courseTrans.title : 'Untitled Course',
      description: courseTrans ? courseTrans.description : '',
      modules: syllabusModules,
    });
  } catch (error) {
    console.error('❌ Error fetching syllabus details:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not fetch syllabus' });
  }
};

// 3. PURCHASE COURSE (Mock checkout integration)
export const purchaseCourseHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Requires authentication check (verifyJWT must run first)
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'User context is missing' });
    return;
  }

  const { id } = request.params as { id: string };
  const { simulatedStatus } = (request.body as { simulatedStatus?: 'SUCCESS' | 'FAILED' }) || {};

  try {
    // 1. Fetch target course to assert existence and get pricing details
    const coursesFound = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
    if (coursesFound.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      return;
    }
    const course = coursesFound[0];

    // If course is not premium, it doesn't need to be purchased
    if (!course.isPremium) {
      reply.status(400).send({ error: 'Bad Request', message: 'This course is free and unlocked for all students' });
      return;
    }

    // Check if already purchased
    const existingOrders = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.userId, request.user.userId),
          eq(schema.orders.courseId, id),
          eq(schema.orders.status, 'SUCCESS')
        )
      )
      .limit(1);

    if (existingOrders.length > 0) {
      reply.status(400).send({ error: 'Bad Request', message: 'You have already purchased this course' });
      return;
    }

    const orderStatus = simulatedStatus === 'FAILED' ? 'FAILED' : 'SUCCESS';
    const transactionId = 'mock_tx_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // 2. Create the order record
    const [newOrder] = await db
      .insert(schema.orders)
      .values({
        userId: request.user.userId,
        courseId: id,
        status: orderStatus,
        transactionId,
        amount: course.price,
      })
      .returning();

    // 3. Audit trail log
    await db.insert(schema.auditLogs).values({
      userId: request.user.userId,
      impersonatedBy: request.user.impersonatedBy,
      action: 'COURSE_PURCHASE_SIMULATION',
      details: `Simulated checkout completed with status ${orderStatus} for course ID ${id}. Transaction: ${transactionId}`,
      ipAddress: request.ip,
    });

    if (orderStatus === 'SUCCESS') {
      reply.status(200).send({
        success: true,
        orderId: newOrder.id,
        status: 'SUCCESS',
        message: 'Course successfully unlocked',
      });
    } else {
      reply.status(400).send({
        success: false,
        orderId: newOrder.id,
        status: 'FAILED',
        message: 'Simulated payment failed',
      });
    }
  } catch (error) {
    console.error('❌ Error handling course purchase:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Checkout simulation failed' });
  }
};

// 4. CREATE COURSE (Admin/Developer only)
export const createCourseHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
    reply.status(403).send({ error: 'Forbidden', message: 'Insufficient privileges' });
    return;
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

    reply.status(201).send({
      success: true,
      message: 'Course created successfully',
      course: {
        id: newCourse.id,
        cefrLevel: newCourse.cefrLevel,
        price: parseFloat(newCourse.price),
        isPremium: newCourse.isPremium,
        title,
        description,
      },
    });
  } catch (error) {
    console.error('❌ Error creating course:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not create course' });
  }
};

// 5. UPDATE COURSE (Admin/Developer only)
export const updateCourseHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
    reply.status(403).send({ error: 'Forbidden', message: 'Insufficient privileges' });
    return;
  }

  const { id } = request.params as { id: string };
  const { cefrLevel, price, isPremium, title, description, locale } = request.body as {
    cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    price?: number;
    isPremium?: boolean;
    title?: string;
    description?: string;
    locale?: string;
  };

  const targetLocale = locale || 'en';

  try {
    // 1. Update courses table
    const courseUpdates: any = {
      updatedAt: new Date(),
    };
    if (cefrLevel !== undefined) courseUpdates.cefrLevel = cefrLevel;
    if (price !== undefined) courseUpdates.price = String(price);
    if (isPremium !== undefined) courseUpdates.isPremium = isPremium;

    const [updatedCourse] = await db
      .update(schema.courses)
      .set(courseUpdates)
      .where(eq(schema.courses.id, id))
      .returning();

    if (!updatedCourse) {
      reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      return;
    }

    // 2. Update translation
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

    reply.status(200).send({
      success: true,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating course:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not update course' });
  }
};

// 6. DELETE COURSE (Admin/Developer only)
export const deleteCourseHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
    reply.status(403).send({ error: 'Forbidden', message: 'Insufficient privileges' });
    return;
  }

  const { id } = request.params as { id: string };

  try {
    const [deletedCourse] = await db
      .delete(schema.courses)
      .where(eq(schema.courses.id, id))
      .returning();

    if (!deletedCourse) {
      reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      return;
    }

    await db.insert(schema.auditLogs).values({
      userId: request.user.userId,
      impersonatedBy: request.user.impersonatedBy,
      action: 'COURSE_DELETE',
      details: `Deleted course ID ${id}`,
      ipAddress: request.ip,
    });

    reply.status(200).send({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not delete course' });
  }
};

