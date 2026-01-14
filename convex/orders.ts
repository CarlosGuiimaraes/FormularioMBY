import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function isAnonymousIdentity(identity: Awaited<ReturnType<any>> | null) {
  if (!identity) return false;
  const email = identity.email ?? null;
  const token = (identity.tokenIdentifier ?? "").toLowerCase();
  return (
    !email || token.includes("anonymous") || token.includes("anon")
  );
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Você precisa estar autenticado para enviar um pedido.");
    }

    const orderId = await ctx.db.insert("orders", {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Bloqueia “Pedidos Recentes” para login anônimo
    if (isAnonymousIdentity(identity)) return [];

    return await ctx.db.query("orders").order("desc").collect();
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado.");
    }

    // Evita que login anônimo altere pedidos
    if (isAnonymousIdentity(identity)) {
      throw new Error("Não autorizado (modo anônimo).");
    }

    const { orderId, ...updates } = args;
    await ctx.db.patch(orderId, updates);
  },
});
