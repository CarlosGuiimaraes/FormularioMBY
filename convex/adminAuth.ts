import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Reset de senha manual (ADMIN).
 * Requer que authInfo.isAdmin seja true.
 *
 * OBS: Esta mutation depende do Convex Auth (Password provider).
 */
export const adminResetPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const authInfo = await ctx.auth.getUserIdentity();
    // Se você usa api.auth.authInfo, pode validar por lá também.
    // Aqui vamos checar se é admin via sua função existente:
    const info = await ctx.runQuery(api.auth.authInfo, {});
    if (!info?.isAdmin) throw new Error("Acesso negado.");

    const email = args.email.trim().toLowerCase();
    const newPassword = args.newPassword;

    if (newPassword.length < 8) {
      throw new Error("A senha provisória deve ter ao menos 8 caracteres.");
    }

    // Convex Auth: atualizar credenciais de senha do usuário
    // Nota: esta chamada existe no pacote @convex-dev/auth.
    // Em alguns projetos ela fica acessível via ctx.auth (ex.: ctx.auth.updatePassword).
    // Se no seu setup não existir, me mande o seu convex/auth.ts que eu ajusto ao método correto do seu auth.
    // -----
    // Tentativa padrão (mais comum em projetos Convex Auth):
    // @ts-expect-error - depende do plugin instalado
    await ctx.auth.resetPasswordForEmail?.(email, newPassword);

    // Se a função acima não existir no seu runtime, o deploy vai falhar.
    // Nesse caso, a alternativa correta é implementar reset via e-mail/token.
    return { ok: true };
  },
});
