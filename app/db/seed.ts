import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { hashPassword } from "../api/lib/password";
import { questions, quizzes, users } from "./schema";

async function seed() {
  const db = getDb();
  const accounts = [
    { fullName: "Maya Teacher", email: "teacher@quizzy.dev", password: "Teacher123", role: "teacher" as const, groupName: null },
    { fullName: "Sam Student", email: "student@quizzy.dev", password: "Student123", role: "student" as const, groupName: "10A" },
  ];
  for (const account of accounts) {
    await db.insert(users).values({ ...account, passwordHash: await hashPassword(account.password) }).onConflictDoNothing();
  }
  const [teacher] = await db.select().from(users).where(eq(users.email, "teacher@quizzy.dev")).limit(1);
  if (!teacher) throw new Error("Demo teacher was not created");
  const [existing] = await db.select().from(quizzes).where(eq(quizzes.teacherId, teacher.id)).limit(1);
  if (!existing) {
    const [quiz] = await db.insert(quizzes).values({
      teacherId: teacher.id,
      title: "Introduction to Biology",
      description: "A short check-in on cells, genetics, and the living world.",
      category: "Science",
      durationMinutes: 10,
      status: "published",
    }).returning();
    if (!quiz) throw new Error("Demo quiz was not created");
    await db.insert(questions).values([
      { quizId: quiz.id, position: 0, prompt: "Which structure is known as the powerhouse of the cell?", options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"], correctIndex: 1, points: 10, difficulty: "easy", explanation: "Mitochondria generate most of the cell’s ATP." },
      { quizId: quiz.id, position: 1, prompt: "Which molecule carries genetic instructions in most organisms?", options: ["ATP", "Protein", "DNA", "Lipid"], correctIndex: 2, points: 10, difficulty: "easy", explanation: "DNA stores hereditary information." },
      { quizId: quiz.id, position: 2, prompt: "What process converts light energy into chemical energy in plants?", options: ["Respiration", "Fermentation", "Digestion", "Photosynthesis"], correctIndex: 3, points: 10, difficulty: "medium", explanation: "Photosynthesis stores light energy in glucose." },
    ]);
  }
  console.log("Demo data ready: teacher@quizzy.dev / Teacher123; student@quizzy.dev / Student123");
  await db.$client.end();
}

seed().catch((error) => { console.error(error); process.exit(1); });
