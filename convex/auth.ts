import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get("users", userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

/**
 * Informações simples de autenticação para o front-end.
 * Observação: "Anonymous" conta como autenticado, mas nós marcamos como isAnonymous.
 */
export const authInfo = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        isAuthenticated: false,
        isAnonymous: false,
        email: null as string | null,
      };
    }

    const email = (identity.email ?? null) as string | null;
    const token = identity.tokenIdentifier ?? "";

    // Heurística robusta: usuário anônimo geralmente não tem email e/ou traz "anonymous/anon" no token
    const isAnonymous =
      !email || token.toLowerCase().includes("anonymous") || token.toLowerCase().includes("anon");

    return {
      isAuthenticated: true,
      isAnonymous,
      email,
    };
  },
});
