import { db } from '../db';
import { seedDatabase } from '../db/seed';

async function setup() {
  try {
    console.log('Setting up gym management database...');

    // Check database connection
    await db.execute('SELECT 1');
    console.log('Database connection successful');

    // Run seed data
    const results = await seedDatabase();
    console.log('Database setup completed:', results);

    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setup();