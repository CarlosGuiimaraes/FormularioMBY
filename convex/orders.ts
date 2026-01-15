import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Retorna os pedidos recentes:
 * - Usuário comum: apenas os próprios pedidos
 * - Admin (email em ADMIN_EMAILS): vê todos os pedidos
 */

function parseAdminEmails(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;]+/g)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function getIsAdmin(ctx: any, userId: any): Promise<boolean> {
  const user = await ctx.db.get(userId);
  const email = (user?.email ?? "").toString().trim().toLowerCase();
  if (!email) return false;

  const admins = parseAdminEmails(process.env.ADMIN_EMAILS);
  return admins.has(email);
}

export const createOrder = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),

    machineType: v.union(v.literal("pagseguro"), v.literal("subadquirente")),
    selectedMachine: v.string(),
    quantity: v.number(),
    paymentMethod: v.union(v.literal("avista"), v.literal("parcelado")),

    totalPrice: v.number(),
    installmentPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado.");

    const orderId = await ctx.db.insert("orders", {
      userId,

      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,

      machineType: args.machineType,
      selectedMachine: args.selectedMachine,
      quantity: args.quantity,
      paymentMethod: args.paymentMethod,

      totalPrice: args.totalPrice,
      installmentPrice: args.installmentPrice,

      status: "pending",
      whatsappSent: false,
    });

    return orderId;
  },
});

export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const isAdmin = await getIsAdmin(ctx, userId);

    if (isAdmin) {
      return await ctx.db.query("orders").order("desc").collect();
    }

    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    whatsappSent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autenticado.");

    const isAdmin = await getIsAdmin(ctx, userId);
    if (!isAdmin) throw new Error("Sem permissão.");

    const { orderId, ...updates } = args;
    await ctx.db.patch(orderId, updates);
  },
});
