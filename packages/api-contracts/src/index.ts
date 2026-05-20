// API Contracts shared between frontend and backend
export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  courses: {
    list: '/api/courses',
    get: (id: string) => `/api/courses/${id}`,
    purchase: (id: string) => `/api/courses/${id}/purchase`,
  },
  quizzes: {
    list: '/api/quizzes',
    submit: (id: string) => `/api/quizzes/${id}/submit`,
  },
  gamification: {
    leaderboard: '/api/gamification/leaderboard',
    profile: '/api/gamification/profile',
  }
};
