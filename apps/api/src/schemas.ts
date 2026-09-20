import { FastifySchema } from 'fastify';

// 1. System Health Schema
export const healthSchema: FastifySchema = {
  description: 'Get backend system health status',
  tags: ['System'],
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2026-05-21T09:10:27Z' }
      }
    }
  }
};

export const publicSettingsSchema: FastifySchema = {
  description: 'Retrieve public site announcements and rotating daily tips',
  tags: ['System'],
  response: {
    200: {
      type: 'object',
      properties: {
        activeBanner: { type: 'string', example: 'Welcome to our platform!' },
        bannerEnabled: { type: 'boolean', example: true },
        dailyTip: { type: 'string', example: 'Practice every day to maintain your streak!' }
      }
    }
  }
};

// 2. Authentication Router Schemas
export const signupSchema: FastifySchema = {
  description: 'Register a new student account',
  tags: ['Authentication'],
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, example: 'John Doe' },
      email: { type: 'string', format: 'email', example: 'student@lms.local' },
      password: { type: 'string', minLength: 6, example: 'password123' },
      avatarUrl: { type: 'string', example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'student@lms.local' },
        role: { type: 'string', example: 'STUDENT' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
        forcePasswordReset: { type: 'boolean', example: false },
        lastLoginAt: { type: 'string', nullable: true }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Bad Request' },
        message: { type: 'string', example: 'A user with this email address already exists' }
      }
    }
  }
};

export const loginSchema: FastifySchema = {
  description: 'Log in to user account and receive authentication cookies',
  tags: ['Authentication'],
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'student@lms.local' },
      password: { type: 'string', example: 'password123' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'student@lms.local' },
        role: { type: 'string', example: 'STUDENT' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
        forcePasswordReset: { type: 'boolean', example: false }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Unauthorized' },
        message: { type: 'string', example: 'Invalid email or password' }
      }
    }
  }
};

export const refreshSchema: FastifySchema = {
  description: 'Refresh the current authentication session using HTTP-only cookies',
  tags: ['Authentication'],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Unauthorized' },
        message: { type: 'string', example: 'No active session' }
      }
    }
  }
};

export const logoutSchema: FastifySchema = {
  description: 'Log out the current user and clear session cookies',
  tags: ['Authentication'],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' }
      }
    }
  }
};

export const forgotPasswordSchema: FastifySchema = {
  description: 'Request a password reset link via email',
  tags: ['Authentication'],
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'student@lms.local' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset link sent to your email' }
      }
    }
  }
};

export const resetPasswordSchema: FastifySchema = {
  description: 'Reset password using a valid reset token',
  tags: ['Authentication'],
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', example: 'reset-token-uuid' },
      newPassword: { type: 'string', minLength: 6, example: 'newpassword123' },
      password: { type: 'string', minLength: 6, example: 'newpassword123' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password has been reset successfully' }
      }
    }
  }
};

export const googleOAuthSchema: FastifySchema = {
  description: 'Register or log in a student account using Google OAuth',
  tags: ['Authentication'],
  body: {
    type: 'object',
    required: ['email', 'name'],
    properties: {
      email: { type: 'string', format: 'email', example: 'student@lms.local' },
      name: { type: 'string', example: 'John Doe' },
      avatarUrl: { type: 'string', example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
      credentialToken: { type: 'string', example: 'mock-oauth-token' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'student@lms.local' },
        role: { type: 'string', example: 'STUDENT' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
        forcePasswordReset: { type: 'boolean', example: false }
      }
    }
  }
};

export const getMeSchema: FastifySchema = {
  description: 'Get lightweight session profile of current authenticated user',
  tags: ['Authentication'],
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'student@lms.local' },
        role: { type: 'string', example: 'STUDENT' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
        forcePasswordReset: { type: 'boolean', example: false },
        lastLoginAt: { type: 'string', nullable: true, example: '2026-05-21T09:10:27Z' },
      },
    },
    401: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        error: { type: 'string', example: 'Unauthorized' },
        message: { type: 'string', example: 'Not authenticated' },
      },
    },
  },
};

// 3. Syllabus & Course Catalog Router Schemas
export const coursesSchema: FastifySchema = {
  description: 'Retrieve all available courses with localized title/description and purchase status',
  tags: ['Courses'],
  headers: {
    type: 'object',
    properties: {
      'accept-language': { type: 'string', example: 'en', description: 'Preferred locale fallback (en, es, etc.)' }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'course-uuid' },
          cefrLevel: { type: 'string', example: 'A1' },
          price: { type: 'number', example: 19.99 },
          isPremium: { type: 'boolean', example: true },
          isPublished: { type: 'boolean', example: true },
          isUnlocked: { type: 'boolean', example: true },
          title: { type: 'string', example: 'Spanish for Beginners' },
          description: { type: 'string', example: 'Learn basic Spanish conversation, vocabulary, and grammar.' }
        }
      }
    }
  }
};

export const createCourseSchema: FastifySchema = {
  description: 'Create a new course (Admin/Developer only)',
  tags: ['Courses'],
  body: {
    type: 'object',
    required: ['cefrLevel', 'price', 'isPremium', 'isPublished', 'title', 'description'],
    properties: {
      cefrLevel: { type: 'string', example: 'A1' },
      price: { type: 'number', example: 19.99 },
      isPremium: { type: 'boolean', example: true },
      isPublished: { type: 'boolean', example: false },
      title: { type: 'string', example: 'French A1' },
      description: { type: 'string', example: 'Introductory French course' },
      language: { type: 'string', example: 'fr' },
      locale: { type: 'string', example: 'fr' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        course: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'course-uuid' },
            cefrLevel: { type: 'string', example: 'A1' },
            price: { type: 'number', example: 19.99 },
            isPremium: { type: 'boolean', example: true },
            isPublished: { type: 'boolean', example: false }
          }
        }
      }
    }
  }
};

