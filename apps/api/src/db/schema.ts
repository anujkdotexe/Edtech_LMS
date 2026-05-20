import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  char,
  pgEnum,
  unique,
  index
} from 'drizzle-orm/pg-core';

// --- ENUMS DEFINITIONS ---
export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'ADMIN', 'DEVELOPER']);
export const cefrLevelEnum = pgEnum('cefr_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'SUCCESS', 'FAILED']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['EASY', 'MEDIUM', 'HARD']);

// --- TABLES DEFINITIONS ---

// 1. users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('STUDENT').notNull(),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  forcePasswordReset: boolean('force_password_reset').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email),
  };
});

// 2. user_xp
export const userXp = pgTable('user_xp', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  totalXp: integer('total_xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    totalXpIdx: index('idx_user_xp_total').on(table.totalXp),
  };
});

// 3. user_streaks
export const userStreaks = pgTable('user_streaks', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveDate: date('last_active_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. user_badges (relational persistence table for achievement rewards)
export const userBadges = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: varchar('badge_id', { length: 50 }).notNull(),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    uniqueUserBadge: unique('unique_user_badge').on(table.userId, table.badgeId),
  };
});

// 5. courses
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  cefrLevel: cefrLevelEnum('cefr_level').default('A1').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).default('0.00').notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. course_translations
export const courseTranslations = pgTable('course_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
}, (table) => {
  return {
    uniqueCourseLocale: unique('unique_course_locale').on(table.courseId, table.locale),
  };
});

// 7. modules
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    courseOrderIdx: index('idx_modules_course_order').on(table.courseId, table.orderIndex),
  };
});

// 8. module_translations
export const moduleTranslations = pgTable('module_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
}, (table) => {
  return {
    uniqueModuleLocale: unique('unique_module_locale').on(table.moduleId, table.locale),
  };
});

// 9. lessons
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }).notNull(),
  filePath: varchar('file_path', { length: 255 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    moduleOrderIdx: index('idx_lessons_module_order').on(table.moduleId, table.orderIndex),
  };
});

// 10. lesson_translations
export const lessonTranslations = pgTable('lesson_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary'),
}, (table) => {
  return {
    uniqueLessonLocale: unique('unique_lesson_locale').on(table.lessonId, table.locale),
  };
});

// 11. quizzes
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  difficulty: difficultyLevelEnum('difficulty').default('EASY').notNull(),
  pointValue: integer('point_value').default(50).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. quiz_translations
export const quizTranslations = pgTable('quiz_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  rules: text('rules'),
}, (table) => {
  return {
    uniqueQuizLocale: unique('unique_quiz_locale').on(table.quizId, table.locale),
  };
});

// 13. quiz_questions
export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  optionA: varchar('option_a', { length: 255 }).notNull(),
  optionB: varchar('option_b', { length: 255 }).notNull(),
  optionC: varchar('option_c', { length: 255 }).notNull(),
  optionD: varchar('option_d', { length: 255 }).notNull(),
  correctOption: char('correct_option', { length: 1 }).notNull(),
  orderIndex: integer('order_index').notNull(),
});

// 14. quiz_attempts
export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    userQuizIdx: index('idx_quiz_attempts_user_quiz').on(table.userId, table.quizId),
  };
});

// 15. orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  transactionId: varchar('transaction_id', { length: 100 }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 16. audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  impersonatedBy: uuid('impersonated_by').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
