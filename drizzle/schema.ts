import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const templates = sqliteTable('templates', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    promptBase: text('prompt_base').notNull(),
    formSchema: text('form_schema').notNull(), // JSON string
    displayOrder: integer('display_order').default(0).notNull(),
    isPublic: integer('is_public').default(1).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
});

export type Template = typeof templates.$inferSelect;

export const generations = sqliteTable('generations', {
    id: text('id').primaryKey(), // uuid
    templateId: text('template_id').notNull().references(() => templates.id),
    inputJson: text('input_json').notNull(), // JSON string
    outputText: text('output_text').notNull(),
    status: text('status').notNull(), // success, error
    errorMessage: text('error_message'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