export const courseByIdSchema: FastifySchema = {
  description: 'Get details and syllabus modules/lessons for a course by ID',
  tags: ['Courses'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'course-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'course-uuid' },
        cefrLevel: { type: 'string', example: 'A1' },
        price: { type: 'number', example: 19.99 },
        isPremium: { type: 'boolean', example: true },
        isPublished: { type: 'boolean', example: true },
        isUnlocked: { type: 'boolean', example: true },
        progressPercent: { type: 'number', example: 50 },
        title: { type: 'string', example: 'Spanish A1' },
        description: { type: 'string', example: 'Spanish details' },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'module-uuid' },
              orderIndex: { type: 'number', example: 1 },
              title: { type: 'string', example: 'Greetings' },
              lessons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'lesson-uuid' },
                    orderIndex: { type: 'number', example: 1 },
                    title: { type: 'string', example: 'Saying Hola' },
                    summary: { type: 'string', example: 'Basics of greeting' },
                    filePath: { type: 'string', nullable: true, example: '/public/uploads/pdf-slug.pdf' },
                    lessonType: { type: 'string', example: 'VIDEO' },
                    durationSeconds: { type: 'number', example: 300 },
                    isFreePreview: { type: 'boolean', example: false },
                    isCompleted: { type: 'boolean', example: false }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const updateCourseSchema: FastifySchema = {
  description: 'Update an existing course details (Admin/Developer only)',
  tags: ['Courses'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'course-uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      cefrLevel: { type: 'string', example: 'A2' },
      price: { type: 'number', example: 24.99 },
      isPremium: { type: 'boolean', example: true },
      isPublished: { type: 'boolean', example: true },
      title: { type: 'string', example: 'Updated Spanish A1' },
      description: { type: 'string', example: 'Updated description' },
      language: { type: 'string', example: 'es' },
      locale: { type: 'string', example: 'es' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Course updated successfully' }
      }
    }
  }
};

export const deleteCourseSchema: FastifySchema = {
  description: 'Delete a course and all its modules/lessons (Admin/Developer only)',
  tags: ['Courses'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'course-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Course and all related contents deleted' }
      }
    }
  }
};

export const purchaseCourseSchema: FastifySchema = {
  description: 'Purchase access to a premium course (Student only)',
  tags: ['Courses'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'course-uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      simulatedStatus: { type: 'string', enum: ['SUCCESS', 'FAILED'], example: 'SUCCESS' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Course unlocked successfully' },
        transactionId: { type: 'string', example: 'TXN-98425102' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Simulated payment failed' },
        transactionId: { type: 'string', example: 'TXN-98425102' }
      }
    }
  }
};

export const completeLessonSchema: FastifySchema = {
  description: 'Mark a lesson as completed by the student and award XP and streak progress',
  tags: ['Courses'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'lesson-uuid' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        completed: { type: 'boolean', example: true },
        alreadyCompleted: { type: 'boolean', example: false },
        xpEarned: { type: 'number', example: 15 },
        currentStreak: { type: 'number', example: 3 },
        longestStreak: { type: 'number', example: 5 },
        didLevelUp: { type: 'boolean', example: false },
        newLevel: { type: 'number', example: 1 },
        newBadges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              badgeId: { type: 'string', example: 'scholar_1' },
              name: { type: 'string', example: 'First Steps Scholar' },
            },
          },
        },
        message: { type: 'string', example: 'Lesson completed' },
      },
    },
  },
};

// 4. Interactive Gamified MCQ Quiz Router Schemas
export const quizzesSchema: FastifySchema = {
  description: 'Retrieve a list of all available quizzes with XP values and localization',
  tags: ['Quizzes'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'quiz-uuid' },
          title: { type: 'string', example: 'Greetings MCQ Quiz' },
          rules: { type: 'string', example: 'Test your understanding of basic greetings.' },
          difficulty: { type: 'string', example: 'EASY' },
          pointValue: { type: 'number', example: 50 },
          courseId: { type: 'string', nullable: true },
          xpReward: { type: 'number', nullable: true },
          passingScore: { type: 'number', nullable: true },
          description: { type: 'string', nullable: true },
        }
      }
    }
  }
};

export const quizByIdSchema: FastifySchema = {
  description: 'Get quiz questions with multi-choice options (Student only)',
  tags: ['Quizzes'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'quiz-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'quiz-uuid' },
        title: { type: 'string', example: 'Greetings MCQ Quiz' },
        rules: { type: 'string', example: 'Answer all questions.' },
        difficulty: { type: 'string', example: 'EASY' },
        pointValue: { type: 'number', example: 100 },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'question-uuid' },
              questionText: { type: 'string', example: 'What does "Hola" mean?' },
              optionA: { type: 'string', example: 'Hello' },
              optionB: { type: 'string', example: 'Goodbye' },
              optionC: { type: 'string', example: 'Thank you' },
              optionD: { type: 'string', example: 'Please' },
              orderIndex: { type: 'number', example: 1 }
            }
          }
        }
      }
    }
  }
};

