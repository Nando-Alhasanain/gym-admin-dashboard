import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import * as authSchema from './schema/auth';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...schema, ...authSchema }
});

export { schema, authSchema };