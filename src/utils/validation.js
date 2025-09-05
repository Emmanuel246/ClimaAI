import Joi from 'joi';

// User validation schemas
export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  location: Joi.object({
    city: Joi.string().max(100),
    country: Joi.string().max(100),
    lat: Joi.number().min(-90).max(90),
    lon: Joi.number().min(-180).max(180)
  }).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  location: Joi.object({
    city: Joi.string().max(100),
    country: Joi.string().max(100),
    lat: Joi.number().min(-90).max(90),
    lon: Joi.number().min(-180).max(180)
  }).optional(),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr', 'de').default('en'),
    notifications: Joi.boolean().default(true),
    units: Joi.string().valid('metric', 'imperial').default('metric')
  }).optional()
});

// Symptom validation schemas
export const symptomLogSchema = Joi.object({
  symptoms: Joi.object({
    wheezing: Joi.number().integer().min(0).max(10).required().messages({
      'number.min': 'Wheezing level must be between 0 and 10',
      'number.max': 'Wheezing level must be between 0 and 10',
      'any.required': 'Wheezing level is required'
    }),
    cough: Joi.number().integer().min(0).max(10).required().messages({
      'number.min': 'Cough level must be between 0 and 10',
      'number.max': 'Cough level must be between 0 and 10',
      'any.required': 'Cough level is required'
    }),
    attack: Joi.boolean().required().messages({
      'any.required': 'Attack status is required'
    }),
    breathlessness: Joi.number().integer().min(0).max(10).optional(),
    chestTightness: Joi.number().integer().min(0).max(10).optional(),
    triggers: Joi.array().items(Joi.string().valid('pollen', 'dust', 'smoke', 'exercise', 'stress', 'weather', 'other')).optional()
  }).required(),
  notes: Joi.string().max(500).optional(),
  date: Joi.date().max('now').optional(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lon: Joi.number().min(-180).max(180)
  }).optional()
});

// Coach message validation
export const coachMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 1000 characters',
    'any.required': 'Message is required'
  }),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
});

// Gamification validation
export const challengeCompleteSchema = Joi.object({
  badge: Joi.string().valid('daily_logger', 'week_streak', 'month_streak', 'symptom_tracker', 'coach_chat', 'risk_aware').required().messages({
    'any.only': 'Invalid badge type',
    'any.required': 'Badge is required'
  }),
  points: Joi.number().integer().min(1).max(100).default(10)
});

// Location validation
export const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).optional(),
  lon: Joi.number().min(-180).max(180).optional(),
  city: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  compute: Joi.boolean().optional()
});

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Query validation failed',
        details: errors
      });
    }
    
    req.query = value;
    next();
  };
};
