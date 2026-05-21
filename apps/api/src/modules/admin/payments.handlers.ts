import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

export const getPaymentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const allOrders = await db.select({
      id: schema.orders.id,
      amount: schema.orders.amount,
      status: schema.orders.status,
      transactionId: schema.orders.transactionId,
      createdAt: schema.orders.createdAt,
      studentName: schema.users.name,
      studentEmail: schema.users.email,
      courseTitle: schema.courseTranslations.title
    })
    .from(schema.orders)
    .innerJoin(schema.users, eq(schema.orders.userId, schema.users.id))
    .innerJoin(schema.courseTranslations, eq(schema.orders.courseId, schema.courseTranslations.courseId))
    .orderBy(desc(schema.orders.createdAt));

    // Deduplicate translations (using default locale logic for simplistic return)
    const uniqueOrders = allOrders.filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);

    reply.status(200).send(uniqueOrders);
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const issueRefundHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  try {
    const updated = await db.update(schema.orders)
      .set({ status: 'FAILED' }) // Mocking refund as FAILED status
      .where(eq(schema.orders.id, id))
      .returning();

    if (updated.length === 0) {
      reply.status(404).send({ error: 'Not Found', message: 'Order not found' });
      return;
    }

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_REFUND_ISSUED',
      details: `Admin issued refund for order ${id}`,
      userId: request.user!.userId
    });

    reply.status(200).send({ success: true, message: 'Refund issued successfully (mocked)' });
  } catch (error) {
    console.error('❌ Error issuing refund:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
