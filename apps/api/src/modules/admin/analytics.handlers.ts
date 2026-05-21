import { FastifyRequest, FastifyReply } from 'fastify';
import { sql, count, sum, eq, and, gte } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export const getDashboardAnalyticsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. Total active students (where role is STUDENT)
    const [totalStudentsResult] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, 'STUDENT'));
    
    // 2. Revenue Summary (from orders where status is SUCCESS)
    const [revenueResult] = await db
      .select({
        totalRevenue: sum(schema.orders.amount),
        count: count()
      })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'SUCCESS'));

    // 3. Last 7 Days Signups (Mocked query for weekly aggregation in PG)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Using raw SQL for date trunc to get daily signups
    const signupsQuery = sql`
      SELECT 
        DATE(TRUNC('day', ${schema.users.createdAt})) as date,
        COUNT(*) as signups
      FROM ${schema.users}
      WHERE ${schema.users.createdAt} >= ${sevenDaysAgo.toISOString()}
        AND ${schema.users.role} = 'STUDENT'
      GROUP BY DATE(TRUNC('day', ${schema.users.createdAt}))
      ORDER BY date ASC
    `;
    const signupsRaw = await db.execute(signupsQuery) as any;
    
    // Format signups into array for the chart
    const weeklySignups = signupsRaw.rows.map((row: any) => ({
      date: new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: Number(row.signups)
    }));

    // If weeklySignups is empty, fill with default data (for aesthetic purposes if db is completely empty)
    const defaultSignups = weeklySignups.length > 0 ? weeklySignups : [
      { date: 'Mon', count: 0 }, { date: 'Tue', count: 0 }, { date: 'Wed', count: 0 },
      { date: 'Thu', count: 0 }, { date: 'Fri', count: 0 }, { date: 'Sat', count: 0 }, { date: 'Sun', count: 0 }
    ];

    // 4. Streak Leaders
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

    reply.status(200).send({
      totalStudents: totalStudentsResult.count,
      totalRevenue: Number(revenueResult.totalRevenue || 0),
      weeklySignups: defaultSignups,
      streakLeaders
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
