import { eq } from "drizzle-orm";
import { profileSchema } from "@contracts/schemas";
import { users } from "@db/schema";
import { authedQuery, createRouter } from "./middleware";

export const profileRouter = createRouter({
  update: authedQuery.input(profileSchema).mutation(async ({ ctx, input }) => {
    const [user] = await ctx.db.update(users).set({
      fullName: input.fullName,
      groupName: input.groupName || null,
    }).where(eq(users.id, ctx.user.id)).returning({
      id: users.id, fullName: users.fullName, email: users.email, role: users.role, groupName: users.groupName,
    });
    return user!;
  }),
});
