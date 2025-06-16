import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { agents } from './agent';

export const debtProfiles = sqliteTable('debt_profiles', {
  id: text('id').primaryKey(),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: text('amount').notNull(),
  context: text('context').notNull(),
});
