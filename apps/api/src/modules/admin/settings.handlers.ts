import { FastifyRequest, FastifyReply } from 'fastify';

// In-memory mock for site settings
let mockSettings = {
  activeBanner: 'Welcome to our platform! New language courses are available.',
  bannerEnabled: true,
  maintenanceMode: false,
  dailyTip: 'Practice for 15 minutes a day to maintain your streak!',
  availableBadges: [
    { id: 'scholar_1', name: 'First Steps Scholar', icon: 'Award' },
    { id: 'streak_3', name: 'Dedicated Learner', icon: 'Flame' },
    { id: 'level_5', name: 'Fluent Speaker', icon: 'Sparkles' }
  ]
};

export const getSiteSettingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    reply.status(200).send(mockSettings);
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const updateSiteSettingsHandler = async (request: FastifyRequest<{ Body: typeof mockSettings }>, reply: FastifyReply) => {
  try {
    const newSettings = request.body;
    mockSettings = { ...mockSettings, ...newSettings };
    reply.status(200).send({ success: true, message: 'Settings updated successfully', settings: mockSettings });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    reply.status(500).send({ error: 'Internal Server Error' });
  }
};
