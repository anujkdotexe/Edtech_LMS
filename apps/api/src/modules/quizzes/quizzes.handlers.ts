import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

// Standard Badge Registry definitions
const BADGE_REGISTRY = [
  { id: 'scholar_1', name: 'First Steps Scholar', description: 'Passed your first language quiz!' },
  { id: 'streak_3', name: 'Dedicated Learner', description: 'Maintained a 3-day learning streak!' },
  { id: 'level_5', name: 'Fluent Speaker', description: 'Reached Level 5!' },
  { id: 'perfect_100', name: 'Perfect Score Master', description: 'Scored a flawless 100% on a quiz!' },
  { id: 'streak_7', name: 'Unstoppable Habit', description: 'Achieved an amazing 7-day learning streak!' },
  { id: 'level_10', name: 'Grandmaster Linguist', description: 'Reached Level 10 of language mastery!' },
  { id: 'scholar_5', name: 'Academic Elite', description: 'Successfully passed 5 or more distinct quizzes!' },
];

// 1. GET ALL QUIZZES (multilingual metadata catalog)
export const getQuizzesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const requestedLocale = (request.headers['accept-language'] || 'en')
    .split(',')[0]
    .trim()
    .substring(0, 2);

  try {
    const allQuizzes = await db.select().from(schema.quizzes);
    const qTranslations = await db.select().from(schema.quizTranslations);

    const resolvedQuizzes = allQuizzes.map((quiz) => {
      let trans = qTranslations.find((t) => t.quizId === quiz.id && t.locale === requestedLocale) ||
                  qTranslations.find((t) => t.quizId === quiz.id && t.locale === 'en');

      return {
        id: quiz.id,
        difficulty: quiz.difficulty,
        pointValue: quiz.pointValue,
        title: trans ? trans.title : 'Untitled Quiz',
        rules: trans ? trans.rules : '',
      };
    });

    reply.status(200).send(resolvedQuizzes);
  } catch (error) {
    console.error('[ERROR] Error fetching quizzes:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not fetch quizzes' });
  }
};

// 2. GET QUIZ DETAILS & QUESTIONS (hides answers from payload)
export const getQuizQuestionsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Requires authentication check (verifyJWT must run first)
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'User context is missing' });
    return;
  }

  const { id } = request.params as { id: string };
  const requestedLocale = (request.headers['accept-language'] || 'en')
    .split(',')[0]
    .trim()
    .substring(0, 2);

  try {
    // 1. Find the quiz
    const quizzesFound = await db.select().from(schema.quizzes).where(eq(schema.quizzes.id, id)).limit(1);
    if (quizzesFound.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'Quiz not found' });
      return;
    }
    const quiz = quizzesFound[0];

    // 2. Resolve translations
    const qTranslations = await db.select().from(schema.quizTranslations).where(eq(schema.quizTranslations.quizId, id));
    let trans = qTranslations.find((t) => t.locale === requestedLocale) || qTranslations.find((t) => t.locale === 'en');

    // 3. Fetch questions
    const questions = await db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, id));

    // 4. Secure the question payloads (omit correctOption to prevent inspect-element leaks)
    const sanitizedQuestions = questions
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        orderIndex: q.orderIndex,
      }));

    reply.status(200).send({
      id: quiz.id,
      difficulty: quiz.difficulty,
      pointValue: quiz.pointValue,
      title: trans ? trans.title : 'Untitled Quiz',
      rules: trans ? trans.rules : '',
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('❌ Error loading quiz questions:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Could not fetch quiz questions' });
  }
};

