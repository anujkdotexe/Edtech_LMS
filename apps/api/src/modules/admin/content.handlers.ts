import { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { serverEnv } from '../../config';
import crypto from 'crypto';

// --- MODULE HANDLERS ---

export const createModuleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id: courseId } = request.params as { id: string };
  const { title, locale = 'en' } = request.body as { title: string; locale?: string };

  try {
    const courseCheck = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
    if (courseCheck.length === 0) {
      return reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
    }

    const existingModules = await db.select().from(schema.modules).where(eq(schema.modules.courseId, courseId));
    const nextOrder = existingModules.length;

    const [newModule] = await db.insert(schema.modules).values({
      courseId,
      orderIndex: nextOrder,
    }).returning();

    await db.insert(schema.moduleTranslations).values({
      moduleId: newModule.id,
      locale,
      title: title || 'Untitled Module',
    });

    reply.status(201).send({ success: true, moduleId: newModule.id });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateModuleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { title, locale = 'en' } = request.body as { title: string; locale?: string };

  try {
    const trans = await db.select().from(schema.moduleTranslations).where(eq(schema.moduleTranslations.moduleId, id));
    if (trans.length > 0) {
      await db.update(schema.moduleTranslations)
        .set({ title })
        .where(eq(schema.moduleTranslations.id, trans[0].id));
    } else {
      await db.insert(schema.moduleTranslations).values({
        moduleId: id,
        locale,
        title,
      });
    }
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteModuleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  try {
    await db.delete(schema.modules).where(eq(schema.modules.id, id));
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// --- LESSON HANDLERS ---

export const createLessonHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { moduleId } = request.params as { moduleId: string };
  const { title, summary = '', locale = 'en' } = request.body as { title: string; summary?: string; locale?: string };

  try {
    const moduleCheck = await db.select().from(schema.modules).where(eq(schema.modules.id, moduleId)).limit(1);
    if (moduleCheck.length === 0) {
      return reply.status(404).send({ error: 'Not Found', message: 'Module not found' });
    }

    const existingLessons = await db.select().from(schema.lessons).where(eq(schema.lessons.moduleId, moduleId));
    const nextOrder = existingLessons.length;

    const [newLesson] = await db.insert(schema.lessons).values({
      moduleId,
      orderIndex: nextOrder,
      filePath: '', // Will be updated on upload
    }).returning();

    await db.insert(schema.lessonTranslations).values({
      lessonId: newLesson.id,
      locale,
      title: title || 'Untitled Lesson',
      summary,
    });

    reply.status(201).send({ success: true, lessonId: newLesson.id });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateLessonHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { title, summary, locale = 'en' } = request.body as { title?: string; summary?: string; locale?: string };

  try {
    const trans = await db.select().from(schema.lessonTranslations).where(eq(schema.lessonTranslations.lessonId, id));
    if (trans.length > 0) {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (summary !== undefined) updates.summary = summary;
      
      await db.update(schema.lessonTranslations)
        .set(updates)
        .where(eq(schema.lessonTranslations.id, trans[0].id));
    } else {
      await db.insert(schema.lessonTranslations).values({
        lessonId: id,
        locale,
        title: title || 'Untitled Lesson',
        summary: summary || '',
      });
    }
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteLessonHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  try {
    await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// --- REORDER LESSONS HANDLER ---

export const reorderLessonsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { moduleId } = request.params as { moduleId: string };
  const { orderedLessonIds } = request.body as { orderedLessonIds: string[] };

  try {
    const moduleCheck = await db.select().from(schema.modules).where(eq(schema.modules.id, moduleId)).limit(1);
    if (moduleCheck.length === 0) {
      return reply.status(404).send({ error: 'Not Found', message: 'Module not found' });
    }

    // Update each lesson's orderIndex in a transaction
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedLessonIds.length; i++) {
        await tx
          .update(schema.lessons)
          .set({ orderIndex: i })
          .where(eq(schema.lessons.id, orderedLessonIds[i]));
      }
    });

    reply.status(200).send({ success: true, message: `Reordered ${orderedLessonIds.length} lessons successfully` });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// --- FILE UPLOAD HANDLER ---

export const uploadLessonFileHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Bad Request', message: 'No file uploaded' });
    }

    const lessonCheck = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id)).limit(1);
    if (lessonCheck.length === 0) {
      return reply.status(404).send({ error: 'Not Found', message: 'Lesson not found' });
    }

    // Generate unique filename
    const ext = path.extname(data.filename) || '.pdf';
    const uniqueName = `${id}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const absoluteUploadDir = path.resolve(process.cwd(), serverEnv.UPLOAD_DIR);
    const savePath = path.join(absoluteUploadDir, uniqueName);

    // Write file
    await pipeline(data.file, fs.createWriteStream(savePath));

    // Update DB record
    const publicUrl = `/public/uploads/${uniqueName}`;
    await db.update(schema.lessons).set({ filePath: publicUrl }).where(eq(schema.lessons.id, id));

    reply.status(200).send({ success: true, filePath: publicUrl });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error', message: 'File upload failed' });
  }
};
