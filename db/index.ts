import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as gymSchema from './schema/gym';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchema, ...gymSchema }
});

// Export schemas for easy access
export const { user, session, account, verification } = authSchema;
export const {
  members,
  membershipPlans,
  memberMemberships,
  products,
  sales,
  saleItems,
  attendanceLogs
} = gymSchema;

// Export types
export type AuthSchema = typeof authSchema;
export type GymSchema = typeof gymSchema;