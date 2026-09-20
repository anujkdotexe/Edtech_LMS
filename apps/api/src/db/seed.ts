import dotenv from 'dotenv';
import path from 'path';

// Load env configuration parameters from the workspace root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import bcrypt from 'bcrypt';
import { db } from './index';
import * as schema from './schema';
import { createSamplePdfs } from './generate_lesson_pdfs';

async function main() {
  console.log('[INFO] Starting database seeding...');

  try {
    // 0. Ensure sample lesson PDFs exist in upload directory
    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    createSamplePdfs(uploadDir);
    console.log('[OK] Generated sample lesson PDFs in public/uploads.');

    // 1. Clean existing tables
    console.log('[INFO] Purging old database tables...');
    await db.delete(schema.lessonCompletions);
    await db.delete(schema.dailyWarmupCompletions);
    await db.delete(schema.featureFlags);
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
    await db.delete(schema.siteConfig);
    await db.delete(schema.users);
    console.log('[OK] Purge complete.');

    // 2. Generate credentials hashes
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 3. Populate Staff Users (Admin & Dev)
    console.log('[INFO] Provisioning admin and developer users...');
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

    // 4. Populate 15 Diverse Student Users
    console.log('[INFO] Provisioning 15 student users for cohorts and leaderboards...');
    const studentProfiles = [
      { name: 'Jane Student', email: 'student@lms.local', seed: 'student', xp: 580, level: 3, streak: 5, longest: 8 },
      { name: 'Marco Rossi', email: 'marco@lms.local', seed: 'marco', xp: 2450, level: 8, streak: 22, longest: 30 },
      { name: 'Sophie Dubois', email: 'sophie@lms.local', seed: 'sophie', xp: 1920, level: 7, streak: 18, longest: 25 },
      { name: 'Lucas Weber', email: 'lucas@lms.local', seed: 'lucas', xp: 1640, level: 6, streak: 14, longest: 20 },
      { name: 'Elena Rostova', email: 'elena@lms.local', seed: 'elena', xp: 1310, level: 5, streak: 11, longest: 15 },
      { name: 'Mateo Fernandez', email: 'mateo@lms.local', seed: 'mateo', xp: 1050, level: 4, streak: 9, longest: 12 },
      { name: 'Chloe Martin', email: 'chloe@lms.local', seed: 'chloe', xp: 980, level: 4, streak: 8, longest: 10 },
      { name: 'Hans Schmidt', email: 'hans@lms.local', seed: 'hans', xp: 750, level: 3, streak: 6, longest: 9 },
      { name: 'Giulia Bianchi', email: 'giulia@lms.local', seed: 'giulia', xp: 620, level: 3, streak: 5, longest: 7 },
      { name: 'Carlos Silva', email: 'carlos@lms.local', seed: 'carlos', xp: 450, level: 2, streak: 4, longest: 6 },
      { name: 'Amelie Moreau', email: 'amelie@lms.local', seed: 'amelie', xp: 380, level: 2, streak: 3, longest: 5 },
      { name: 'Felix Fischer', email: 'felix@lms.local', seed: 'felix', xp: 310, level: 2, streak: 2, longest: 4 },
      { name: 'Lucia Morales', email: 'lucia@lms.local', seed: 'lucia', xp: 220, level: 1, streak: 2, longest: 3 },
      { name: 'Liam O\'Connor', email: 'liam@lms.local', seed: 'liam', xp: 150, level: 1, streak: 1, longest: 2 },
      { name: 'Yuki Tanaka', email: 'yuki@lms.local', seed: 'yuki', xp: 90, level: 1, streak: 1, longest: 1 },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const createdStudents = [];

    for (const p of studentProfiles) {
      const [u] = await db.insert(schema.users).values({
        name: p.name,
        email: p.email,
        passwordHash: defaultPasswordHash,
        role: 'STUDENT',
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.seed}`,
      }).returning();

      await db.insert(schema.userXp).values({
        userId: u.id,
        totalXp: p.xp,
        level: p.level,
      });

      await db.insert(schema.userStreaks).values({
        userId: u.id,
        currentStreak: p.streak,
        longestStreak: p.longest,
        lastActiveDate: todayStr,
      });

      createdStudents.push({ ...u, ...p });
    }

    const primaryStudent = createdStudents[0];

    // Staff user XP and streaks
    await db.insert(schema.userXp).values([
      { userId: adminUser.id, totalXp: 0, level: 1 },
      { userId: devUser.id, totalXp: 0, level: 1 },
    ]);
    await db.insert(schema.userStreaks).values([
      { userId: adminUser.id, currentStreak: 0, longestStreak: 0 },
      { userId: devUser.id, currentStreak: 0, longestStreak: 0 },
    ]);
    console.log('[OK] 15 students and staff provisioned.');

    // 5. Populate 8 Courses across CEFR Tiers A1 to C1
    console.log('[INFO] Populating 8 CEFR courses...');
    const coursesData = [
      {
        cefrLevel: 'A1',
        price: '0.00',
        isPremium: false,
        isPublished: true,
        enTitle: 'Elementary French A1',
        enDesc: 'Learn foundational grammar, common greetings, and vocabulary for day-to-day conversation.',
        frTitle: 'Français Élémentaire A1',
        frDesc: 'Apprenez la grammaire de base, les salutations et le vocabulaire essentiel du quotidien.',
        modules: [
          {
            title: 'Welcome to French Basics',
            lessons: [
              { title: 'Introduction to Pronunciation', summary: 'Learn vowels, accents, and standard phonetics.', file: 'lessons/french_a1_pronunciation.pdf' },
              { title: 'Greeting People Correctly', summary: 'Study formal and informal ways to greet others.', file: 'lessons/french_a1_greetings.pdf' },
            ],
          },
          {
            title: 'Everyday Vocab & Dining',
            lessons: [
              { title: 'At the French Café', summary: 'Acquire vocabulary relating to foods and ordering.', file: 'lessons/french_a1_food.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'A2',
        price: '14.99',
        isPremium: true,
        isPublished: true,
        enTitle: 'Conversational French A2',
        enDesc: 'Build complex sentences, describe past travels, and engage in real-life dialogue.',
        frTitle: 'Français Conversationnel A2',
        frDesc: 'Construisez des phrases complexes et racontez vos voyages passés.',
        modules: [
          {
            title: 'Travel & Exploration',
            lessons: [
              { title: 'Navigating Trains & Transport', summary: 'Buy tickets, ask for directions, and navigate travel.', file: 'lessons/french_a2_travel.pdf' },
              { title: 'Passé Composé in Action', summary: 'Master auxiliary verbs avoir and être in narrative.', file: 'lessons/french_a2_past_tense.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'B1',
        price: '19.99',
        isPremium: true,
        isPublished: true,
        enTitle: 'Intermediate German B1',
        enDesc: 'Take command of complex clause order, express abstract opinions, and vocabulary for workplace debates.',
        deTitle: 'Mittelstufe Deutsch B1',
        deDesc: 'Beherrschen Sie Nebensätze, drücken Sie Meinungen aus und erweitern Sie Ihren Wortschatz.',
        modules: [
          {
            title: 'Debate & Expressing Opinions',
            lessons: [
              { title: 'Discussing Social Topics', summary: 'How to debate, state active arguments, and use B1 structures.', file: 'lessons/german_b1_opinions.pdf' },
              { title: 'Subordinate Connectors (weil/obwohl)', summary: 'Complex sentence connectors and word order mastery.', file: 'lessons/german_b1_connectors.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'B2',
        price: '24.99',
        isPremium: true,
        isPublished: true,
        enTitle: 'Advanced German B2',
        enDesc: 'Professional German for corporate meetings, academic presentations, and cultural critiques.',
        deTitle: 'Oberstufe Deutsch B2',
        deDesc: 'Fachdeutsch für Meetings, wissenschaftliche Präsentationen und Verhandlungen.',
        modules: [
          {
            title: 'Corporate & Technical Communication',
            lessons: [
              { title: 'Formal Business Etiquette', summary: 'Key idioms, formal correspondence, and executive summaries.', file: 'lessons/german_b2_workplace.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'A1',
        price: '0.00',
        isPremium: false,
        isPublished: true,
        enTitle: 'Spanish for Beginners A1',
        enDesc: 'Master foundational Spanish: vowel sounds, fundamental phrases, and basic introductions.',
        esTitle: 'Español para Principiantes A1',
        esDesc: 'Domina los conceptos básicos: pronunciación, saludos y presentaciones cotidianas.',
        modules: [
          {
            title: 'First Steps in Spanish',
            lessons: [
              { title: 'Spanish Pronunciation & Alphabet', summary: 'Learn pure vowels, rolling R, and essential phrases.', file: 'lessons/spanish_a1_basics.pdf' },
              { title: 'Family & Physical Descriptions', summary: 'Describe people, relationships, and basic characteristics.', file: 'lessons/spanish_a1_family.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'A2',
        price: '14.99',
        isPremium: true,
        isPublished: true,
        enTitle: 'Spanish Everyday Fluency A2',
        enDesc: 'Navigate shopping, restaurant reservations, and daily routines in Spanish.',
        esTitle: 'Fluidez Cotidiana en Español A2',
        esDesc: 'Aprende a desenvolverte en compras, restaurantes y rutinas diarias.',
        modules: [
          {
            title: 'Daily Life & Routines',
            lessons: [
              { title: 'Reflexive Verbs & Routines', summary: 'Master verbs like levantarse, ducharse, and acostarse.', file: 'lessons/spanish_a2_daily_routine.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'B1',
        price: '19.99',
        isPremium: true,
        isPublished: true,
        enTitle: 'Italian Cultural Expressions B1',
        enDesc: 'Understand Italian cultural nuances, idioms, conversational rhythms, and lifestyle expressions.',
        itTitle: 'Espressioni Culturali Italiane B1',
        itDesc: 'Scopri i modi di dire, il ritmo della conversazione e le sfumature culturali.',
        modules: [
          {
            title: 'Idioms & Conversational Nuance',
            lessons: [
              { title: 'Popular Italian Idioms & Gestures', summary: 'Understand expressions like In bocca al lupo and Non vedo l ora.', file: 'lessons/italian_b1_culture.pdf' },
            ],
          },
        ],
      },
      {
        cefrLevel: 'C1',
        price: '29.99',
        isPremium: true,
        isPublished: true,
        enTitle: 'Professional Spanish Mastery C1',
        enDesc: 'High-level business negotiations, economic discourse, and sophisticated rhetoric in Spanish.',
        esTitle: 'Maestría Profesional en Español C1',
        esDesc: 'Negociaciones de alto nivel, discurso económico y retórica avanzada.',
        modules: [
          {
            title: 'Executive Negotiations & Rhetoric',
            lessons: [
              { title: 'Persuasive Speech & Contracts', summary: 'Complex conditional syntax and business contract analysis.', file: 'lessons/spanish_c1_business.pdf' },
            ],
          },
        ],
      },
    ];

    const insertedCourses = [];

    for (const c of coursesData) {
      const [course] = await db.insert(schema.courses).values({
        cefrLevel: c.cefrLevel as any,
        price: c.price,
        isPremium: c.isPremium,
        isPublished: c.isPublished,
      }).returning();

      insertedCourses.push(course);

      // Course translation
      await db.insert(schema.courseTranslations).values({
        courseId: course.id,
        locale: 'en',
        title: c.enTitle,
        description: c.enDesc,
      });

      // Modules & lessons
      let mIdx = 1;
      for (const m of c.modules) {
        const [mod] = await db.insert(schema.modules).values({
          courseId: course.id,
          orderIndex: mIdx++,
        }).returning();

        await db.insert(schema.moduleTranslations).values({
          moduleId: mod.id,
          locale: 'en',
          title: m.title,
        });

        let lIdx = 1;
        for (const l of m.lessons) {
          const [les] = await db.insert(schema.lessons).values({
            moduleId: mod.id,
            filePath: l.file,
            orderIndex: lIdx++,
          }).returning();

          await db.insert(schema.lessonTranslations).values({
            lessonId: les.id,
            locale: 'en',
            title: l.title,
            summary: l.summary,
          });
        }
      }
    }
    console.log('[OK] 8 courses with modules and lessons seeded.');

    // 6. Populate 14 Interactive Quizzes across EASY, MEDIUM, HARD
    console.log('[INFO] Populating 14 interactive quizzes...');
    const quizzesSpec = [
      {
        title: 'French Greetings Quiz',
        rules: 'Answer questions regarding greetings. Earn a 50 XP completion bonus + 5 XP per correct answer.',
        difficulty: 'EASY',
        pointValue: 50,
        questions: [
          { q: "How do you say 'Hello' in French?", a: "Au revoir", b: "Bonjour", c: "Merci", d: "S'il vous plaît", correct: 'B' },
          { q: "What does 'Merci beaucoup' mean?", a: "You are welcome", b: "Excuse me", c: "Thank you very much", d: "Please", correct: 'C' },
          { q: "How do you translate 'Good night' in French?", a: "Bonne nuit", b: "Bonjour", c: "Bonsoir", d: "Bon après-midi", correct: 'A' },
          { q: "How do you say 'Goodbye'?", a: "Bienvenue", b: "Salut", c: "Au revoir", d: "Enchanté", correct: 'C' },
        ],
      },
      {
        title: 'French Verb Conjugation (Present)',
        rules: 'Test present tense spelling for verbs ending in -er, -ir, -re, and common irregulars.',
        difficulty: 'MEDIUM',
        pointValue: 100,
        questions: [
          { q: "Conjugate: Je (parler) ____ français.", a: "parle", b: "parles", c: "parlez", d: "parlons", correct: 'A' },
          { q: "Conjugate: Nous (finir) ____ le devoir.", a: "finis", b: "finissez", c: "finissons", d: "finissent", correct: 'C' },
          { q: "Conjugate: Ils (être) ____ étudiants.", a: "suis", b: "êtes", c: "sommes", d: "sont", correct: 'D' },
          { q: "Conjugate: Tu (avoir) ____ un livre.", a: "ai", b: "as", c: "a", d: "avez", correct: 'B' },
        ],
      },
      {
        title: 'French Subjunctive Mood C1',
        rules: 'Evaluate advanced subjunctive triggers after expressions of doubt and emotion.',
        difficulty: 'HARD',
        pointValue: 150,
        questions: [
          { q: "Il faut que tu (faire) ____ attention.", a: "fais", b: "fasses", c: "fera", d: "fasse", correct: 'B' },
          { q: "Bien que nous (savoir) ____ la vérité, nous hésitons.", a: "savons", b: "sachions", c: "sachez", d: "savions", correct: 'B' },
          { q: "Je doute qu'il (pouvoir) ____ venir ce soir.", a: "peut", b: "pourra", c: "puisse", d: "pouvait", correct: 'C' },
        ],
      },
      {
        title: 'Spanish Essentials A1',
        rules: 'Test everyday greetings and fundamental vocabulary in Spanish.',
        difficulty: 'EASY',
        pointValue: 50,
        questions: [
          { q: "How do you say 'Good morning' in Spanish?", a: "Buenas tardes", b: "Buenos días", c: "Buenas noches", d: "Hola", correct: 'B' },
          { q: "What is 'Thank you' in Spanish?", a: "Por favor", b: "De nada", c: "Gracias", d: "Mucho gusto", correct: 'C' },
          { q: "How do you say 'Please'?", a: "Por favor", b: "Disculpe", c: "Perdón", d: "Hola", correct: 'A' },
          { q: "Translate 'Where is the bathroom?':", a: "¿Dónde está el baño?", b: "¿Qué hora es?", c: "¿Cómo te llamas?", d: "¿De dónde eres?", correct: 'A' },
        ],
      },
      {
        title: 'Spanish Numbers & Calendar',
        rules: 'Review days of the week, months, and counting in Spanish.',
        difficulty: 'EASY',
        pointValue: 50,
        questions: [
          { q: "What is the Spanish word for 'Monday'?", a: "Martes", b: "Miércoles", c: "Lunes", d: "Jueves", correct: 'C' },
          { q: "How do you say 'Fifteen' in Spanish?", a: "Cinco", b: "Diez", c: "Quince", d: "Cincuenta", correct: 'C' },
          { q: "Which month comes after 'Abril'?", a: "Marzo", b: "Mayo", c: "Junio", d: "Julio", correct: 'B' },
        ],
      },
      {
        title: 'Spanish Preterite vs Imperfect',
        rules: 'Distinguish between completed past actions and habitual background descriptions.',
        difficulty: 'MEDIUM',
        pointValue: 100,
        questions: [
          { q: "Ayer yo (ir) ____ al mercado.", a: "iba", b: "fui", c: "voy", d: "ido", correct: 'B' },
          { q: "Cuando era niño, siempre (jugar) ____ en el parque.", a: "jugué", b: "jugaba", c: "juego", d: "jugado", correct: 'B' },
          { q: "De repente, (empezar) ____ a llover.", a: "empezaba", b: "empezó", c: "empieza", d: "empezado", correct: 'B' },
        ],
      },
      {
        title: 'Spanish Subjunctive Expressions',
        rules: 'Identify triggers requiring the present subjunctive in Spanish clauses.',
        difficulty: 'HARD',
        pointValue: 150,
        questions: [
          { q: "Espero que tú (tener) ____ un buen viaje.", a: "tienes", b: "tengas", c: "tendrás", d: "tuviste", correct: 'B' },
          { q: "No creo que ellos (saber) ____ la respuesta.", a: "saben", b: "sepan", c: "supieron", d: "sabrán", correct: 'B' },
          { q: "Para que nosotros (llegar) ____ a tiempo, salgamos ahora.", a: "llegamos", b: "lleguemos", c: "llegar", d: "llegaremos", correct: 'B' },
        ],
      },
      {
        title: 'German Articles der/die/das',
        rules: 'Select the proper grammatical gender for German everyday nouns.',
        difficulty: 'EASY',
        pointValue: 50,
        questions: [
          { q: "Which article belongs with 'Buch' (Book)?", a: "der", b: "die", c: "das", d: "den", correct: 'C' },
          { q: "Which article belongs with 'Frau' (Woman)?", a: "der", b: "die", c: "das", d: "dem", correct: 'B' },
          { q: "Which article belongs with 'Mann' (Man)?", a: "der", b: "die", c: "das", d: "des", correct: 'A' },
          { q: "Which article belongs with 'Auto' (Car)?", a: "der", b: "die", c: "das", d: "den", correct: 'C' },
        ],
      },
      {
        title: 'German Everyday Shopping A1',
        rules: 'Key phrases for grocery stores, prices, and quantities in German.',
        difficulty: 'EASY',
        pointValue: 50,
        questions: [
          { q: "How do you ask 'How much does this cost?' in German?", a: "Wie heißen Sie?", b: "Wie viel kostet das?", c: "Wo ist das?", d: "Wie spät ist es?", correct: 'B' },
          { q: "Translate: 'Ich möchte bitte einen Apfel.'", a: "I have an apple", b: "I would like an apple please", c: "The apple is good", d: "Do you have apples?", correct: 'B' },
          { q: "What does 'Die Rechnung bitte' mean?", a: "The bill please", b: "The menu please", c: "Goodbye", d: "Excuse me", correct: 'A' },
        ],
      },
      {
        title: 'German Akkusativ & Dativ Cases',
        rules: 'Practice direct and indirect object pronoun case selection.',
        difficulty: 'MEDIUM',
        pointValue: 100,
        questions: [
          { q: "Ich gebe ____ (the man, dativ) das Buch.", a: "den Mann", b: "dem Mann", c: "der Mann", d: "des Mannes", correct: 'B' },
          { q: "Ich sehe ____ (the dog, akkusativ).", a: "der Hund", b: "den Hund", c: "dem Hund", d: "das Hund", correct: 'B' },
          { q: "Wir helfen ____ (you, formal dativ).", a: "Sie", b: "Ihnen", c: "dich", d: "dir", correct: 'B' },
        ],
      },
      {
        title: 'German Subordinate Conjunctions B1',
        rules: 'Master subordinate syntax (weil, obwohl) vs coordinate syntax (aber, trotzdem).',
        difficulty: 'HARD',
        pointValue: 150,
        questions: [
          { q: "Which conjunction sends the conjugated verb to the end?", a: "aber", b: "denn", c: "weil", d: "oder", correct: 'C' },
          { q: "Fill in: Er ist müde, ____ er hat viel gearbeitet.", a: "weil", b: "denn", c: "obwohl", d: "trotzdem", correct: 'B' },
          { q: "Fill in: Ich gehe joggen, ____ es schneit.", a: "obwohl", b: "weil", c: "aber", d: "oder", correct: 'A' },
        ],
      },
      {
        title: 'Italian Basic Greetings A1',
        rules: 'Practice friendly greetings and polite introductions in Italian.',
        difficulty: 'EASY',
        pointValue: 50,
        questions: [
          { q: "How do you say 'Hello / Goodbye' informally in Italian?", a: "Arrivederci", b: "Ciao", c: "Buongiorno", d: "Prego", correct: 'B' },
          { q: "What does 'Piacere di conoscerti' mean?", a: "See you later", b: "Nice to meet you", c: "How are you?", d: "Thank you", correct: 'B' },
          { q: "How do you say 'Thank you very much'?", a: "Grazie mille", b: "Prego", c: "Per favore", d: "Buona sera", correct: 'A' },
        ],
      },
      {
        title: 'Italian Verb Essentials (Presente)',
        rules: 'Regular -are, -ere, -ire present tense conjugation in Italian.',
        difficulty: 'MEDIUM',
        pointValue: 100,
        questions: [
          { q: "Conjugate: Io (parlare) ____ italiano.", a: "parli", b: "parlo", c: "parla", d: "parliamo", correct: 'B' },
          { q: "Conjugate: Noi (prendere) ____ un caffè.", a: "prendo", b: "prendi", c: "prendiamo", d: "prendono", correct: 'C' },
          { q: "Conjugate: Loro (partire) ____ domani.", a: "parto", b: "partiamo", c: "partono", d: "partite", correct: 'C' },
        ],
      },
      {
        title: 'Multilingual Polyglot Challenge C1',
        rules: 'Complex comparative idioms across Romance and Germanic languages.',
        difficulty: 'HARD',
        pointValue: 200,
        questions: [
          { q: "Which German expression mirrors the French 'Coup de foudre' (love at first sight)?", a: "Schadenfreude", b: "Liebe auf den ersten Blick", c: "Wanderlust", d: "Fernweh", correct: 'B' },
          { q: "What grammatical category does the Spanish 'ojalá' belong to?", a: "Reflexive pronoun", b: "Subjunctive particle", c: "Gerund", d: "Direct object", correct: 'B' },
          { q: "Which Italian phrase means 'To catch two pigeons with one fava bean' (kill two birds with one stone)?", a: "Prendere due piccioni con una fava", b: "In bocca al lupo", c: "Non vedo l'ora", d: "Buon appetito", correct: 'A' },
        ],
      },
    ];

    const insertedQuizzes = [];

    for (const q of quizzesSpec) {
      const [quiz] = await db.insert(schema.quizzes).values({
        difficulty: q.difficulty as any,
        pointValue: q.pointValue,
      }).returning();

      insertedQuizzes.push(quiz);

      await db.insert(schema.quizTranslations).values({
        quizId: quiz.id,
        locale: 'en',
        title: q.title,
        rules: q.rules,
      });

      let qIdx = 1;
      for (const question of q.questions) {
        await db.insert(schema.quizQuestions).values({
          quizId: quiz.id,
          questionText: question.q,
          optionA: question.a,
          optionB: question.b,
          optionC: question.c,
          optionD: question.d,
          correctOption: question.correct as any,
          orderIndex: qIdx++,
        });
      }
    }
    console.log('[OK] 14 quizzes with questions seeded.');

    // 7. Seed Past Quiz Attempts for Student Activity & Analytics
    console.log('[INFO] Seeding past quiz attempts for analytics...');
    const pastAttemptsData = [
      { userId: primaryStudent.id, quizId: insertedQuizzes[0].id, score: 100, passed: true, correct: 4, total: 4 },
      { userId: primaryStudent.id, quizId: insertedQuizzes[1].id, score: 75, passed: true, correct: 3, total: 4 },
      { userId: createdStudents[1].id, quizId: insertedQuizzes[0].id, score: 100, passed: true, correct: 4, total: 4 },
      { userId: createdStudents[1].id, quizId: insertedQuizzes[2].id, score: 100, passed: true, correct: 3, total: 3 },
      { userId: createdStudents[2].id, quizId: insertedQuizzes[3].id, score: 100, passed: true, correct: 4, total: 4 },
      { userId: createdStudents[3].id, quizId: insertedQuizzes[7].id, score: 75, passed: true, correct: 3, total: 4 },
      { userId: createdStudents[4].id, quizId: insertedQuizzes[11].id, score: 100, passed: true, correct: 3, total: 3 },
    ];

    for (const a of pastAttemptsData) {
      await db.insert(schema.quizAttempts).values({
        userId: a.userId,
        quizId: a.quizId,
        score: a.score,
        passed: a.passed,
        correctCount: a.correct,
        totalQuestions: a.total,
        attemptedAt: new Date(),
      });
    }
    console.log('[OK] Quiz attempts seeded.');

    // 8. Seed Badges for Students
    console.log('[INFO] Awarding badges to students...');
    await db.insert(schema.userBadges).values([
      { userId: primaryStudent.id, badgeId: 'scholar_1', unlockedAt: new Date() },
      { userId: primaryStudent.id, badgeId: 'streak_3', unlockedAt: new Date() },
      { userId: createdStudents[1].id, badgeId: 'scholar_1', unlockedAt: new Date() },
      { userId: createdStudents[1].id, badgeId: 'streak_7', unlockedAt: new Date() },
      { userId: createdStudents[1].id, badgeId: 'centurion_streak', unlockedAt: new Date() },
      { userId: createdStudents[1].id, badgeId: 'quiz_master', unlockedAt: new Date() },
      { userId: createdStudents[1].id, badgeId: 'level_5', unlockedAt: new Date() },
      { userId: createdStudents[2].id, badgeId: 'scholar_1', unlockedAt: new Date() },
      { userId: createdStudents[2].id, badgeId: 'streak_7', unlockedAt: new Date() },
      { userId: createdStudents[2].id, badgeId: 'level_5', unlockedAt: new Date() },
    ]);
    console.log('[OK] Badges seeded.');

    // 9. Seed Real Orders across SUCCESS ($189.90), REFUNDED, PENDING
    console.log('[INFO] Seeding orders and transactions for analytics...');
    const ordersData = [
      { userId: primaryStudent.id, courseId: insertedCourses[0].id, status: 'SUCCESS', amount: '0.00', txn: 'txn_free_a1' },
      { userId: createdStudents[1].id, courseId: insertedCourses[1].id, status: 'SUCCESS', amount: '14.99', txn: 'txn_m_a2' },
      { userId: createdStudents[1].id, courseId: insertedCourses[2].id, status: 'SUCCESS', amount: '19.99', txn: 'txn_m_b1' },
      { userId: createdStudents[1].id, courseId: insertedCourses[3].id, status: 'SUCCESS', amount: '24.99', txn: 'txn_m_b2' },
      { userId: createdStudents[2].id, courseId: insertedCourses[1].id, status: 'SUCCESS', amount: '14.99', txn: 'txn_s_a2' },
      { userId: createdStudents[2].id, courseId: insertedCourses[6].id, status: 'SUCCESS', amount: '19.99', txn: 'txn_s_it' },
      { userId: createdStudents[3].id, courseId: insertedCourses[2].id, status: 'SUCCESS', amount: '19.99', txn: 'txn_l_b1' },
      { userId: createdStudents[4].id, courseId: insertedCourses[5].id, status: 'SUCCESS', amount: '14.99', txn: 'txn_e_es' },
      { userId: createdStudents[5].id, courseId: insertedCourses[6].id, status: 'SUCCESS', amount: '19.99', txn: 'txn_mat_it' },
      { userId: createdStudents[6].id, courseId: insertedCourses[7].id, status: 'SUCCESS', amount: '29.99', txn: 'txn_ch_c1' },
      { userId: createdStudents[7].id, courseId: insertedCourses[2].id, status: 'REFUNDED', amount: '19.99', txn: 'txn_ref_b1' },
      { userId: createdStudents[8].id, courseId: insertedCourses[5].id, status: 'PENDING', amount: '14.99', txn: 'txn_pen_es' },
    ];

    for (const o of ordersData) {
      await db.insert(schema.orders).values({
        userId: o.userId,
        courseId: o.courseId,
        status: o.status as any,
        transactionId: o.txn,
        amount: o.amount,
        createdAt: new Date(),
      });
    }
    console.log('[OK] Orders seeded ($189.90 processed revenue).');

    // 10. Seed Feature Flags
    console.log('[INFO] Seeding default feature flags...');
    await db.insert(schema.featureFlags).values([
      { key: 'courseRecommendations', enabled: true, description: 'Enable ML course recommendations' },
      { key: 'streakMultiplier', enabled: true, description: 'Double XP on 7+ day streaks' },
      { key: 'maintenanceMode', enabled: false, description: 'Site-wide maintenance banner' },
      { key: 'betaAnalytics', enabled: true, description: 'New analytics dashboard for admins' },
    ]);

    // 11. Seed Site Configuration
    console.log('[INFO] Seeding site configuration and tips...');
    await db.insert(schema.siteConfig).values([
      { key: 'dailyTip', value: 'Practice vocabulary for 15 minutes each day to solidify neural connections and lock in your streak!' },
      { key: 'announcement', value: 'Welcome to the Antigravity LMS cohort! New CEFR B2 and C1 courses are now active.' },
      { key: 'showBanner', value: 'true' },
    ]);

    console.log('[OK] Comprehensive seeding process completed successfully!');
  } catch (error) {
    console.error('[ERROR] Error during seeding process:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