export const submitQuizSchema: FastifySchema = {
  description: 'Submit answers for a quiz and obtain XP/Streak status (Student only)',
  tags: ['Quizzes'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'quiz-uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['answers'],
    properties: {
      answers: {
        type: 'array',
        items: {
          type: 'object',
          required: ['questionId', 'selectedOption'],
          properties: {
            questionId: { type: 'string', example: 'question-uuid' },
            selectedOption: { type: 'string', example: 'Hello' }
          }
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        score: { type: 'number', example: 100 },
        passed: { type: 'boolean', example: true },
        correctCount: { type: 'number', example: 4 },
        totalQuestions: { type: 'number', example: 5 },
        xpEarned: { type: 'number', example: 100 },
        newTotalXp: { type: 'number', example: 550 },
        didLevelUp: { type: 'boolean', example: false },
        newLevel: { type: 'number', example: 2 },
        currentStreak: { type: 'number', example: 3 },
        badgesUnlocked: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              badgeId: { type: 'string', example: 'scholar_1' },
              name: { type: 'string', example: 'First Steps Scholar' }
            }
          }
        }
      }
    }
  }
};

// 5. User Profile Stats Grid Router Schemas
export const profileSchema: FastifySchema = {
  description: 'Get logged-in user profile, levels, streak status, badges, order and quiz histories',
  tags: ['Profile'],
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'student@lms.local' },
        role: { type: 'string', example: 'STUDENT' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
        impersonatedBy: { type: 'string', nullable: true, example: 'dev-uuid' },
        stats: {
          type: 'object',
          properties: {
            totalXp: { type: 'number', example: 550 },
            level: { type: 'number', example: 2 },
            xpInLevel: { type: 'number', example: 50 },
            xpNeededForNextLevel: { type: 'number', example: 250 },
            progressPercent: { type: 'number', example: 20 },
            currentStreak: { type: 'number', example: 3 },
            longestStreak: { type: 'number', example: 5 },
            lastActiveDate: { type: 'string', nullable: true, example: '2026-05-20' },
            warmupCompletedToday: { type: 'boolean', example: false }
          }
        },
        badges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              badgeId: { type: 'string', example: 'scholar_1' },
              name: { type: 'string', example: 'First Steps Scholar' },
              description: { type: 'string', example: 'Passed your first language quiz!' },
              unlockedAt: { type: 'string', example: '2026-05-21T09:10:27Z' }
            }
          }
        },
        purchaseHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'order-uuid' },
              amount: { type: 'string', example: '19.99' },
              createdAt: { type: 'string', example: '2026-05-21T09:10:27Z' },
              courseTitle: { type: 'string', example: 'Spanish for Beginners' }
            }
          }
        },
        quizHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'attempt-uuid' },
              score: { type: 'number', example: 90 },
              passed: { type: 'boolean', example: true },
              attemptedAt: { type: 'string', example: '2026-05-21T09:10:27Z' },
              quizTitle: { type: 'string', example: 'Greetings MCQ Quiz' }
            }
          }
        },
        activityFeed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string', example: 'Completed quiz: Greetings MCQ Quiz with 90%' },
              date: { type: 'string', example: '2026-05-21T09:10:27Z' }
            }
          }
        }
      }
    }
  }
};

export const updateProfileSchema: FastifySchema = {
  description: 'Update user profile details (name, password, avatarUrl)',
  tags: ['Profile'],
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2, example: 'Johnny Doe' },
      avatarUrl: { type: 'string', example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Johnny' },
      currentPassword: { type: 'string', minLength: 6, example: 'oldpassword123' },
      password: { type: 'string', minLength: 6, example: 'newpassword123' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid' },
        name: { type: 'string', example: 'Johnny Doe' },
        email: { type: 'string', example: 'john@example.com' },
        avatarUrl: { type: ['string', 'null'], example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Johnny' },
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile updated successfully' }
      }
    }
  }
};

export const getDailyWarmupSchema: FastifySchema = {
  description: 'Retrieve today\'s dynamic 30-second vocab warmup challenge',
  tags: ['Profile'],
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        challengeId: { type: 'string', example: 'vocab_fr_book' },
        language: { type: 'string', example: 'French' },
        prompt: { type: 'string', example: 'Choose the correct French translation for "The Book":' },
        options: { type: 'array', items: { type: 'string' } },
        completedToday: { type: 'boolean', example: false },
        xpReward: { type: 'number', example: 25 },
      },
    },
  },
};

export const claimWarmupSchema: FastifySchema = {
  description: 'Claim daily warmup XP (+25 XP) and update study streak (server-side gated once per day)',
  tags: ['Profile'],
  body: {
    type: 'object',
    required: ['challengeId', 'answer'],
    properties: {
      challengeId: { type: 'string', example: 'vocab_fr_book' },
      answer: { type: 'string', example: 'Le livre' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        claimed: { type: 'boolean', example: true },
        alreadyClaimed: { type: 'boolean', example: false },
        xpAwarded: { type: 'number', example: 25 },
        newTotalXp: { type: 'number', example: 145 },
        newLevel: { type: 'number', example: 1 },
        didLevelUp: { type: 'boolean', example: false },
        currentStreak: { type: 'number', example: 3 },
        longestStreak: { type: 'number', example: 5 },
        newBadges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              badgeId: { type: 'string', example: 'scholar_1' },
              name: { type: 'string', example: 'First Steps Scholar' },
            },
          },
        },
        message: { type: 'string', example: 'Daily warmup completed!' },
      },
    },
  },
};

