import { z } from "zod";

export const roleSchema = z.enum(["teacher", "student"]);
export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const quizStatusSchema = z.enum(["draft", "published"]);
export const idSchema = z.number().int().positive();

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(320);
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  groupName: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72),
});

export const questionSchema = z
  .object({
    prompt: z.string().trim().min(5, "Question is too short").max(500),
    options: z
      .array(z.string().trim().min(1, "Option cannot be empty").max(200))
      .min(2, "Add at least two options")
      .max(6),
    correctIndex: z.number().int().nonnegative(),
    points: z.number().int().min(1).max(100),
    difficulty: difficultySchema,
    explanation: z.string().trim().max(800).optional(),
  })
  .superRefine((question, ctx) => {
    if (question.correctIndex >= question.options.length) {
      ctx.addIssue({ code: "custom", path: ["correctIndex"], message: "Select a valid correct answer" });
    }
    const normalized = question.options.map((option) => option.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Options must be unique" });
    }
  });

export const quizSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().max(500),
  category: z.string().trim().min(2).max(40),
  durationMinutes: z.number().int().min(1).max(180),
  status: quizStatusSchema,
  questions: z.array(questionSchema).min(1, "Add at least one question").max(50),
});

export const triviaQuerySchema = z.object({
  amount: z.number().int().min(1).max(10),
  difficulty: difficultySchema.optional(),
});

export const eventSchema = z.object({
  quizId: idSchema,
  startsAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time")
    .refine((value) => Date.parse(value) > Date.now(), "Choose a future date and time"),
  visibility: z.enum(["invited", "all"]),
});

export const attemptSchema = z.object({
  answers: z
    .array(z.object({ questionId: idSchema, selectedIndex: z.number().int().nonnegative().nullable() }))
    .max(50),
});

export const invitationSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: emailSchema,
  groupName: z.string().trim().min(1).max(40),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  groupName: z.string().trim().max(40),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type AttemptInput = z.infer<typeof attemptSchema>;
export type SafeUser = { id: number; fullName: string; email: string; role: "teacher" | "student"; groupName: string | null };
