import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["teacher", "student"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const quizStatusEnum = pgEnum("quiz_status", ["draft", "published"]);
export const visibilityEnum = pgEnum("visibility", ["invited", "all"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  groupName: varchar("group_name", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("sessions_expiry_idx").on(table.expiresAt)]);

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  category: varchar("category", { length: 40 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: quizStatusEnum("status").notNull().default("draft"),
  source: varchar("source", { length: 30 }).notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("quizzes_teacher_status_idx").on(table.teacherId, table.status)]);

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  prompt: text("prompt").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
  points: integer("points").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  explanation: text("explanation"),
}, (table) => [index("questions_quiz_position_idx").on(table.quizId, table.position)]);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  visibility: visibilityEnum("visibility").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("events_start_idx").on(table.startsAt)]);

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalPoints: integer("total_points").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("attempts_quiz_user_idx").on(table.quizId, table.userId)]);

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  groupName: varchar("group_name", { length: 40 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("invitations_teacher_idx").on(table.teacherId)]);

export const externalCache = pgTable("external_cache", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({ quizzes: many(quizzes), attempts: many(attempts) }));
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  teacher: one(users, { fields: [quizzes.teacherId], references: [users.id] }),
  questions: many(questions),
  attempts: many(attempts),
}));
export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
}));

export type User = typeof users.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type AppEvent = typeof events.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
