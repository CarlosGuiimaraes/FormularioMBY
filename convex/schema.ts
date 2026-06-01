import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { posModelValidator } from "./posConstants";

const applicationTables = {
  posOrders: defineTable({
    // Rastreamento de usuário (mesmo padrão de orders)
    userId: v.optional(v.id("users")),
    userEmail: v.optional(v.string()),

    // Documento da empresa: CPF (11 dígitos) ou CNPJ (14 dígitos), somente números.
    // responsibleCpf mantido como opcional para compatibilidade com registros antigos.
    cnpj: v.string(),
    responsibleCpf: v.optional(v.string()),
    companyName: v.string(),

    // Contato
    pagSeguroEmail: v.string(),
    contactEmail: v.string(),
    phone: v.string(),

    // Endereço (campos separados; CEP armazenado apenas com dígitos)
    cep: v.string(),
    street: v.string(),
    number: v.string(),
    complement: v.optional(v.string()),
    district: v.string(),
    city: v.string(),
    state: v.string(),

    // Credenciadora / White Label que realizou o pedido
    whiteLabel: v.optional(v.string()),

    // Produto
    model: posModelValidator,
    quantity: v.number(),
    purchaseType: v.literal("compra"),

    // Resultado do envio ao Monday/Paytime
    submissionResult: v.union(
      v.literal("not_sent"),
      v.literal("sent"),
      v.literal("error"),
    ),

    // Payload e resposta do Monday (estrutura para futura integração)
    mondayPayload: v.optional(v.any()),
    mondayResponse: v.optional(v.any()),
    mondayError: v.optional(v.string()),
    submittedAt: v.optional(v.number()),

    // Timestamps próprios (além do _creationTime do Convex)
    createdAt: v.number(),
    updatedAt: v.number(),

    // ID do pedido de origem (orders legado), mantido como referência histórica
    migratedFromOrderId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_cnpj", ["cnpj"])
    .index("by_createdAt", ["createdAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
