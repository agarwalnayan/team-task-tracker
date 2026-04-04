const Joi = require('joi');
const { AppError } = require('./errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError('Validation failed', 400, errors));
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    company: Joi.string().max(100).optional(),
    phone: Joi.string().optional(),
    phoneCountryCode: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    company: Joi.string().max(100).optional(),
    phone: Joi.string().optional(),
    phoneCountryCode: Joi.string().optional()
  }),

  createTask: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('todo', 'in-progress', 'completed', 'blocked').default('todo'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    assignedTo: Joi.string().optional(),
    team: Joi.string().optional(),
    dueDate: Joi.date().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  createTeam: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    company: Joi.string().max(100).required(),
    members: Joi.array().items(Joi.string()).optional()
  })
};

module.exports = { validate, schemas };