import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { posModelValidator, INTERNAL_CONTACT_EMAIL } from "./posConstants";
import { MONDAY_MODEL_CODES, MONDAY_ENDPOINT } from "./mondayModelCodes";
import type { PosModel } from "./posConstants";

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

// ── Público ──────────────────────────────────────────────────────────────────

export const createPosOrder = mutation({
  args: {
    // cnpj aceita CPF (11 dígitos) ou CNPJ (14 dígitos) — campo unificado
    cnpj: v.string(),
    companyName: v.string(),
    pagSeguroEmail: v.string(),
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

    const cnpj = args.cnpj.replace(/\D/g, "");
    const cep = args.cep.replace(/\D/g, "");
    const phone = args.phone.replace(/\D/g, "");

    if (cnpj.length !== 11 && cnpj.length !== 14)
      throw new Error("Documento inválido. Informe CPF (11 dígitos) ou CNPJ (14 dígitos).");
    if (cep.length !== 8) throw new Error("CEP inválido. Informe 8 dígitos.");
    if (phone.length < 10 || phone.length > 11) throw new Error("Telefone inválido.");
    if (!/^[A-Z]{2}$/.test(args.state.toUpperCase()))
      throw new Error("UF inválida. Use 2 letras maiúsculas (ex: SP).");
    if (args.quantity < 1 || args.quantity > 5)
      throw new Error("Quantidade deve ser entre 1 e 5.");

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
        `Limite mensal atingido. Este documento já possui ${totalQty} POS solicitado(s) este mês. Máximo: 5.`,
      );
    }

    const ts = Date.now();

    await ctx.db.insert("posOrders", {
      userId,
      userEmail,
      cnpj,
      companyName: args.companyName.trim(),
      pagSeguroEmail: args.pagSeguroEmail.trim().toLowerCase(),
      contactEmail: INTERNAL_CONTACT_EMAIL,
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
          `${o.companyName} ${o.cnpj} ${o.contactEmail} ${o.pagSeguroEmail} ${o.phone} ${o.model} ${o.city} ${o.state}`.toLowerCase();
        return hay.includes(s);
      });
    }

    return rows;
  },
});

