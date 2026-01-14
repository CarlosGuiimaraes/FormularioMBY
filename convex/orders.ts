import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    if (!userId) {
      throw new Error("Você precisa estar autenticado para enviar um pedido.");
    }

    const orderId = await ctx.db.insert("orders", {
      createdBy: userId,

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

export const listMyOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(Math.max(args.limit ?? 10, 1), 100);

    return await ctx.db
      .query("orders")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", userId))
      .order("desc")
      .take(limit);
  },
});
