import { env } from './env';

export default {
  schema: './adapters/postgres/schema.ts',
  out: './adapters/postgres/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
};