// 6. Weekly Leaderboard Router Schemas
export const leaderboardSchema: FastifySchema = {
  description: 'Retrieve the top weekly players based on total XP',
  tags: ['Leaderboard'],
  response: {
    200: {
      type: 'object',
      properties: {
        leaderboard: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user-uuid' },
              name: { type: 'string', example: 'John Doe' },
              avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
              totalXp: { type: 'number', example: 550 },
              level: { type: 'number', example: 2 },
              rank: { type: 'number', example: 1 }
            }
          }
        },
        currentUserRank: { type: 'number', nullable: true, example: 1 },
        currentUserXp: { type: 'number', example: 550 }
      }
    }
  }
};

// 7. Developer Router Schemas
export const devImpersonateSchema: FastifySchema = {
  description: 'Impersonate another user by email (Developer only)',
  tags: ['Developer Tools'],
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', example: 'student@lms.local' },
      studentEmail: { type: 'string', format: 'email', example: 'student@lms.local' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Impersonating student@lms.local' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'student@lms.local' },
            role: { type: 'string', example: 'STUDENT' }
          }
        }
      }
    }
  }
};

export const devUnimpersonateSchema: FastifySchema = {
  description: 'Revert impersonation and restore original developer session',
  tags: ['Developer Tools'],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Restored developer session' }
      }
    }
  }
};

export const devLogsSchema: FastifySchema = {
  description: 'Fetch recent system audit logs (Developer only)',
  tags: ['Developer Tools'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'log-uuid' },
          userEmail: { type: 'string', example: 'student@lms.local' },
          impersonatorEmail: { type: 'string', nullable: true, example: 'dev@lms.local' },
          action: { type: 'string', example: 'USER_LOGIN' },
          details: { type: 'string', example: 'Developer initiated session takeover' },
          ipAddress: { type: 'string', example: '127.0.0.1' },
          createdAt: { type: 'string', example: '2026-05-21T09:10:27Z' }
        }
      }
    }
  }
};

export const devHealthSchema: FastifySchema = {
  description: 'Get deep diagnostic metrics of DB, Storage, and memory usage (Developer only)',
  tags: ['Developer Tools'],
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        database: {
          type: 'object',
          properties: {
            totalUsersCount: { type: 'number', example: 10 },
            totalCoursesCount: { type: 'number', example: 5 },
            totalOrdersCount: { type: 'number', example: 8 }
          }
        },
        system: {
          type: 'object',
          properties: {
            platform: { type: 'string', example: 'linux' },
            arch: { type: 'string', example: 'x64' },
            uptimeSeconds: { type: 'number', example: 3600 },
            freeMemoryBytes: { type: 'number', example: 4294967296 },
            totalMemoryBytes: { type: 'number', example: 17179869184 },
            cpuCores: { type: 'number', example: 8 }
          }
        }
      }
    }
  }
};

export const devOverrideSchema: FastifySchema = {
  description: 'Developer administrative state override tool (Developer only)',
  tags: ['Developer Tools'],
  body: {
    type: 'object',
    required: ['targetUserId', 'action'],
    properties: {
      targetUserId: { type: 'string', example: 'user-uuid' },
      action: { type: 'string', enum: ['AWARD_XP', 'RESET_STREAK', 'REVOKE_COURSE'], example: 'AWARD_XP' },
      value: { type: 'string', example: '100' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Override action executed successfully' }
      }
    }
  }
};

export const devAdvancedLogsSchema: FastifySchema = {
  description: 'Retrieve real-time database query, storage, and webhook trace logs (Developer only)',
  tags: ['Developer Tools'],
  response: {
    200: {
      type: 'object',
      properties: {
        dbQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string', example: '2026-05-21T09:10:25Z' },
              query: { type: 'string', example: 'SELECT * FROM users WHERE email = $1 LIMIT 1' },
              duration: { type: 'string', example: '12ms' }
            }
          }
        },
        webhooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string', example: '2026-05-21T09:10:27Z' },
              event: { type: 'string', example: 'payment.success' },
              payload: { type: 'string', example: '{ orderId: "123" }' },
              status: { type: 'string', example: '200 OK' }
            }
          }
        },
        storage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string', example: '2026-05-21T09:10:26Z' },
              action: { type: 'string', example: 'FILE_UPLOAD' },
              path: { type: 'string', example: '/uploads/courses/pdf_1.pdf' },
              size: { type: 'string', example: '2.4MB' }
            }
          }
        }
      }
    }
  }
};

// 8. CRM Admin Router Schemas
export const adminImportStudentsSchema: FastifySchema = {
  description: 'Bulk import students from a JSON file (Admin/Developer only)',
  tags: ['Admin CRM'],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        count: { type: 'number', example: 5 },
        message: { type: 'string', example: 'Successfully imported 5 students' }
      }
    }
  }
};

export const adminGetStudentsSchema: FastifySchema = {
  description: 'List all registered students in the CRM ledger (Admin/Developer only)',
  tags: ['Admin CRM'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-uuid' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'student@lms.local' },
          role: { type: 'string', example: 'STUDENT' },
          isSuspended: { type: 'boolean', example: false },
          createdAt: { type: 'string', example: '2026-05-21T09:10:27Z' },
          level: { type: 'number', example: 2 },
          totalXp: { type: 'number', example: 550 },
          currentStreak: { type: 'number', example: 3 }
        }
      }
    }
  }
};

export const adminSuspendStudentSchema: FastifySchema = {
  description: 'Suspend or lift suspension for a student (Admin/Developer only)',
  tags: ['Admin CRM'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'user-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Student status updated successfully' }
      }
    }
  }
};

