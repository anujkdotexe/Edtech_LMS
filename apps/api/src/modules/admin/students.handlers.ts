import { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

// 1. GET ALL STUDENTS
export const getStudentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const allStudents = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      isSuspended: schema.users.isSuspended,
      createdAt: schema.users.createdAt,
      level: schema.userXp.level,
      totalXp: schema.userXp.totalXp,
      currentStreak: schema.userStreaks.currentStreak,
    })
    .from(schema.users)
    .leftJoin(schema.userXp, eq(schema.users.id, schema.userXp.userId))
    .leftJoin(schema.userStreaks, eq(schema.users.id, schema.userStreaks.userId))
    .where(eq(schema.users.role, 'STUDENT'))
    .orderBy(desc(schema.users.createdAt));

    reply.status(200).send(allStudents);
  } catch (error) {
    console.error('[ERROR] Error fetching students:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 2. TOGGLE SUSPEND STUDENT
export const suspendStudentHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  try {
    const [student] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (!student) {
      reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      return;
    }

    const newSuspendedState = !student.isSuspended;
    await db.update(schema.users).set({ isSuspended: newSuspendedState }).where(eq(schema.users.id, id));

    await db.insert(schema.auditLogs).values({
      action: newSuspendedState ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      details: `Admin ${newSuspendedState ? 'suspended' : 'unsuspended'} student account ${id}`,
      userId: request.user!.userId
    });

    reply.status(200).send({
      success: true,
      message: `Student account ${newSuspendedState ? 'suspended' : 'unsuspended'} successfully`,
      isSuspended: newSuspendedState
    });
  } catch (error) {
    console.error('[ERROR] Error suspending/unsuspending student:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 3. RESET STUDENT PASSWORD
export const resetStudentPasswordHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  try {
    const tempPassword = crypto.randomBytes(4).toString('hex') + 'A1!';
    const newHash = await bcrypt.hash(tempPassword, 10);
    await db.update(schema.users).set({ passwordHash: newHash, forcePasswordReset: true }).where(eq(schema.users.id, id));

    console.log(`\n\n=== [INFO] MOCK EMAIL SERVICE ===\nTo Student ID: ${id}\nSubject: Temporary Password Reset\nMessage: Your account password has been reset by an Administrator. Your temporary password is '${tempPassword}'. You will be prompted to choose a new password upon logging in.\n=================================\n`);

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_PASSWORD_RESET',
      details: `Admin reset password for student ${id}`,
      userId: request.user!.userId
    });

    reply.status(200).send({ success: true, tempPassword, message: `Password reset successfully. Temporary password: ${tempPassword}` });
  } catch (error) {
    console.error('[ERROR] Error resetting student password:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 4. HARD DELETE STUDENT
export const deleteStudentHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { id } = request.params;
  try {
    const [student] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (!student) {
      reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      return;
    }

    await db.delete(schema.users).where(eq(schema.users.id, id));

    await db.insert(schema.auditLogs).values({
      action: 'USER_DELETED',
      details: `Admin hard deleted student account ${id} (${student.email})`,
      userId: request.user!.userId
    });

    reply.status(200).send({ success: true, message: 'Student account deleted successfully' });
  } catch (error) {
    console.error('[ERROR] Error deleting student:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 5. MANUALLY ENROLL STUDENT IN COURSE
export const enrollStudentHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { courseId: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { courseId } = request.body;

  try {
    // Verify course exists
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
    if (!course) {
      reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      return;
    }

    // Verify student exists
    const [student] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (!student) {
      reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      return;
    }

    // Check if already enrolled in this course
    const existing = await db.select()
      .from(schema.orders)
      .where(and(
        eq(schema.orders.userId, id),
        eq(schema.orders.courseId, courseId),
        eq(schema.orders.status, 'SUCCESS')
      ))
      .limit(1);

    if (existing.length > 0) {
      reply.status(400).send({ error: 'Bad Request', message: 'Student is already enrolled in this course' });
      return;
    }

    // Insert successful manual order/enrollment record
    await db.insert(schema.orders).values({
      userId: id,
      courseId,
      status: 'SUCCESS',
      amount: course.price,
      transactionId: `MANUAL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      createdAt: new Date(),
    });

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_MANUAL_ENROLL',
      details: `Admin manually enrolled student ${id} in course ${courseId}`,
      userId: request.user!.userId,
    });

    reply.status(200).send({ success: true, message: 'Student enrolled in course successfully' });
  } catch (error) {
    console.error('[ERROR] Error enrolling student:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 6. EXPORT STUDENTS CSV
export const exportStudentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const allStudents = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      createdAt: schema.users.createdAt,
      isSuspended: schema.users.isSuspended,
    })
    .from(schema.users)
    .where(eq(schema.users.role, 'STUDENT'))
    .orderBy(desc(schema.users.createdAt));

    let csvContent = 'ID,Name,Email,Join Date,Suspended\n';
    for (const student of allStudents) {
      const escapedName = `"${student.name.replace(/"/g, '""')}"`;
      const escapedEmail = `"${student.email.replace(/"/g, '""')}"`;
      csvContent += `${student.id},${escapedName},${escapedEmail},${student.createdAt.toISOString()},${student.isSuspended}\n`;
    }

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename=students_export.csv')
      .status(200)
      .send(csvContent);
  } catch (error) {
    console.error('[ERROR] Error exporting students:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 7. ADD SINGLE STUDENT
export const addStudentHandler = async (request: FastifyRequest<{ Body: { name: string; email: string } }>, reply: FastifyReply) => {
  const { name, email } = request.body;
  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      reply.status(400).send({ error: 'Bad Request', message: 'User with this email already exists' });
      return;
    }

    const defaultPwd = 'password123';
    const passwordHash = await bcrypt.hash(defaultPwd, 10);
    
    await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(schema.users).values({
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + encodeURIComponent(name),
        forcePasswordReset: true,
      }).returning();

      await tx.insert(schema.userXp).values({
        userId: newUser.id,
        totalXp: 0,
        level: 1,
      });

      await tx.insert(schema.userStreaks).values({
        userId: newUser.id,
        currentStreak: 0,
        longestStreak: 0,
      });
    });

    console.log(`\n\n=== MOCK EMAIL SERVICE ===\nTo: ${email}\nSubject: Welcome to Antigravity LMS\nMessage: Your account has been created by an Administrator. Your default password is 'password123'. Please reset it on your first login.\n==========================\n`);

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_ADD_STUDENT',
      details: `Admin added single student account for ${name} (${email})`,
      userId: request.user!.userId,
    });

    reply.status(201).send({ success: true, message: 'Student account created and welcome email dispatched successfully.' });
  } catch (error) {
    console.error('[ERROR] Error adding student:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 8. BULK ENROLL STUDENTS
export const bulkEnrollStudentsHandler = async (
  request: FastifyRequest<{ Body: { userIds: string[]; courseId: string } }>,
  reply: FastifyReply
) => {
  const { userIds, courseId } = request.body;
  try {
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
    if (!course) {
      reply.status(404).send({ error: 'Not Found', message: 'Course not found' });
      return;
    }

    if (!userIds || userIds.length === 0) {
      reply.status(400).send({ error: 'Bad Request', message: 'userIds array is required' });
      return;
    }

    // Single query to find existing enrollments
    const existingOrders = await db
      .select({ userId: schema.orders.userId })
      .from(schema.orders)
      .where(
        and(
          inArray(schema.orders.userId, userIds),
          eq(schema.orders.courseId, courseId),
          eq(schema.orders.status, 'SUCCESS')
        )
      );

    const alreadyEnrolledIds = new Set(existingOrders.map((o) => o.userId));
    const toEnrollIds = userIds.filter((id) => !alreadyEnrolledIds.has(id));

    if (toEnrollIds.length > 0) {
      const bulkRows = toEnrollIds.map((userId) => ({
        userId,
        courseId,
        status: 'SUCCESS' as const,
        amount: course.price,
        transactionId: `BULK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        createdAt: new Date(),
      }));

      await db.insert(schema.orders).values(bulkRows);
    }

    const enrolledCount = toEnrollIds.length;

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_BULK_ENROLL',
      details: `Admin bulk enrolled ${enrolledCount} students in course ${courseId}`,
      userId: request.user!.userId,
    });

    reply.status(200).send({ success: true, message: `Successfully enrolled ${enrolledCount} students in course` });
  } catch (error) {
    console.error('[ERROR] Error bulk enrolling students:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 9. REVOKE COURSE ACCESS
export const revokeCourseAccessHandler = async (
  request: FastifyRequest<{ Body: { userId: string; courseId: string } }>,
  reply: FastifyReply
) => {
  const { userId, courseId } = request.body;
  try {
    await db.update(schema.orders)
      .set({ status: 'REFUNDED' })
      .where(and(
        eq(schema.orders.userId, userId),
        eq(schema.orders.courseId, courseId),
        eq(schema.orders.status, 'SUCCESS')
      ));

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_REVOKE_COURSE',
      details: `Admin revoked access for user ${userId} to course ${courseId}`,
      userId: request.user!.userId,
    });

    reply.status(200).send({ success: true, message: 'Course access revoked successfully.' });
  } catch (error) {
    console.error('[ERROR] Error revoking course access:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

// 10. SEND INLINE MESSAGE TO STUDENT
export const sendMessageToStudentHandler = async (
  request: FastifyRequest<{ Body: { userId: string; subject: string; message: string } }>,
  reply: FastifyReply
) => {
  const { userId, subject, message } = request.body;
  try {
    const [student] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!student) {
      reply.status(404).send({ error: 'Not Found', message: 'Student account not found' });
      return;
    }

    console.log(`\n\n=== MOCK EMAIL SERVICE ===\nTo: ${student.email}\nSubject: ${subject}\nMessage: ${message}\n==========================\n`);

    await db.insert(schema.auditLogs).values({
      action: 'ADMIN_SEND_MESSAGE',
      details: `Admin sent inline communication to student ${userId} (${student.email})`,
      userId: request.user!.userId,
    });

    reply.status(200).send({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('[ERROR] Error sending message to student:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