export const updatePosOrder = mutation({
  args: {
    orderId: v.id("posOrders"),
    cnpj: v.string(),
    companyName: v.string(),
    pagSeguroEmail: v.string(),
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
    await requireAdmin(ctx);

    const existing = await ctx.db.get(args.orderId);
    if (!existing) throw new Error("Pedido não encontrado.");

    const cnpj = args.cnpj.replace(/\D/g, "");
    const cep = args.cep.replace(/\D/g, "");
    const phone = args.phone.replace(/\D/g, "");

    if (cnpj.length !== 11 && cnpj.length !== 14)
      throw new Error("Documento inválido. Informe CPF (11 dígitos) ou CNPJ (14 dígitos).");
    if (cep.length !== 8) throw new Error("CEP inválido. Informe 8 dígitos.");
    if (phone.length < 10 || phone.length > 11) throw new Error("Telefone inválido.");
    if (!/^[A-Z]{2}$/.test(args.state.trim().toUpperCase())) throw new Error("UF inválida.");
    if (args.quantity < 1 || args.quantity > 5) throw new Error("Quantidade deve ser entre 1 e 5.");

    await ctx.db.patch(args.orderId, {
      cnpj,
      companyName: args.companyName.trim(),
      pagSeguroEmail: args.pagSeguroEmail.trim().toLowerCase(),
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
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const deletePosOrder = mutation({
  args: { orderId: v.id("posOrders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.orderId);
    if (!existing) throw new Error("Pedido não encontrado.");
    await ctx.db.delete(args.orderId);
    return { ok: true };
  },
});

// ── Internos (usados apenas pelo action abaixo) ───────────────────────────────

export const _getPosOrderById = internalQuery({
  args: { orderId: v.id("posOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const _checkIsAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    const email = ((user as any)?.email as string | undefined)?.toLowerCase() ?? null;
    const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
    return !!(email && adminEmails.has(email));
  },
});

export const _setPosSubmissionResult = internalMutation({
  args: {
    orderId: v.id("posOrders"),
    submissionResult: v.union(
      v.literal("not_sent"),
      v.literal("sent"),
      v.literal("error"),
    ),
    mondayPayload: v.optional(v.any()),
    mondayResponse: v.optional(v.any()),
    mondayError: v.optional(v.string()),
    submittedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, any> = {
      submissionResult: args.submissionResult,
      updatedAt: Date.now(),
    };
    if (args.mondayPayload !== undefined) patch.mondayPayload = args.mondayPayload;
    if (args.mondayResponse !== undefined) patch.mondayResponse = args.mondayResponse;
    if (args.mondayError !== undefined) patch.mondayError = args.mondayError;
    if (args.submittedAt !== undefined) patch.submittedAt = args.submittedAt;

    await ctx.db.patch(args.orderId, patch);
  },
});

// ── Action: envio real ao Monday/Paytime ─────────────────────────────────────

export const submitPosOrderToMonday = action({
  args: { orderId: v.id("posOrders") },
  handler: async (ctx, args) => {
    // Verificação de admin
    const isAdmin = await ctx.runQuery(internal.posOrders._checkIsAdmin);
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    // Busca o pedido
    const order = await ctx.runQuery(internal.posOrders._getPosOrderById, {
      orderId: args.orderId,
    });
    if (!order) throw new Error("Pedido não encontrado.");

    const modelCode = MONDAY_MODEL_CODES[order.model as PosModel];

    // Monta payload conforme spec do formulário Monday/Paytime
    const payload = {
      // Confirmado nos HAR: valor que o browser envia para UTC-3 (BRT)
      "form-timezone-offset": 180,
      tags: [],
      answers: {
        name: order.companyName,
        texto_curto__1: order.cnpj,
        texto64: order.pagSeguroEmail,
        status_1__1: modelCode,
        n_meros__1: String(order.quantity),
        texto__1: order.cnpj,
        e_mail: INTERNAL_CONTACT_EMAIL,
        numeric_mkrzsbar: order.cep,
        text_mkrzxy37: order.street,
        numeric_mkrz2821: order.number,
        text_mkrz6c1a: order.district,
        text_mkrz55fp: order.city,
        text_mkrzpa6q: order.state,
        text_mkrzf4g5: order.complement || "-",
      },
    };

    // Tenta enviar ao Monday
    let response: Response;
    try {
      response = await fetch(MONDAY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (networkErr: any) {
      // Erro de rede — salva estado de erro sem perder dados
      await ctx.runMutation(internal.posOrders._setPosSubmissionResult, {
        orderId: args.orderId,
        submissionResult: "error",
        mondayPayload: payload,
        mondayError: `Erro de rede: ${networkErr?.message ?? "falha na conexão"}`,
      });
      throw new Error(`Falha na conexão com o Monday: ${networkErr?.message ?? "erro desconhecido"}`);
    }

    if (response.status === 201) {
      // Sucesso — salva payload, resposta e timestamp
      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        // resposta sem corpo JSON é aceitável
      }

      await ctx.runMutation(internal.posOrders._setPosSubmissionResult, {
        orderId: args.orderId,
        submissionResult: "sent",
        mondayPayload: payload,
        mondayResponse: responseData,
        submittedAt: Date.now(),
      });

      return { ok: true };
    } else {
      // Resposta não-201 — salva como erro
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // ignora falha ao ler corpo do erro
      }

      const mondayError = `HTTP ${response.status}: ${errorBody.slice(0, 500)}`;

      await ctx.runMutation(internal.posOrders._setPosSubmissionResult, {
        orderId: args.orderId,
        submissionResult: "error",
        mondayPayload: payload,
        mondayError,
      });

      throw new Error(`Monday retornou HTTP ${response.status}. Verifique o painel de erros.`);
    }
  },
});