export const adminResetStudentPasswordSchema: FastifySchema = {
  description: 'Administratively reset a student\'s password (Admin/Developer only)',
  tags: ['Admin CRM'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'user-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        tempPassword: { type: 'string', example: 'a1b2c3d4A1!' },
        message: { type: 'string', example: 'Student password reset successfully' }
      }
    }
  }
};

export const adminDeleteStudentSchema: FastifySchema = {
  description: 'Permanently delete a student and scrub all cascading records (Admin/Developer only)',
  tags: ['Admin CRM'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'user-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Student account and all cascade data removed successfully' }
      }
    }
  }
};

export const adminEnrollStudentSchema: FastifySchema = {
  description: 'Manually enroll a student in a course (Admin/Developer only)',
  tags: ['Admin CRM'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'student-uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['courseId'],
    properties: {
      courseId: { type: 'string', example: 'course-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Student enrolled in course successfully' }
      }
    },
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Course assigned successfully' }
      }
    }
  }
};

export const adminExportStudentsSchema: FastifySchema = {
  description: 'Export all students as CSV ledger format (Admin/Developer only)',
  tags: ['Admin CRM'],
  response: {
    200: {
      type: 'string',
      example: 'ID,Name,Email,Join Date,Suspended\n...'
    }
  }
};

export const adminAddStudentSchema: FastifySchema = {
  description: 'Administratively add single student account (Admin/Developer only)',
  tags: ['Admin CRM'],
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 2, example: 'Alice Smith' },
      email: { type: 'string', format: 'email', example: 'alice@lms.local' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Student account created and welcome email dispatched successfully.' },
        tempPassword: { type: 'string', example: 'a1b2c3d4A1!' },
        student: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid' },
            name: { type: 'string', example: 'Alice Smith' },
            email: { type: 'string', example: 'alice@lms.local' }
          }
        }
      }
    }
  }
};

export const adminBulkEnrollStudentsSchema: FastifySchema = {
  description: 'Bulk enroll selected students in a course (Admin/Developer only)',
  tags: ['Admin CRM'],
  body: {
    type: 'object',
    required: ['courseId'],
    properties: {
      userIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['student-uuid-1', 'student-uuid-2']
      },
      studentIds: {
        type: 'array',
        items: { type: 'string' },
        example: ['student-uuid-1', 'student-uuid-2']
      },
      courseId: { type: 'string', example: 'course-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        enrolledCount: { type: 'number', example: 2 },
        message: { type: 'string', example: 'Successfully enrolled 2 students' }
      }
    }
  }
};

export const adminRevokeCourseAccessSchema: FastifySchema = {
  description: 'Revoke course access from a student (Admin/Developer only)',
  tags: ['Admin CRM'],
  body: {
    type: 'object',
    required: ['courseId'],
    properties: {
      userId: { type: 'string', example: 'student-uuid' },
      studentId: { type: 'string', example: 'student-uuid' },
      courseId: { type: 'string', example: 'course-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Course access revoked successfully.' }
      }
    }
  }
};

export const adminSendMessageSchema: FastifySchema = {
  description: 'Send direct inline message / mock email to a student (Admin/Developer only)',
  tags: ['Admin CRM'],
  body: {
    type: 'object',
    required: ['subject', 'message'],
    properties: {
      userId: { type: 'string', example: 'student-uuid' },
      studentId: { type: 'string', example: 'student-uuid' },
      subject: { type: 'string', example: 'Syllabus Updates' },
      message: { type: 'string', example: 'Please review the new lessons added in CEFR B1' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Message sent successfully.' }
      }
    }
  }
};

// 8.5 Admin Payments Schemas
export const adminGetPaymentsSchema: FastifySchema = {
  description: 'Retrieve financial transaction ledger entries (Admin/Developer only)',
  tags: ['Admin Finance'],
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'order-uuid' },
          amount: { type: 'string', example: '19.99' },
          status: { type: 'string', example: 'SUCCESS' },
          transactionId: { type: 'string', nullable: true, example: 'TXN-1234' },
          createdAt: { type: 'string', example: '2026-05-21T09:10:27Z' },
          studentName: { type: 'string', example: 'John Doe' },
          studentEmail: { type: 'string', example: 'student@lms.local' },
          courseTitle: { type: 'string', example: 'Spanish for Beginners' }
        }
      }
    }
  }
};

export const adminRefundPaymentSchema: FastifySchema = {
  description: 'Refund a payment transaction (Admin/Developer only)',
  tags: ['Admin Finance'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'order-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Order status updated to REFUNDED' }
      }
    }
  }
};

export const adminExportPaymentsSchema: FastifySchema = {
  description: 'Export financial audit ledger as CSV format (Admin/Developer only)',
  tags: ['Admin Finance'],
  response: {
    200: {
      type: 'string',
      description: 'CSV text data'
    }
  }
};

// 8.6 Admin Site Settings Schemas
export const adminGetSettingsSchema: FastifySchema = {
  description: 'Get customizable settings, custom tip lists, and system banners (Admin/Developer only)',
  tags: ['Admin Site Settings'],
  response: {
    200: {
      type: 'object',
      properties: {
        bannerText: { type: 'string', example: 'Get 20% off all Premium CEFR courses!' },
        showBanner: { type: 'boolean', example: true },
        tips: {
          type: 'array',
          items: { type: 'string' },
          example: ['Review vocabulary daily', 'Practice writing short essays']
        },
        badgeRegistry: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              badgeType: { type: 'string', example: 'FIRST_STEPS' },
              name: { type: 'string', example: 'First Steps' },
              description: { type: 'string', example: 'Complete your first quiz' }
            }
          }
        }
      }
    }
  }
};

