import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import * as schema from '../../db/schema';

// Default settings seeded on first read if DB has nothing
const DEFAULTS: Record<string, string> = {
  activeBanner: 'Welcome to our platform! New language courses are available.',
  bannerEnabled: 'true',
  maintenanceMode: 'false',
  dailyTip: 'Practice for 15 minutes a day to maintain your streak!',
};

/** Reads all site_config rows from DB and merges with defaults */
const readSettings = async () => {
  const rows = await db.select().from(schema.siteConfig);
  const dbMap: Record<string, string> = {};
  for (const row of rows) {
    dbMap[row.key] = row.value;
  }

  // Seed any missing defaults into the DB on first access
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!(key in dbMap)) {
      await db.insert(schema.siteConfig).values({ key, value }).onConflictDoNothing();
      dbMap[key] = value;
    }
  }

  return {
    activeBanner: dbMap['activeBanner'] ?? DEFAULTS.activeBanner,
    bannerEnabled: dbMap['bannerEnabled'] === 'true',
    maintenanceMode: dbMap['maintenanceMode'] === 'true',
    dailyTip: dbMap['dailyTip'] ?? DEFAULTS.dailyTip,
  };
};

export const getSiteSettingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const settings = await readSettings();
    reply.status(200).send(settings);
  } catch (error) {
    console.error('[ERROR] Error fetching settings:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getPublicSettingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const settings = await readSettings();
    reply.status(200).send(settings);
  } catch (error) {
    console.error('[ERROR] Error fetching settings:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

interface UpdateSettingsBody {
  activeBanner?: string;
  bannerEnabled?: boolean;
  maintenanceMode?: boolean;
  dailyTip?: string;
}

export const updateSiteSettingsHandler = async (
  request: FastifyRequest<{ Body: UpdateSettingsBody }>,
  reply: FastifyReply
) => {
  try {
    const body = request.body;
    const updates: Record<string, string> = {};

    if (body.activeBanner !== undefined) updates['activeBanner'] = body.activeBanner;
    if (body.bannerEnabled !== undefined) updates['bannerEnabled'] = String(body.bannerEnabled);
    if (body.maintenanceMode !== undefined) updates['maintenanceMode'] = String(body.maintenanceMode);
    if (body.dailyTip !== undefined) updates['dailyTip'] = body.dailyTip;

    // Upsert each key into the DB
    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(schema.siteConfig)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: schema.siteConfig.key,
          set: { value, updatedAt: new Date() },
        });
    }

    const settings = await readSettings();
    reply.status(200).send({ success: true, message: 'Settings saved to database', settings });
  } catch (error) {
    console.error('[ERROR] Error updating settings:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
