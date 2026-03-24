import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  // Database Connection Strategy
  DB_CONNECTION_STRATEGY: Joi.string()
    .valid('env', 'aws-secrets')
    .default('env'),

  // Configuration when using 'env' strategy
  DB_HOST: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'env',
    then: Joi.string().required(),
  }),
  DB_PORT: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'env',
    then: Joi.number().default(5432),
  }),
  DB_USERNAME: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'env',
    then: Joi.string().required(),
  }),
  DB_PASSWORD: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'env',
    then: Joi.string().required(),
  }),
  DB_DATABASE: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'env',
    then: Joi.string().required(),
  }),

  // Configuration when using 'aws-secrets' strategy
  DB_SECRET_ARN: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'aws-secrets',
    then: Joi.string().required(),
  }),
  AWS_REGION: Joi.any().when('DB_CONNECTION_STRATEGY', {
    is: 'aws-secrets',
    then: Joi.string().default('us-east-1'),
  }),

  // TypeORM behavior
  DB_SYNCHRONIZE: Joi.boolean().default(false),

  // SSL Settings
  DB_USE_SSL: Joi.boolean().default(false),
  DB_SSL_CERT: Joi.string().optional(),
});