// 3. SUBMIT QUIZ ANSWERS & COMPUTE REWARDS (Transaction-Safe Gamification Pipeline)
export const submitQuizAnswersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Requires authentication check (verifyJWT must run first)
  if (!request.user) {
    reply.status(401).send({ error: 'Unauthorized', message: 'User context is missing' });
    return;
  }

  const { id } = request.params as { id: string };
  const { answers } = (request.body as { answers?: Array<{ questionId: string; selectedOption: string }> }) || {};

  if (!answers || !Array.isArray(answers)) {
    reply.status(400).send({ error: 'Bad Request', message: 'Submissions answers list is required' });
    return;
  }

  try {
    // 1. Fetch quiz parameters
    const quizzesFound = await db.select().from(schema.quizzes).where(eq(schema.quizzes.id, id)).limit(1);
    if (quizzesFound.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'Quiz not found' });
      return;
    }
    const quiz = quizzesFound[0];

    // 2. Fetch quiz questions containing correct keys
    const dbQuestions = await db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, id));

    if (dbQuestions.length === 0) {
      reply.status(400).send({ error: 'Bad Request', message: 'This quiz does not have any active questions' });
      return;
    }

    // 3. Score evaluation
    let correctCount = 0;
    dbQuestions.forEach((q) => {
      const submission = answers.find((ans) => ans.questionId === q.id);
      if (submission && submission.selectedOption.toUpperCase() === q.correctOption.toUpperCase()) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / dbQuestions.length) * 100);
    const passed = score >= 70; // 70% passing threshold standard

    // 4. Calculate earned XP
    // XP math: If passed, award quiz pointValue (default 50) + 5 XP per correct answer.
    // If failed, award consolation prize of 5 XP per correct answer.
    const xpBase = passed ? quiz.pointValue : 0;
    const xpEarned = xpBase + correctCount * 5;

    // Output variables initialized
    let newTotalXp = 0;
    let didLevelUp = false;
    let newLevel = 1;
    let finalStreak = 0;
    const unlockedBadgesThisAttempt: Array<{ badgeId: string; name: string }> = [];

    // 5. Execute dynamic XP, Streak, and Badge sweep updates inside a single database transaction
    await db.transaction(async (tx) => {
      const userId = request.user!.userId;

      // A. Fetch current statistics
      const xpRecord = await tx.select().from(schema.userXp).where(eq(schema.userXp.userId, userId)).limit(1);
      const streakRecord = await tx.select().from(schema.userStreaks).where(eq(schema.userStreaks.userId, userId)).limit(1);
      const userBadgesList = await tx.select().from(schema.userBadges).where(eq(schema.userBadges.userId, userId));

      // B. Update XP & levels
      const currentXp = xpRecord.length > 0 ? xpRecord[0].totalXp : 0;
      const currentLevel = xpRecord.length > 0 ? xpRecord[0].level : 1;

      newTotalXp = currentXp + xpEarned;
      newLevel = Math.floor(newTotalXp / 250) + 1; // 250 XP per level-up
      didLevelUp = newLevel > currentLevel;

      if (xpRecord.length > 0) {
        await tx
          .update(schema.userXp)
          .set({ totalXp: newTotalXp, level: newLevel, updatedAt: new Date() })
          .where(eq(schema.userXp.userId, userId));
      } else {
        await tx.insert(schema.userXp).values({ userId, totalXp: newTotalXp, level: newLevel });
      }

      // C. Update Streaks (Timezone-agnostic local day-based streaks)
      const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
      let currentStreak = streakRecord.length > 0 ? streakRecord[0].currentStreak : 0;
      let longestStreak = streakRecord.length > 0 ? streakRecord[0].longestStreak : 0;
      const lastActiveDate = streakRecord.length > 0 ? streakRecord[0].lastActiveDate : null;

      if (!lastActiveDate) {
        // First active day
        currentStreak = 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (lastActiveDate === todayStr) {
        // Already active today, streak doesn't change
      } else {
        // Compare dates
        const lastDateObj = new Date(lastActiveDate);
        const todayDateObj = new Date(todayStr);
        const timeDiff = todayDateObj.getTime() - lastDateObj.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (diffDays === 1) {
          // Consecutive active day
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          // Streak broken (> 1 day idle)
          currentStreak = 1;
        }
      }

      finalStreak = currentStreak;

      if (streakRecord.length > 0) {
        await tx
          .update(schema.userStreaks)
          .set({
            currentStreak,
            longestStreak,
            lastActiveDate: todayStr,
            updatedAt: new Date(),
          })
          .where(eq(schema.userStreaks.userId, userId));
      } else {
        await tx.insert(schema.userStreaks).values({
          userId,
          currentStreak,
          longestStreak,
          lastActiveDate: todayStr,
        });
      }

      // D. Insert Quiz Attempt Record
      await tx.insert(schema.quizAttempts).values({
        userId,
        quizId: id,
        score,
        passed,
      });

      // E. Unlocking Badge Sweep Sweeper
      const alreadyEarnedIds = userBadgesList.map((b) => b.badgeId);

      const passedAttempts = await tx
        .select()
        .from(schema.quizAttempts)
        .where(
          and(
            eq(schema.quizAttempts.userId, userId),
            eq(schema.quizAttempts.passed, true)
          )
        );

      const uniqueQuizIdsPassed = new Set(passedAttempts.map((a) => a.quizId));
      if (passed) {
        uniqueQuizIdsPassed.add(id);
      }
      const passedCount = uniqueQuizIdsPassed.size;

      for (const badge of BADGE_REGISTRY) {
        if (alreadyEarnedIds.includes(badge.id)) continue;

        let shouldUnlock = false;

        if (badge.id === 'scholar_1' && passed) {
          // Successful quiz completed
          shouldUnlock = true;
        } else if (badge.id === 'streak_3' && currentStreak >= 3) {
          // Streak >= 3 days
          shouldUnlock = true;
        } else if (badge.id === 'level_5' && newLevel >= 5) {
          // Reached level 5
          shouldUnlock = true;
        } else if (badge.id === 'perfect_100' && score === 100 && passed) {
          // Perfect score on a passed quiz
          shouldUnlock = true;
        } else if (badge.id === 'streak_7' && currentStreak >= 7) {
          // Streak >= 7 days
          shouldUnlock = true;
        } else if (badge.id === 'level_10' && newLevel >= 10) {
          // Reached level 10
          shouldUnlock = true;
        } else if (badge.id === 'scholar_5' && passedCount >= 5) {
          // Passed >= 5 unique quizzes
          shouldUnlock = true;
        }

        if (shouldUnlock) {
          await tx.insert(schema.userBadges).values({
            userId,
            badgeId: badge.id,
          });
          unlockedBadgesThisAttempt.push({
            badgeId: badge.id,
            name: badge.name,
          });
        }
      }
    });

    // 6. Audit takeover logs
    await db.insert(schema.auditLogs).values({
      userId: request.user.userId,
      impersonatedBy: request.user.impersonatedBy,
      action: 'QUIZ_SUBMIT',
      details: `Completed quiz ID ${id}. Correct: ${correctCount}/${dbQuestions.length}. Score: ${score}%. Passed: ${passed}. XP Earned: ${xpEarned}. Unlocked Badges: ${unlockedBadgesThisAttempt.map(b => b.badgeId).join(', ') || 'None'}`,
      ipAddress: request.ip,
    });

    reply.status(200).send({
      score,
      passed,
      xpEarned,
      newTotalXp,
      didLevelUp,
      newLevel,
      currentStreak: finalStreak,
      badgesUnlocked: unlockedBadgesThisAttempt,
    });
  } catch (error) {
    console.error('[ERROR] Error processing quiz submission:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Quiz submission failed' });
  }
};
