import { QuizzesRepository } from './quizzes.repository';
import { NotFoundError, ValidationError } from '../../errors';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { QuizSummary, QuizDetail, QuizSubmissionAnswer, QuizResult } from './quizzes.types';

export class QuizzesService {
  static async getAllQuizzes(requestedLocale = 'en'): Promise<QuizSummary[]> {
    const allQuizzes = await QuizzesRepository.findAllQuizzes();
    const qTranslations = await QuizzesRepository.findQuizTranslations();

    return allQuizzes.map((quiz) => {
      const trans =
        qTranslations.find((t) => t.quizId === quiz.id && t.locale === requestedLocale) ||
        qTranslations.find((t) => t.quizId === quiz.id && t.locale === 'en');

      return {
        id: quiz.id,
        difficulty: quiz.difficulty,
        pointValue: quiz.pointValue,
        title: trans ? trans.title : 'Untitled Quiz',
        rules: trans ? trans.rules || '' : '',
      };
    });
  }

  static async getQuizQuestions(quizId: string, requestedLocale = 'en'): Promise<QuizDetail> {
    const quiz = await QuizzesRepository.findQuizById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    const qTranslations = await QuizzesRepository.findQuizTranslationsById(quizId);
    const trans =
      qTranslations.find((t) => t.locale === requestedLocale) ||
      qTranslations.find((t) => t.locale === 'en');

    const questions = await QuizzesRepository.findQuizQuestions(quizId);

    // Strictly sanitize: NEVER return correctOption to client
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

    return {
      id: quiz.id,
      difficulty: quiz.difficulty,
      pointValue: quiz.pointValue,
      title: trans ? trans.title : 'Untitled Quiz',
      rules: trans ? trans.rules || '' : '',
      questions: sanitizedQuestions,
    };
  }

  static async submitQuizAnswers(params: {
    quizId: string;
    userId: string;
    answers: QuizSubmissionAnswer[];
    ip?: string;
    impersonatedBy?: string;
  }): Promise<QuizResult> {
    const quiz = await QuizzesRepository.findQuizById(params.quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    const dbQuestions = await QuizzesRepository.findQuizQuestions(params.quizId);
    if (dbQuestions.length === 0) {
      throw new ValidationError('This quiz does not have any active questions');
    }

    let correctCount = 0;
    dbQuestions.forEach((q) => {
      const submission = params.answers.find((ans) => ans.questionId === q.id);
      if (
        submission &&
        submission.selectedOption.trim().toUpperCase() === q.correctOption.trim().toUpperCase()
      ) {
        correctCount++;
      }
    });

    const totalQuestions = dbQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;

    const xpBase = passed ? quiz.pointValue : 0;
    const xpEarned = xpBase + correctCount * 5;

    const txResult = await QuizzesRepository.submitQuizTransaction({
      userId: params.userId,
      quizId: params.quizId,
      score,
      passed,
      correctCount,
      totalQuestions,
      xpEarned,
    });

    await db.insert(schema.auditLogs).values({
      userId: params.userId,
      impersonatedBy: params.impersonatedBy,
      action: 'QUIZ_SUBMIT',
      details: `Completed quiz ID ${params.quizId}. Correct: ${correctCount}/${totalQuestions}. Score: ${score}%. Passed: ${passed}. XP Earned: ${xpEarned}.`,
      ipAddress: params.ip,
    });

    return {
      score,
      passed,
      correctCount,
      totalQuestions,
      xpEarned,
      newTotalXp: txResult.newTotalXp,
      didLevelUp: txResult.didLevelUp,
      newLevel: txResult.newLevel,
      currentStreak: txResult.currentStreak,
      badgesUnlocked: txResult.badgesUnlocked,
    };
  }
}
