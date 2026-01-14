import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function parseAdminEmails(raw: string | undefined | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;]+/g)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Não autorizado.");

  const user = await ctx.db.get("users", userId);
  const email = ((user as any)?.email as string | undefined)?.toLowerCase() ?? null;

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (!email || !adminEmails.has(email)) {
    throw new Error("Acesso restrito ao administrador.");
  }

  return { userId, email };
}

export const listAllOrders = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("sent"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);

    // Puxa os mais recentes (até 200) e filtra.
    const raw = await ctx.db.query("orders").order("desc").take(200);

    const normalizedSearch = (args.search ?? "").trim().toLowerCase();

    const filtered = raw.filter((o: any) => {
      if (args.status && o.status !== args.status) return false;
      if (!normalizedSearch) return true;

      const haystack =
        `${o.customerName ?? ""} ${o.customerPhone ?? ""} ${o.customerEmail ?? ""} ${o.selectedMachine ?? ""} ${o.machineType ?? ""}`
          .toLowerCase()
          .trim();

      return haystack.includes(normalizedSearch);
    });

    return filtered.slice(0, limit);
  },
});

export const updateAnyOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.get(args.orderId);
    if (!existing) throw new Error("Pedido não encontrado.");

    await ctx.db.patch(args.orderId, {
      status: args.status,
    });
  },
});
