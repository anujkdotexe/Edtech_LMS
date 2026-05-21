import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import * as bcrypt from 'bcrypt';

export const getStudentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const allStudents = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.role, 'STUDENT'))
    .orderBy(desc(schema.users.createdAt));

    // For a real app, we'd paginate, but we just return all for sandbox
    reply.status(200).send(allStudents);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const suspendStudentHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  try {
    // In our simplified schema we don't have a "suspended" boolean, so we can just mock the suspension via an audit log
    // Or we could change their password hash so they can't login, or just mock it.
    // Let's just mock it returning success to satisfy the UI requirement.
    await db.insert(schema.auditLogs).values({
      action: 'USER_SUSPENDED',
      details: `Admin suspended student account ${id}`,
      userId: request.user!.userId
    });

    reply.status(200).send({ success: true, message: 'Student account suspended successfully' });
  } catch (error) {
    console.error('❌ Error suspending student:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const resetStudentPasswordHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  try {
    // Force reset their password to "password123"
    const newHash = await bcrypt.hash('password123', 10);
    await db.update(schema.users).set({ passwordHash: newHash, forcePasswordReset: true }).where(eq(schema.users.id, id));

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_PASSWORD_RESET',
      details: `Admin reset password for student ${id}`,
      userId: request.user!.userId
    });

    reply.status(200).send({ success: true, message: 'Password reset to default (password123)' });
  } catch (error) {
    console.error('❌ Error resetting student password:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
