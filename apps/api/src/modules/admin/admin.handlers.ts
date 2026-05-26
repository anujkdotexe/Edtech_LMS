import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';

// 1. BULK IMPORT STUDENTS HANDLER
export const importStudentsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  // Enforce admin/developer check
  if (!request.user || !['ADMIN', 'DEVELOPER'].includes(request.user.role)) {
    reply.status(403).send({ error: 'Forbidden', message: 'Insufficient administrative privileges' });
    return;
  }

  let studentsList: Array<{ name: string; email: string }> = [];

  // Parse list from body if present, otherwise fallback to demonstration mock records
  if (request.body && typeof request.body === 'object' && 'students' in request.body) {
    studentsList = (request.body as { students: Array<{ name: string; email: string }> }).students;
  } else {
    studentsList = [
      { name: 'Bulk Student A', email: 'bulk.a@lms.local' },
      { name: 'Bulk Student B', email: 'bulk.b@lms.local' },
      { name: 'Bulk Student C', email: 'bulk.c@lms.local' },
    ];
  }

  let importedCount = 0;
  const printedCredentials: Array<{ email: string; tempPass: string }> = [];

  try {
    for (const student of studentsList) {
      // Skip if student email is already taken
      const existing = await db.select().from(schema.users).where(eq(schema.users.email, student.email)).limit(1);
      if (existing.length > 0) continue;

      // Generate random temporary passwords
      const tempPass = 'temp_' + Math.random().toString(36).substring(2, 8);
      const passwordHash = await bcrypt.hash(tempPass, 10);

      // Create record within a transaction
      await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(schema.users).values({
          name: student.name,
          email: student.email,
          passwordHash,
          role: 'STUDENT',
          forcePasswordReset: true, // Force password reset on first login
        }).returning();

        // Initialize empty XP progress tracker
        await tx.insert(schema.userXp).values({
          userId: newUser.id,
          totalXp: 0,
          level: 1,
        });

        // Initialize empty streak tracker
        await tx.insert(schema.userStreaks).values({
          userId: newUser.id,
          currentStreak: 0,
          longestStreak: 0,
        });
      });

      printedCredentials.push({ email: student.email, tempPass });
      importedCount++;
    }

    // Log the onboarding CRM audit trail
    await db.insert(schema.auditLogs).values({
      userId: request.user.userId,
      impersonatedBy: request.user.impersonatedBy,
      action: 'ADMIN_STUDENTS_IMPORT',
      details: `Onboarded ${importedCount} students via bulk manager. Credentials printed to developer standard logs.`,
      ipAddress: request.ip,
    });

    // Pro-actively print credentials to system logs for developer ease
    console.log('[INFO] --- BULK ONBOARDING CREDENTIALS LOG ---');
    printedCredentials.forEach(c => {
      console.log(`[INFO] User: ${c.email} | Temporary Password: ${c.tempPass}`);
    });
    console.log('[INFO] ----------------------------------------');

    reply.status(200).send({
      success: true,
      importedCount,
      message: 'Credentials printed to standard system logs. Force-reset scheduled.',
    });
  } catch (error) {
    console.error('[ERROR] Error bulk importing students:', error);
    reply.status(500).send({ error: 'Internal Server Error', message: 'Bulk student onboarding failed' });
  }
};
