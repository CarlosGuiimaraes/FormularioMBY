import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { posModelValidator } from "./posConstants";

function parseAdminEmails(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;]+/g)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Não autorizado.");

  const user = await ctx.db.get(userId);
  const email = (user?.email as string | undefined)?.toLowerCase() ?? null;

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (!email || !adminEmails.has(email)) {
    throw new Error("Acesso restrito ao administrador.");
  }
  return { userId, email };
}

export const createPosOrder = mutation({
  args: {
    cnpj: v.string(),
    responsibleCpf: v.string(),
    companyName: v.string(),
    pagSeguroEmail: v.string(),
    contactEmail: v.string(),
    phone: v.string(),
    cep: v.string(),
    street: v.string(),
    number: v.string(),
    complement: v.optional(v.string()),
    district: v.string(),
    city: v.string(),
    state: v.string(),
    model: posModelValidator,
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Você precisa estar logado para enviar um pedido.");

    const user = await ctx.db.get(userId);
    const userEmail = ((user as any)?.email as string | undefined) ?? undefined;

    // Normalizar: somente dígitos
    const cnpj = args.cnpj.replace(/\D/g, "");
    const responsibleCpf = args.responsibleCpf.replace(/\D/g, "");
    const cep = args.cep.replace(/\D/g, "");
    const phone = args.phone.replace(/\D/g, "");

    // Validações de formato
    if (cnpj.length !== 14) throw new Error("CNPJ inválido. Informe 14 dígitos.");
    if (responsibleCpf.length !== 11) throw new Error("CPF inválido. Informe 11 dígitos.");
    if (cep.length !== 8) throw new Error("CEP inválido. Informe 8 dígitos.");
    if (phone.length < 10 || phone.length > 11) throw new Error("Telefone inválido.");
    if (!/^[A-Z]{2}$/.test(args.state.toUpperCase())) {
      throw new Error("UF inválida. Use 2 letras maiúsculas (ex: SP).");
    }
    if (args.quantity < 1 || args.quantity > 5) {
      throw new Error("Quantidade deve ser entre 1 e 5.");
    }

    // Validação de limite mensal: todos os pedidos do CNPJ no mês vigente
    // (incluindo erros de envio — podem ser reprocessados futuramente)
    const now = new Date();
    const startOfMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);

    const existingThisMonth = await ctx.db
      .query("posOrders")
      .withIndex("by_cnpj", (q: any) => q.eq("cnpj", cnpj))
      .filter((f: any) => f.gte(f.field("_creationTime"), startOfMonth))
      .collect();

    const totalQty = existingThisMonth.reduce((acc: number, o: any) => acc + o.quantity, 0);

    if (totalQty + args.quantity > 5) {
      throw new Error(
        `Limite mensal atingido. Este CNPJ já possui ${totalQty} POS solicitado(s) este mês. Máximo: 5.`,
      );
    }

    const ts = Date.now();

    await ctx.db.insert("posOrders", {
      userId,
      userEmail,
      cnpj,
      responsibleCpf,
      companyName: args.companyName.trim(),
      pagSeguroEmail: args.pagSeguroEmail.trim().toLowerCase(),
      contactEmail: args.contactEmail.trim().toLowerCase(),
      phone,
      cep,
      street: args.street.trim(),
      number: args.number.trim(),
      complement: args.complement?.trim() || undefined,
      district: args.district.trim(),
      city: args.city.trim(),
      state: args.state.trim().toUpperCase(),
      model: args.model,
      quantity: args.quantity,
      purchaseType: "compra",
      submissionResult: "not_sent",
      createdAt: ts,
      updatedAt: ts,
    });

    return { ok: true };
  },
});

export const listMyPosOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("posOrders")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const listAllPosOrders = query({
  args: {
    limit: v.optional(v.number()),
    submissionResult: v.optional(
      v.union(v.literal("not_sent"), v.literal("sent"), v.literal("error")),
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 50;
    let q = ctx.db.query("posOrders").order("desc");

    if (args.submissionResult) {
      q = q.filter((f: any) => f.eq(f.field("submissionResult"), args.submissionResult));
    }

    const rows = await q.take(limit);

    if (args.search) {
      const s = args.search.toLowerCase();
      return rows.filter((o: any) => {
        const hay =
          `${o.companyName} ${o.cnpj} ${o.responsibleCpf} ${o.contactEmail} ${o.pagSeguroEmail} ${o.phone} ${o.model} ${o.city} ${o.state}`.toLowerCase();
        return hay.includes(s);
      });
    }

    return rows;
  },
});

// Estrutura preparada para futura ação de reenvio ao Monday/Paytime.
// Não implementado ainda — aguarda mapeamento dos códigos de modelo.
export const submitPosOrderToMonday = mutation({
  args: { orderId: v.id("posOrders") },
  handler: async (ctx, _args) => {
    await requireAdmin(ctx);
    throw new Error("Envio ao Monday ainda não implementado.");
  },
});
