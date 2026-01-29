import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";
import { GmailOTPPasswordReset } from "./GmailOTPPasswordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: GmailOTPPasswordReset,
    }),
  ],
});

function parseAdminEmails(raw?: string | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const authInfo = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return {
        isAuthenticated: false,
        isAnonymous: false,
        isAdmin: false,
        email: null,
        userId: null,
      };
    }

    // ✅ Convex correto: db.get recebe o ID do documento, não ("users", id)
    const user = await ctx.db.get(userId);

    const email =
      (typeof (user as any)?.email === "string"
        ? ((user as any).email as string).toLowerCase()
        : null);

    const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
    const isAdmin = !!email && adminEmails.has(email);

    return {
      isAuthenticated: true,
      isAnonymous: false,
      isAdmin,
      email,
      userId: userId.toString(),
    };
  },
});
