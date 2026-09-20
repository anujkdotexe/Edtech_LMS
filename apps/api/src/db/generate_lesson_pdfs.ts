import fs from 'fs';
import path from 'path';

function generateSimplePdf(title: string, subtitle: string, bodyLines: string[]): Buffer {
  const content = [
    'BT',
    '/F1 20 Tf',
    '50 720 Td',
    `(${title.replace(/[()\\]/g, '')}) Tj`,
    '/F1 12 Tf',
    '0 -30 Td',
    `(${subtitle.replace(/[()\\]/g, '')}) Tj`,
    '0 -30 Td',
    ...bodyLines.map((line) => `(${line.replace(/[()\\]/g, '')}) Tj 0 -18 Td`),
    'ET',
  ].join('\n');

  const streamLength = Buffer.byteLength(content);

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let offset = 9; // length of "%PDF-1.4\n"
  const xref = ['xref\n0 6\n0000000000 65535 f \n'];
  let body = '%PDF-1.4\n';

  for (let i = 0; i < objects.length; i++) {
    xref.push(String(offset).padStart(10, '0') + ' 00000 n \n');
    body += objects[i];
    offset += Buffer.byteLength(objects[i]);
  }

  const startxref = offset;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  return Buffer.from(body + xref.join('') + trailer, 'latin1');
}

export function createSamplePdfs(targetDir: string) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const pdfFiles: Record<string, { title: string; subtitle: string; lines: string[] }> = {
    'french_a1_pronunciation.pdf': {
      title: 'Elementary French A1 - Pronunciation Guide',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Vowels and Nasal Sounds (an, en, in, on, un)',
        '2. Accents: Aigu (e), Grave (e, a, u), Circonflexe (e, a, i, o, u)',
        '3. Silent final consonants: -s, -t, -d, -x are usually silent',
        '4. Liaison: Connecting final silent consonant to next vowel sound',
        'Practice aloud daily to build muscle memory and accent clarity.',
      ],
    },
    'french_a1_greetings.pdf': {
      title: 'Elementary French A1 - Common Greetings',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Formal: Bonjour (Day), Bonsoir (Evening), Au revoir (Goodbye)',
        '2. Informal: Salut (Hi/Bye), Ca va? (How is it going?)',
        '3. Politeness: S il vous plait (Formal please), Merci beaucoup (Thanks)',
        '4. Introductions: Je m appelle... (My name is...), Enchante (Nice to meet you)',
        'Review these greeting formulas before attempting the French Greetings Quiz.',
      ],
    },
    'french_a1_food.pdf': {
      title: 'Elementary French A1 - Food & Cafe Etiquette',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Ordering: Je voudrais un cafe, s il vous plait.',
        '2. Breakfast items: Le croissant, la baguette, le beurre, la confiture.',
        '3. Asking for the bill: L addition, s il vous plait.',
        '4. Dining times and culture in Parisian cafes.',
      ],
    },
    'french_a2_travel.pdf': {
      title: 'Conversational French A2 - Travel & Transportation',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Buying train tickets (billet aller-retour, place cote fenetre).',
        '2. Asking for directions: Ou se trouve la gare la plus proche?',
        '3. Checking into a hotel: J ai une reservation au nom de...',
        '4. Useful travel emergency phrases.',
      ],
    },
    'french_a2_past_tense.pdf': {
      title: 'Conversational French A2 - Passe Compose Mastery',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Auxiliary verbs: Avoir vs Etre.',
        '2. DR MRS VANDERTRAMP movement verbs with Etre.',
        '3. Past participle agreements with subjects and direct objects.',
        '4. Irregular past participles: fait, pris, vu, bu, eu.',
      ],
    },
    'german_b1_opinions.pdf': {
      title: 'Intermediate German B1 - Stating Opinions and Debating',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Meinungsäusserung: Meiner Meinung nach... (In my opinion...)',
        '2. Subordinate clauses: Ich glaube, dass... (Verb sent to the end).',
        '3. Stating agreements: Da stimme ich dir vollkommen zu.',
        '4. Polite disagreements: Das sehe ich allerdings etwas anders.',
      ],
    },
    'german_b1_connectors.pdf': {
      title: 'Intermediate German B1 - Complex Connectors',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Coordinating connectors (ADUSO): aber, denn, und, sondern, oder.',
        '2. Subordinating connectors: weil, obwohl, da, damit, sodass.',
        '3. Two-part connectors: sowohl... als auch, weder... noch.',
        '4. Word order rules for main vs subordinate clauses.',
      ],
    },
    'german_b2_workplace.pdf': {
      title: 'Advanced German B2 - Business & Workplace Communication',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Formal email etiquette: Sehr geehrte Damen und Herren, Mit freundlichen Grussen.',
        '2. Presenting projects and handling Q&A in German meetings.',
        '3. Passive voice in technical descriptions: Es wird empfohlen, dass...',
        '4. Konjunktiv II for polite suggestions and hypothetical scenarios.',
      ],
    },
    'spanish_a1_basics.pdf': {
      title: 'Spanish for Beginners A1 - Pronunciation & Essentials',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Spanish vowel purity: a, e, i, o, u never change sound.',
        '2. Rolling R (doble erre) and soft r sounds.',
        '3. Key pronouns: yo, tu, el, ella, usted, nosotros, ellos.',
        '4. Common polite phrases: Por favor, Muchas gracias, De nada.',
      ],
    },
    'spanish_a1_family.pdf': {
      title: 'Spanish for Beginners A1 - Family & Descriptions',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Family members: el padre, la madre, los hermanos, los abuelos.',
        '2. Adjective agreement in gender and number (alto/alta/altos/altas).',
        '3. Verb Ser vs Estar for permanent vs temporary states.',
        '4. Describing physical appearance and personality.',
      ],
    },
    'spanish_a2_daily_routine.pdf': {
      title: 'Spanish Everyday Fluency A2 - Daily Routine & Reflexives',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Reflexive verbs: levantarse, ducharse, vestirse, acostarse.',
        '2. Reflexive pronouns: me, te, se, nos, os, se.',
        '3. Frequency adverbs: siempre, a menudo, a veces, nunca.',
        '4. Sequencing words: primero, luego, despues, finalmente.',
      ],
    },
    'italian_b1_culture.pdf': {
      title: 'Italian Cultural Expressions B1 - Idioms & Conversational Nuance',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. In bocca al lupo! (Good luck!) -> Crepi il lupo!',
        '2. Non vedo l ora! (I cannot wait!)',
        '3. Chi dorme non piglia pesci (The early bird catches the worm).',
        '4. Nuances of Italian gesture and conversational pacing.',
      ],
    },
    'spanish_c1_business.pdf': {
      title: 'Professional Spanish Mastery C1 - Negotiations & Economics',
      subtitle: 'Antigravity LMS Core Syllabus Resource',
      lines: [
        '1. Formal negotiation syntax and conditional concessions.',
        '2. Advanced subjunctive clauses expressing hypothetical risks.',
        '3. Economic terminology: la tasa de interes, el balance general, la rentabilidad.',
        '4. Delivering persuasive keynote speeches in Spanish.',
      ],
    },
  };

  for (const [filename, data] of Object.entries(pdfFiles)) {
    const filePath = path.join(targetDir, filename);
    const pdfBuf = generateSimplePdf(data.title, data.subtitle, data.lines);
    fs.writeFileSync(filePath, pdfBuf);
  }
}