export const adminUpdateSettingsSchema: FastifySchema = {
  description: 'Update site settings, banner configurations, tips, and badges (Admin/Developer only)',
  tags: ['Admin Site Settings'],
  body: {
    type: 'object',
    properties: {
      bannerText: { type: 'string', example: 'Summer discount active!' },
      showBanner: { type: 'boolean', example: false },
      tips: {
        type: 'array',
        items: { type: 'string' }
      },
      badgeRegistry: {
        type: 'array',
        items: {
          type: 'object',
          required: ['badgeType', 'name', 'description'],
          properties: {
            badgeType: { type: 'string', example: 'VOCAB_WARRIOR' },
            name: { type: 'string', example: 'Vocab Warrior' },
            description: { type: 'string', example: 'Unlock 3 courses' }
          }
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Site settings updated successfully' }
      }
    }
  }
};

// 9. Admin Content Management Router Schemas
export const adminCreateModuleSchema: FastifySchema = {
  description: 'Create a new course module (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Course ID', example: 'course-uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      orderIndex: { type: 'number', example: 2 },
      title: { type: 'string', example: 'Intermediate Grammar' },
      locale: { type: 'string', example: 'en' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        moduleId: { type: 'string', example: 'module-uuid' },
        module: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'module-uuid' },
            courseId: { type: 'string', example: 'course-uuid' },
            orderIndex: { type: 'number', example: 2 }
          }
        }
      }
    }
  }
};

export const adminUpdateModuleSchema: FastifySchema = {
  description: 'Update a module details (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Module ID', example: 'module-uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      orderIndex: { type: 'number', example: 1 },
      title: { type: 'string', example: 'Basic Grammar' },
      locale: { type: 'string', example: 'en' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Module updated successfully' }
      }
    }
  }
};

export const adminDeleteModuleSchema: FastifySchema = {
  description: 'Delete a course module and its cascading lessons (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Module ID', example: 'module-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Module and all related lessons deleted' }
      }
    }
  }
};

export const adminCreateLessonSchema: FastifySchema = {
  description: 'Create a new lesson inside a module (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Module ID', example: 'module-uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      orderIndex: { type: 'number', example: 1 },
      title: { type: 'string', example: 'Introduction to Pronouns' },
      summary: { type: 'string', example: 'Learn about primary subject pronouns' },
      lessonType: { type: 'string', enum: ['VIDEO', 'AUDIO', 'READING', 'PDF'], example: 'READING' },
      durationSeconds: { type: 'number', example: 300 },
      filePath: { type: 'string', example: '/public/uploads/sample.pdf' },
      locale: { type: 'string', example: 'en' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        lessonId: { type: 'string', example: 'lesson-uuid' },
        lesson: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'lesson-uuid' },
            moduleId: { type: 'string', example: 'module-uuid' },
            orderIndex: { type: 'number', example: 1 }
          }
        }
      }
    }
  }
};

export const adminUpdateLessonSchema: FastifySchema = {
  description: 'Update an existing lesson detail (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Lesson ID', example: 'lesson-uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      orderIndex: { type: 'number', example: 2 },
      title: { type: 'string', example: 'Advanced Pronouns' },
      summary: { type: 'string', example: 'Summary of intermediate and advanced pronouns' },
      lessonType: { type: 'string', enum: ['VIDEO', 'AUDIO', 'READING', 'PDF'], example: 'READING' },
      durationSeconds: { type: 'number', example: 300 },
      filePath: { type: 'string', example: '/public/uploads/sample.pdf' },
      locale: { type: 'string', example: 'en' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lesson updated successfully' }
      }
    }
  }
};

export const adminDeleteLessonSchema: FastifySchema = {
  description: 'Delete a lesson from a module (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Lesson ID', example: 'lesson-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lesson deleted successfully' }
      }
    }
  }
};

export const adminUploadLessonFileSchema: FastifySchema = {
  description: 'Upload local courseware PDF resource for a lesson (Admin/Developer only)',
  tags: ['Admin Course Content'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Lesson ID', example: 'lesson-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        filePath: { type: 'string', example: '/public/uploads/pdf-resource.pdf' },
        message: { type: 'string', example: 'Lesson PDF syllabus uploaded successfully' }
      }
    }
  }
};

// 10. Admin Quiz Management Router Schemas
export const adminGetQuizDetailsSchema: FastifySchema = {
  description: 'Get quiz details and questions with correctOption visible (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', example: 'quiz-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'quiz-uuid' },
        title: { type: 'string', example: 'Greetings MCQ Quiz' },
        rules: { type: 'string', example: 'Answer all questions.' },
        difficulty: { type: 'string', example: 'EASY' },
        pointValue: { type: 'number', example: 100 },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'question-uuid' },
              questionText: { type: 'string', example: 'What does "Hola" mean?' },
              optionA: { type: 'string', example: 'Hello' },
              optionB: { type: 'string', example: 'Goodbye' },
              optionC: { type: 'string', example: 'Thank you' },
              optionD: { type: 'string', example: 'Please' },
              correctOption: { type: 'string', example: 'A' },
              orderIndex: { type: 'number', example: 1 }
            }
          }
        }
      }
    }
  }
};

