import dotenv from 'dotenv';
import path from 'path';

// Load env configuration parameters from the workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import bcrypt from 'bcrypt';
import { db } from './index';
import * as schema from './schema';

async function main() {
  console.log('⏳ Starting database seeding...');

  try {
    // 1. Clean existing tables
    console.log('🧹 Purging old database tables...');
    await db.delete(schema.auditLogs);
    await db.delete(schema.orders);
    await db.delete(schema.quizAttempts);
    await db.delete(schema.quizQuestions);
    await db.delete(schema.quizTranslations);
    await db.delete(schema.quizzes);
    await db.delete(schema.lessonTranslations);
    await db.delete(schema.lessons);
    await db.delete(schema.moduleTranslations);
    await db.delete(schema.modules);
    await db.delete(schema.courseTranslations);
    await db.delete(schema.courses);
    await db.delete(schema.userBadges);
    await db.delete(schema.userStreaks);
    await db.delete(schema.userXp);
    await db.delete(schema.users);
    console.log('✅ Purge complete.');

    // 2. Generate credentials hashes
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 3. Populate Users
    console.log('👤 Provisioning system users...');
    const [studentUser] = await db.insert(schema.users).values({
      name: 'Jane Student',
      email: 'student@lms.local',
      passwordHash: defaultPasswordHash,
      role: 'STUDENT',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=student',
    }).returning();

    const [adminUser] = await db.insert(schema.users).values({
      name: 'John Admin',
      email: 'admin@lms.local',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin',
    }).returning();

    const [devUser] = await db.insert(schema.users).values({
      name: 'Alex Developer',
      email: 'developer@lms.local',
      passwordHash: defaultPasswordHash,
      role: 'DEVELOPER',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=developer',
    }).returning();

    console.log('✅ Users provisioned.');

    // 4. Provision User Stats (XP & Streaks)
    console.log('📈 Setting up user XP & streak trackers...');
    await db.insert(schema.userXp).values({
      userId: studentUser.id,
      totalXp: 120, // Start with some initial experience points
      level: 1,
    });

    await db.insert(schema.userStreaks).values({
      userId: studentUser.id,
      currentStreak: 2,
      longestStreak: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
    });

    // Also populate trackers for admin and dev just in case
    await db.insert(schema.userXp).values([
      { userId: adminUser.id, totalXp: 0, level: 1 },
      { userId: devUser.id, totalXp: 0, level: 1 },
    ]);

    await db.insert(schema.userStreaks).values([
      { userId: adminUser.id, currentStreak: 0, longestStreak: 0 },
      { userId: devUser.id, currentStreak: 0, longestStreak: 0 },
    ]);
    console.log('✅ XP & streak trackers set up.');

    // 5. Populate Courses
    console.log('📚 Populating courses...');
    // French A1 (Free Course)
    const [frenchCourse] = await db.insert(schema.courses).values({
      cefrLevel: 'A1',
      price: '0.00',
      isPremium: false,
      isPublished: true,
    }).returning();

    // German B1 (Premium Course)
    const [germanCourse] = await db.insert(schema.courses).values({
      cefrLevel: 'B1',
      price: '19.99',
      isPremium: true,
      isPublished: true,
    }).returning();

    // 6. Course Translations
    await db.insert(schema.courseTranslations).values([
      {
        courseId: frenchCourse.id,
        locale: 'en',
        title: 'Elementary French A1',
        description: 'Learn foundational grammar, common greetings, and vocabulary for day-to-day conversation.',
      },
      {
        courseId: frenchCourse.id,
        locale: 'fr',
        title: 'Français Élémentaire A1',
        description: 'Apprenez la grammaire de base, les salutations et le vocabulaire essentiel du quotidien.',
      },
      {
        courseId: germanCourse.id,
        locale: 'en',
        title: 'Intermediate German B1',
        description: 'Take command of complex clause order, express abstract opinions, and vocabulary for workplace debates.',
      },
      {
        courseId: germanCourse.id,
        locale: 'de',
        title: 'Mittelstufe Deutsch B1',
        description: 'Beherrschen Sie Nebensätze, drücken Sie abstrakte Meinungen aus und lernen Sie Vokabeln für Diskussionen.',
      },
    ]);
    console.log('✅ Courses & translations seeded.');

    // 7. Course Modules
    console.log('🗂️ Populating course modules...');
    // French A1 Modules
    const [frenchMod1] = await db.insert(schema.modules).values({
      courseId: frenchCourse.id,
      orderIndex: 1,
    }).returning();

    const [frenchMod2] = await db.insert(schema.modules).values({
      courseId: frenchCourse.id,
      orderIndex: 2,
    }).returning();

    // German B1 Modules
    const [germanMod1] = await db.insert(schema.modules).values({
      courseId: germanCourse.id,
      orderIndex: 1,
    }).returning();

    // Module Translations
    await db.insert(schema.moduleTranslations).values([
      { moduleId: frenchMod1.id, locale: 'en', title: 'Welcome to French Basics' },
      { moduleId: frenchMod1.id, locale: 'fr', title: 'Bienvenue aux Bases du Français' },
      { moduleId: frenchMod2.id, locale: 'en', title: 'Everyday Vocab & Dining' },
      { moduleId: frenchMod2.id, locale: 'fr', title: 'Vocabulaire Quotidien & Restauration' },
      { moduleId: germanMod1.id, locale: 'en', title: 'Debate & Expressing Opinions' },
      { moduleId: germanMod1.id, locale: 'de', title: 'Debatte & Eigene Meinung' },
    ]);
    console.log('✅ Modules seeded.');

    // 8. Lessons
    console.log('📖 Populating lessons...');
    // French Module 1 Lessons
    const [frenchLess1] = await db.insert(schema.lessons).values({
      moduleId: frenchMod1.id,
      filePath: 'lessons/french_a1_pronunciation.pdf',
      orderIndex: 1,
    }).returning();

    const [frenchLess2] = await db.insert(schema.lessons).values({
      moduleId: frenchMod1.id,
      filePath: 'lessons/french_a1_greetings.pdf',
      orderIndex: 2,
    }).returning();

    // French Module 2 Lessons
    const [frenchLess3] = await db.insert(schema.lessons).values({
      moduleId: frenchMod2.id,
      filePath: 'lessons/french_a1_food.pdf',
      orderIndex: 1,
    }).returning();

    // German Module 1 Lessons
    const [germanLess1] = await db.insert(schema.lessons).values({
      moduleId: germanMod1.id,
      filePath: 'lessons/german_b1_opinions.pdf',
      orderIndex: 1,
    }).returning();

    // Lesson Translations
    await db.insert(schema.lessonTranslations).values([
      {
        lessonId: frenchLess1.id,
        locale: 'en',
        title: 'Introduction to Pronunciation',
        summary: 'Learn basic vowels, accents (aigu, grave, circonflexe), and standard phonetic pronunciation guidelines.',
      },
      {
        lessonId: frenchLess1.id,
        locale: 'fr',
        title: 'Introduction à la Prononciation',
        summary: 'Apprenez les voyelles de base, les accents (aigu, grave, circonflexe) et la phonétique standard.',
      },
      {
        lessonId: frenchLess2.id,
        locale: 'en',
        title: 'Greeting People Correctly',
        summary: 'Study formal and informal ways to greet others, introduce yourself, and utilize basic polite syntax.',
      },
      {
        lessonId: frenchLess2.id,
        locale: 'fr',
        title: 'Saluer les Gens Correctement',
        summary: 'Étudiez les salutations formelles et informelles, les présentations et les formules de politesse.',
      },
      {
        lessonId: frenchLess3.id,
        locale: 'en',
        title: 'At the French Café',
        summary: 'Acquire vocabulary relating to foods, dining etiquette, and phrases for ordering breakfast items.',
      },
      {
        lessonId: frenchLess3.id,
        locale: 'fr',
        title: 'Au Café Français',
        summary: 'Acquérez du vocabulaire sur la nourriture, le service et les expressions pour commander un petit-déjeuner.',
      },
      {
        lessonId: germanLess1.id,
        locale: 'en',
        title: 'Discussing Social Topics',
        summary: 'How to debate, state active arguments, and utilize B1 German structures (weil, obwohl) to describe situations.',
      },
      {
        lessonId: germanLess1.id,
        locale: 'de',
        title: 'Diskussion sozialer Themen',
        summary: 'Wie man debattiert, Argumente vorträgt und B1-Nebensätze (weil, obwohl) anwendet.',
      },
    ]);
    console.log('✅ Lessons seeded.');

    // 9. Interactive Quizzes (MCQ Engine)
    console.log('❓ Populating interactive quizzes...');
    // Quiz 1: French Greetings (Easy, 50 XP)
    const [quizGreetings] = await db.insert(schema.quizzes).values({
      difficulty: 'EASY',
      pointValue: 50,
    }).returning();

    // Quiz 2: French Present Conjugations (Medium, 100 XP)
    const [quizConjugations] = await db.insert(schema.quizzes).values({
      difficulty: 'MEDIUM',
      pointValue: 100,
    }).returning();

    // Quiz 3: German Clause Conjunctions (Hard, 150 XP)
    const [quizConjunctions] = await db.insert(schema.quizzes).values({
      difficulty: 'HARD',
      pointValue: 150,
    }).returning();

    // Quiz Translations
    await db.insert(schema.quizTranslations).values([
      {
        quizId: quizGreetings.id,
        locale: 'en',
        title: 'French Greetings Quiz',
        rules: 'Answer 5 basic questions regarding greetings. Earn a 50 XP completion bonus + 5 XP per correct answer.',
      },
      {
        quizId: quizGreetings.id,
        locale: 'fr',
        title: 'Quiz sur les Salutations',
        rules: 'Répondez à 5 questions simples sur les salutations. Gagnez un bonus de 50 XP + 5 XP par bonne réponse.',
      },
      {
        quizId: quizConjugations.id,
        locale: 'en',
        title: 'French Verb Conjugation (Present)',
        rules: 'Test present tense spelling for verbs ending in -er, -ir, -re, and common irregulars (être, avoir, faire).',
      },
      {
        quizId: quizConjugations.id,
        locale: 'fr',
        title: 'Quiz de Conjugaison (Présent)',
        rules: 'Testez la conjugaison au présent pour les verbes en -er, -ir, -re et les auxiliaires irréguliers.',
      },
      {
        quizId: quizConjunctions.id,
        locale: 'en',
        title: 'German Subordinate Conjunctions B1',
        rules: 'Master subordinate syntax (weil, obwohl) vs coordinate syntax (aber, trotzdem). Verb position rules apply.',
      },
      {
        quizId: quizConjunctions.id,
        locale: 'de',
        title: 'Deutsche Konjunktionen B1',
        rules: 'Meistern Sie Nebensätze (weil, obwohl) und Hauptsätze (aber, trotzdem). Verbzweit- und Verbletztstellung.',
      },
    ]);
    console.log('✅ Quiz configurations seeded.');

    // 10. Populate EXACTLY 14 Quiz Questions (Cheat-proof)
    console.log('📝 Seeding exactly 14 quiz questions across quizzes...');

    await db.insert(schema.quizQuestions).values([
      // --- Quiz 1 (French Greetings): Questions 1 - 5 ---
      {
        quizId: quizGreetings.id,
        questionText: "How do you say 'Hello' in French?",
        optionA: "Au revoir",
        optionB: "Bonjour",
        optionC: "Merci",
        optionD: "S'il vous plaît",
        correctOption: 'B',
        orderIndex: 1,
      },
      {
        quizId: quizGreetings.id,
        questionText: "What does 'Merci beaucoup' mean?",
        optionA: "You are welcome",
        optionB: "Excuse me",
        optionC: "Thank you very much",
        optionD: "Please",
        correctOption: 'C',
        orderIndex: 2,
      },
      {
        quizId: quizGreetings.id,
        questionText: "How do you translate 'Good night' in French?",
        optionA: "Bonne nuit",
        optionB: "Bonjour",
        optionC: "Bonsoir",
        optionD: "Bon après-midi",
        correctOption: 'A',
        orderIndex: 3,
      },
      {
        quizId: quizGreetings.id,
        questionText: "How do you say 'Goodbye'?",
        optionA: "Bienvenue",
        optionB: "Salut",
        optionC: "Au revoir",
        optionD: "Enchanté",
        correctOption: 'C',
        orderIndex: 4,
      },
      {
        quizId: quizGreetings.id,
        questionText: "What is 'Yes, please' in French?",
        optionA: "Oui, s'il vous plaît",
        optionB: "Non, merci",
        optionC: "D'accord",
        optionD: "S'il te plaît",
        correctOption: 'A',
        orderIndex: 5,
      },

      // --- Quiz 2 (French Present Conjugation): Questions 6 - 10 ---
      {
        quizId: quizConjugations.id,
        questionText: "Conjugate: Je (parler) ____ français.",
        optionA: "parle",
        optionB: "parles",
        optionC: "parlez",
        optionD: "parlons",
        correctOption: 'A',
        orderIndex: 1,
      },
      {
        quizId: quizConjugations.id,
        questionText: "Conjugate: Nous (finir) ____ le devoir.",
        optionA: "finis",
        optionB: "finissez",
        optionC: "finissons",
        optionD: "finissent",
        correctOption: 'C',
        orderIndex: 2,
      },
      {
        quizId: quizConjugations.id,
        questionText: "Conjugate: Ils (être) ____ étudiants.",
        optionA: "suis",
        optionB: "êtes",
        optionC: "sommes",
        optionD: "sont",
        correctOption: 'D',
        orderIndex: 3,
      },
      {
        quizId: quizConjugations.id,
        questionText: "Conjugate: Tu (avoir) ____ un livre.",
        optionA: "ai",
        optionB: "as",
        optionC: "a",
        optionD: "avez",
        correctOption: 'B',
        orderIndex: 4,
      },
      {
        quizId: quizConjugations.id,
        questionText: "Conjugate: Vous (faire) ____ du sport.",
        optionA: "fais",
        optionB: "fait",
        optionC: "faites",
        optionD: "font",
        correctOption: 'C',
        orderIndex: 5,
      },

      // --- Quiz 3 (German Conjunctions B1): Questions 11 - 14 ---
      {
        quizId: quizConjunctions.id,
        questionText: "Which subordinating conjunction puts the conjugated verb at the very end of the clause?",
        optionA: "aber",
        optionB: "und",
        optionC: "weil",
        optionD: "oder",
        correctOption: 'C',
        orderIndex: 1,
      },
      {
        quizId: quizConjunctions.id,
        questionText: "Fill in the blank: Ich gehe spazieren, ____ es regnet. (I go walking, although it is raining.)",
        optionA: "obwohl",
        optionB: "weil",
        optionC: "trotzdem",
        optionD: "und",
        correctOption: 'A',
        orderIndex: 2,
      },
      {
        quizId: quizConjunctions.id,
        questionText: "Fill in the blank: Er ist krank, ____ arbeitet er heute. (He is sick, nevertheless he works today.)",
        optionA: "weil",
        optionB: "obwohl",
        optionC: "trotzdem",
        optionD: "aber",
        correctOption: 'C',
        orderIndex: 3,
      },
      {
        quizId: quizConjunctions.id,
        questionText: "Which coordinating conjunction belongs to the ADUSO group (position zero, verb stays in second position)?",
        optionA: "weil",
        optionB: "aber",
        optionC: "obwohl",
        optionD: "dass",
        correctOption: 'B',
        orderIndex: 4,
      },
    ]);

    console.log('✅ Exactly 14 quiz questions successfully seeded!');

    // 11. Provision a completed badge for student to show off achievement persistence
    console.log('🏆 Awarding first steps badge to student...');
    await db.insert(schema.userBadges).values({
      userId: studentUser.id,
      badgeId: 'first_steps',
      unlockedAt: new Date(),
    });

    // 12. Provision a successful order to student to unlock course access
    console.log('💳 Seed successful orders...');
    await db.insert(schema.orders).values({
      userId: studentUser.id,
      courseId: frenchCourse.id, // Free course
      status: 'SUCCESS',
      transactionId: 'txn_free_unlocked',
      amount: '0.00',
    });

    console.log('🚀 Seeding process completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
