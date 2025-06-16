import { sqliteTable, text, int } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  score: int('score').notNull().default(0),
  scenario: text('scenario').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  systemPrompt: text('system_prompt').notNull().default(''),
});
