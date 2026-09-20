// Rule: No emojis in source code. Use plain text labels like [OK], [ERROR], [INFO], [WARN].
import { FastifyRequest, FastifyReply } from 'fastify';
import { sql, count, sum, eq, avg, inArray } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export const getDashboardAnalyticsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. Total active students
    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, 'STUDENT'));

    // 2. Revenue Summary (orders with SUCCESS status)
    const [revenueResult] = await db
      .select({ totalRevenue: sum(schema.orders.amount), count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'SUCCESS'));

    // 3. Last 7 Days Signups
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const signupsQuery = sql`
      SELECT 
        DATE(DATE_TRUNC('day', ${schema.users.createdAt})) as date,
        COUNT(*) as signups
      FROM ${schema.users}
      WHERE ${schema.users.createdAt} >= ${sevenDaysAgo.toISOString()}
        AND ${schema.users.role} = 'STUDENT'
      GROUP BY DATE(DATE_TRUNC('day', ${schema.users.createdAt}))
      ORDER BY date ASC
    `;
    const signupsRaw = await db.execute(signupsQuery) as any;

    const weeklySignups = signupsRaw.rows.map((row: any) => ({
      date: new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: Number(row.signups)
    }));

    const defaultSignups = weeklySignups.length > 0 ? weeklySignups : [
      { date: 'Mon', count: 0 }, { date: 'Tue', count: 0 }, { date: 'Wed', count: 0 },
      { date: 'Thu', count: 0 }, { date: 'Fri', count: 0 }, { date: 'Sat', count: 0 }, { date: 'Sun', count: 0 }
    ];

    // 4. Streak Leaders (top 5)
    const streakLeaders = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
        streak: schema.userStreaks.currentStreak
      })
      .from(schema.userStreaks)
      .innerJoin(schema.users, eq(schema.users.id, schema.userStreaks.userId))
      .where(eq(schema.users.role, 'STUDENT'))
      .orderBy(sql`${schema.userStreaks.currentStreak} DESC`)
      .limit(5);

    // 5. Quiz Completions (count + avg score today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [quizStats] = await db
      .select({
        totalAttempts: count(),
        avgScore: avg(schema.quizAttempts.score),
      })
      .from(schema.quizAttempts);

    const [todayQuizStats] = await db
      .select({ todayCount: count() })
      .from(schema.quizAttempts)
      .where(sql`${schema.quizAttempts.attemptedAt} >= ${today.toISOString()}`);

    reply.status(200).send({
      totalStudents: totalStudentsResult.count,
      totalRevenue: Number(revenueResult.totalRevenue || 0),
      weeklySignups: defaultSignups,
      streakLeaders,
      quizCompletions: {
        total: quizStats.totalAttempts,
        today: todayQuizStats.todayCount,
        avgScore: Math.round(Number(quizStats.avgScore || 0)),
      }
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// Course Analytics: Lesson drop-off rates per course
export const getCourseAnalyticsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { courseId } = request.params as { courseId: string };
  try {
    // Get all lessons for the course (via modules)
    const lessons = await db
      .select({
        lessonId: schema.lessons.id,
        orderIndex: schema.lessons.orderIndex,
        moduleId: schema.lessons.moduleId,
      })
      .from(schema.lessons)
      .innerJoin(schema.modules, eq(schema.modules.id, schema.lessons.moduleId))
      .where(eq(schema.modules.courseId, courseId))
      .orderBy(schema.lessons.orderIndex);

    // Calculate total enrolled students for this course
    const [enrolledResult] = await db
      .select({ enrolledCount: count() })
      .from(schema.orders)
      .where(eq(schema.orders.courseId, courseId));

    const enrolledCount = enrolledResult ? Number(enrolledResult.enrolledCount) : 0;

    const lessonIds = lessons.map((l) => l.lessonId);
    let completionMap = new Map<string, number>();

    if (lessonIds.length > 0) {
      const completionsPerLesson = await db
        .select({
          lessonId: schema.lessonCompletions.lessonId,
          completionCount: count(),
        })
        .from(schema.lessonCompletions)
        .where(inArray(schema.lessonCompletions.lessonId, lessonIds))
        .groupBy(schema.lessonCompletions.lessonId);

      completionMap = new Map(
        completionsPerLesson.map((c) => [c.lessonId, Number(c.completionCount)])
      );
    }

    let prevRate = 100;
    const dropoffAnalysis = lessons.map((lesson, idx) => {
      const completionCount = completionMap.get(lesson.lessonId) || 0;
      const baseCount = Math.max(enrolledCount, completionCount, 1);
      const completionRate = Math.min(100, Math.round((completionCount / baseCount) * 100));
      const dropoffPct = idx === 0 ? 0 : Math.max(0, prevRate - completionRate);
      prevRate = completionRate;

      return {
        lessonId: lesson.lessonId,
        position: lesson.orderIndex + 1,
        completionCount,
        completionRate,
        dropoffPct,
      };
    });

    reply.status(200).send({
      courseId,
      enrolledCount,
      totalLessons: lessons.length,
      dropoffAnalysis,
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

