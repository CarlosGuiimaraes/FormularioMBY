import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { posModelValidator } from "./posConstants";

const applicationTables = {
  orders: defineTable({
    // Identifica o usuário autenticado (inclui login anônimo).
    // Optional para não quebrar registros legados já existentes na tabela.
    userId: v.optional(v.id("users")),
    // Email do usuário autenticado (quando disponível). Útil para auditoria/admin.
    userEmail: v.optional(v.string()),

    customerName: v.string(),
    customerPhone: v.string(),
    customerEmail: v.optional(v.string()),

    // Obrigatório no frontend quando machineType = "pagseguro"
    pagSeguroEmail: v.optional(v.string()),

    deliveryAddress: v.optional(v.string()),

    machineType: v.union(v.literal("pagseguro"), v.literal("subadquirente")),
    selectedMachine: v.string(),

    quantity: v.number(),

    paymentMethod: v.union(v.literal("avista"), v.literal("parcelado")),
    totalPrice: v.number(),

    // Para parcelado: número de parcelas escolhido (2–12)
    installments: v.optional(v.number()),

    // Parcela unitária (quando aplicável)
    installmentPrice: v.optional(v.number()),

    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),

    whatsappSent: v.boolean(),
  }).index("by_userId", ["userId"]),

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
  })
    .index("by_userId", ["userId"])
    .index("by_cnpj", ["cnpj"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