export const adminCreateQuizSchema: FastifySchema = {
  description: 'Create a new course assessment MCQ Quiz (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      courseId: { type: 'string', example: 'course-uuid' },
      xpReward: { type: 'number', example: 100 },
      pointValue: { type: 'number', example: 50 },
      difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'EASY' },
      passingScore: { type: 'number', example: 70 },
      title: { type: 'string', example: 'Grammar Assessment Quiz' },
      description: { type: 'string', example: 'Complete grammar multiple choice test' },
      locale: { type: 'string', example: 'en' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        quizId: { type: 'string', example: 'quiz-uuid' },
        quiz: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'quiz-uuid' },
            courseId: { type: 'string', example: 'course-uuid' },
            xpReward: { type: 'number', example: 100 },
            passingScore: { type: 'number', example: 70 }
          }
        }
      }
    }
  }
};

export const adminUpdateQuizSchema: FastifySchema = {
  description: 'Update quiz attributes and localized translations (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Quiz ID', example: 'quiz-uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      xpReward: { type: 'number', example: 120 },
      pointValue: { type: 'number', example: 60 },
      difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'MEDIUM' },
      passingScore: { type: 'number', example: 75 },
      title: { type: 'string', example: 'Revised Grammar Assessment' },
      description: { type: 'string', example: 'Revised MCQ details' },
      locale: { type: 'string', example: 'en' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Quiz parameters and localization updated successfully' }
      }
    }
  }
};

export const adminDeleteQuizSchema: FastifySchema = {
  description: 'Delete a quiz and its downstream questions/attempts (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Quiz ID', example: 'quiz-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Quiz and all its questions deleted successfully' }
      }
    }
  }
};

export const adminCreateQuestionSchema: FastifySchema = {
  description: 'Add a new multiple-choice question to an existing quiz (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Quiz ID', example: 'quiz-uuid' }
    }
  },
  body: {
    type: 'object',
    required: ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption'],
    properties: {
      orderIndex: { type: 'number', example: 1 },
      questionText: { type: 'string', example: 'What is 2 + 2?' },
      optionA: { type: 'string', example: '3' },
      optionB: { type: 'string', example: '4' },
      optionC: { type: 'string', example: '5' },
      optionD: { type: 'string', example: '6' },
      correctOption: { type: 'string', enum: ['A', 'B', 'C', 'D'], example: 'B' },
      options: {
        type: 'array',
        items: { type: 'string' },
        example: ['3', '4', '5', '6']
      },
      correctAnswer: { type: 'string', example: '4' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        questionId: { type: 'string', example: 'question-uuid' },
        question: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'question-uuid' },
            quizId: { type: 'string', example: 'quiz-uuid' },
            orderIndex: { type: 'number', example: 1 }
          }
        }
      }
    }
  }
};

export const adminUpdateQuestionSchema: FastifySchema = {
  description: 'Update details of a multiple-choice question (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Question ID', example: 'question-uuid' }
    }
  },
  body: {
    type: 'object',
    properties: {
      orderIndex: { type: 'number', example: 2 },
      questionText: { type: 'string', example: 'What is 3 + 3?' },
      optionA: { type: 'string', example: '5' },
      optionB: { type: 'string', example: '6' },
      optionC: { type: 'string', example: '7' },
      optionD: { type: 'string', example: '8' },
      correctOption: { type: 'string', enum: ['A', 'B', 'C', 'D'], example: 'B' },
      options: {
        type: 'array',
        items: { type: 'string' },
        example: ['5', '6', '7', '8']
      },
      correctAnswer: { type: 'string', example: '6' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Question parameters and choices updated' }
      }
    }
  }
};

export const adminDeleteQuestionSchema: FastifySchema = {
  description: 'Delete a multiple-choice question from a quiz (Admin/Developer only)',
  tags: ['Admin Quiz Management'],
  params: {
    type: 'object',
    required: ['questionId'],
    properties: {
      questionId: { type: 'string', example: 'question-uuid' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Question removed successfully' }
      }
    }
  }
};

// 11. Admin Analytics Schemas
export const adminGetAnalyticsSchema: FastifySchema = {
  description: 'Get deep statistical dashboards on revenue, students, course distributions and quiz counts (Admin/Developer only)',
  tags: ['Admin Analytics'],
  response: {
    200: {
      type: 'object',
      properties: {
        totalStudents: { type: 'number', example: 154 },
        totalRevenue: { type: 'number', example: 2480.5 },
        weeklySignups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', example: 'Mon' },
              count: { type: 'number', example: 5 }
            }
          }
        },
        streakLeaders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user-uuid' },
              name: { type: 'string', example: 'John Doe' },
              avatarUrl: { type: 'string', nullable: true, example: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=John' },
              streak: { type: 'number', example: 12 }
            }
          }
        },
        quizCompletions: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            today: { type: 'number', example: 4 },
            avgScore: { type: 'number', example: 85 }
          }
        }
      }
    }
  }
};

// ─── Developer: Feature Flags ──────────────────────────────────────────────
export const getFeatureFlagsSchema: FastifySchema = {
  description: 'Get all feature flags with name, enabled status, and rollout percentage',
  tags: ['Developer — Infrastructure'],
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        flags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ff-001' },
              key: { type: 'string', example: 'new_quiz_ui' },
              description: { type: ['string', 'null'], example: 'Enable new UI' },
              enabled: { type: 'boolean', example: true },
              rolloutPct: { type: 'number', example: 100 },
              updatedAt: { type: 'string', example: '2026-09-20T12:00:00Z' }
            }
          }
        }
      }
    }
  }
};

