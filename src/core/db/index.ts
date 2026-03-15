import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';
import migrations from './migrations/migrations';

const expo = openDatabaseSync('stremiox.db', { enableChangeListener: true });
export const db = drizzle(expo, { schema });

export async function initDB(): Promise<void> {
  try {
    await migrate(db, migrations);
    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  }
} 
