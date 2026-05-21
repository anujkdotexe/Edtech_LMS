import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

// --- QUIZ HANDLERS ---

export const createQuizHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { title, difficulty, pointValue, locale = 'en' } = request.body as {
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    pointValue: number;
    locale?: string;
  };

  try {
    const [newQuiz] = await db.insert(schema.quizzes).values({
      difficulty: difficulty || 'EASY',
      pointValue: pointValue || 50,
    }).returning();

    await db.insert(schema.quizTranslations).values({
      quizId: newQuiz.id,
      locale,
      title: title || 'Untitled Quiz',
      rules: '',
    });

    reply.status(201).send({ success: true, quizId: newQuiz.id });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateQuizHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { title, difficulty, pointValue, locale = 'en' } = request.body as {
    title?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    pointValue?: number;
    locale?: string;
  };

  try {
    const quizUpdates: any = {};
    if (difficulty) quizUpdates.difficulty = difficulty;
    if (pointValue) quizUpdates.pointValue = pointValue;
    
    if (Object.keys(quizUpdates).length > 0) {
      await db.update(schema.quizzes).set(quizUpdates).where(eq(schema.quizzes.id, id));
    }

    if (title) {
      const trans = await db.select().from(schema.quizTranslations).where(eq(schema.quizTranslations.quizId, id));
      if (trans.length > 0) {
        await db.update(schema.quizTranslations).set({ title }).where(eq(schema.quizTranslations.id, trans[0].id));
      } else {
        await db.insert(schema.quizTranslations).values({
          quizId: id,
          locale,
          title,
        });
      }
    }
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteQuizHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  try {
    await db.delete(schema.quizzes).where(eq(schema.quizzes.id, id));
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// --- QUESTION HANDLERS ---

export const createQuestionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id: quizId } = request.params as { id: string };
  const { questionText, optionA, optionB, optionC, optionD, correctOption } = request.body as {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
  };

  try {
    const existingQs = await db.select().from(schema.quizQuestions).where(eq(schema.quizQuestions.quizId, quizId));
    const orderIndex = existingQs.length;

    const [newQuestion] = await db.insert(schema.quizQuestions).values({
      quizId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      orderIndex,
    }).returning();

    reply.status(201).send({ success: true, questionId: newQuestion.id });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateQuestionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { questionId } = request.params as { questionId: string };
  const payload = request.body as any;

  try {
    await db.update(schema.quizQuestions).set(payload).where(eq(schema.quizQuestions.id, questionId));
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const deleteQuestionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { questionId } = request.params as { questionId: string };
  try {
    await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.id, questionId));
    reply.status(200).send({ success: true });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