export const toggleFeatureFlagSchema: FastifySchema = {
  description: 'Toggle a feature flag on/off and set rollout percentage',
  tags: ['Developer — Infrastructure'],
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['flagId'],
    properties: {
      flagId: { type: 'string', example: 'ff-001' },
      enabled: { type: 'boolean', example: true },
      rolloutPercent: { type: 'number', example: 100 }
    }
  },
  response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } }
};

// ─── Developer: Cache Inspector ────────────────────────────────────────────
export const getCacheKeysSchema: FastifySchema = {
  description: 'Browse all simulated cache keys with TTL countdowns',
  tags: ['Developer — Infrastructure'],
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        cacheKeys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', example: 'leaderboard:global' },
              ttlSeconds: { type: 'number', example: 300 }
            }
          }
        },
        totalKeys: { type: 'number', example: 0 },
        message: { type: 'string', example: 'In-process cache active.' }
      }
    }
  }
};

export const deleteCacheKeySchema: FastifySchema = {
  description: 'Purge a specific key from the simulated cache store',
  tags: ['Developer — Infrastructure'],
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['key'],
    properties: { key: { type: 'string', example: 'leaderboard:global' } }
  },
  response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } }
};

// ─── Developer: Payment Reconciliation ────────────────────────────────────
export const getReconciliationSchema: FastifySchema = {
  description: 'Compare DB orders vs simulated gateway totals for payment reconciliation',
  tags: ['Developer — Finance'],
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        reconciliationStatus: { type: 'string' },
        message: { type: 'string' },
        generatedAt: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            totalOrders: { type: 'number' },
            successCount: { type: 'number' },
            failedCount: { type: 'number' },
            refundedCount: { type: 'number' },
            pendingCount: { type: 'number' },
          }
        },
        revenue: {
          type: 'object',
          properties: {
            dbTotalRevenue: { type: 'number' },
            gatewayTotalRevenue: { type: 'number' },
            variance: { type: 'number' },
            variancePct: { type: 'string' },
          }
        },
        flaggedOrders: {
          type: 'array',
          items: { type: 'object', additionalProperties: true }
        },
        lineItems: { type: 'array', items: { type: 'object', additionalProperties: true } }
      }
    }
  }
};

// ─── Developer: Queue Monitor ─────────────────────────────────────────────
export const getQueueMonitorSchema: FastifySchema = {
  description: 'List all background job statuses in the in-memory queue',
  tags: ['Developer — Infrastructure'],
  security: [{ cookieAuth: [] }],
  response: {
    200: {
      type: 'object',
      properties: {
        summary: { type: 'object' },
        jobs: { type: 'array', items: { type: 'object' } }
      }
    }
  }
};

// ─── Admin: Course Analytics ───────────────────────────────────────────────
export const getCourseAnalyticsSchema: FastifySchema = {
  description: 'Get per-lesson completion rates and drop-off data for a specific course',
  tags: ['Admin — Analytics'],
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['courseId'],
    properties: { courseId: { type: 'string', example: 'course-uuid' } }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        courseTitle: { type: 'string' },
        totalEnrolled: { type: 'number' },
        lessonAnalytics: { type: 'array', items: { type: 'object' } }
      }
    }
  }
};

// ─── Admin: Reorder Lessons ────────────────────────────────────────────────
export const reorderLessonsSchema: FastifySchema = {
  description: 'Reorder lessons within a module by providing an ordered array of lesson IDs',
  tags: ['Admin — Content'],
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['moduleId'],
    properties: { moduleId: { type: 'string', example: 'module-uuid' } }
  },
  body: {
    type: 'object',
    required: ['orderedLessonIds'],
    properties: {
      orderedLessonIds: { type: 'array', items: { type: 'string' } }
    }
  },
  response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } }
};

// ─── Admin: Student CRM Actions ────────────────────────────────────────────
export const addStudentSchema: FastifySchema = {
  description: 'Manually add a single student by name and email',
  tags: ['Admin — Student CRM'],
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', example: 'Alice Smith' },
      email: { type: 'string', format: 'email', example: 'alice@lms.local' }
    }
  },
  response: { 201: { type: 'object', properties: { success: { type: 'boolean' } } } }
};

export const bulkEnrollSchema: FastifySchema = {
  description: 'Bulk-enroll a list of student IDs into a course',
  tags: ['Admin — Student CRM'],
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['studentIds', 'courseId'],
    properties: {
      studentIds: { type: 'array', items: { type: 'string' } },
      courseId: { type: 'string', example: 'course-uuid' }
    }
  },
  response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, enrolled: { type: 'number' } } } }
};

export const revokeCourseAccessSchema: FastifySchema = {
  description: "Revoke a student's access to a specific course",
  tags: ['Admin — Student CRM'],
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['studentId', 'courseId'],
    properties: {
      studentId: { type: 'string', example: 'user-uuid' },
      courseId: { type: 'string', example: 'course-uuid' }
    }
  },
  response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } }
};

export const sendMessageSchema: FastifySchema = {
  description: 'Send a message/email to a student (simulated)',
  tags: ['Admin — Student CRM'],
  security: [{ cookieAuth: [] }],
  body: {
    type: 'object',
    required: ['studentId', 'subject', 'body'],
    properties: {
      studentId: { type: 'string', example: 'user-uuid' },
      subject: { type: 'string', example: 'Welcome!' },
      body: { type: 'string', example: 'Hi Alice, welcome aboard!' }
    }
  },
  response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } }
};
