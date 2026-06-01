import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCnpj, formatCpf, formatPhone, formatFullAddress } from "./lib/posFormatters";

type SubmissionResult = "not_sent" | "sent" | "error";

const resultLabel: Record<SubmissionResult, string> = {
  not_sent: "Não enviado",
  sent: "Enviado",
  error: "Erro no envio",
};

const resultCls: Record<SubmissionResult, string> = {
  not_sent: "bg-gray-100 text-[#5D5E60]",
  sent: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-600",
};

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export function POSOrdersList() {
  const orders = useQuery(api.posOrders.listMyPosOrders);

  if (orders === undefined) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-card p-6">
        <h2 className="text-base font-bold text-[#222222] mb-3">Meus Pedidos POS</h2>
        <p className="text-sm text-[#5D5E60]">Carregando...</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-card p-6">
        <h2 className="text-base font-bold text-[#222222] mb-3">Meus Pedidos POS</h2>
        <p className="text-sm text-[#5D5E60]">Nenhum pedido POS ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-card p-6">
      <h2 className="text-base font-bold text-[#222222] mb-4">Meus Pedidos POS</h2>

      <div className="space-y-3">
        {orders.map((order) => {
          const result = order.submissionResult as SubmissionResult;
          return (
            <div
              key={order._id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold text-[#222222] truncate">{order.companyName}</div>
                  {order.whiteLabel && (
                    <div className="text-sm text-[#5D5E60]">WL: {order.whiteLabel}</div>
                  )}
                  <div className="text-sm text-[#5D5E60] tabular-nums">
                    CNPJ: {formatCnpj(order.cnpj)}
                  </div>
                  {order.responsibleCpf && (
                    <div className="text-sm text-[#5D5E60]">
                      CPF responsável: {formatCpf(order.responsibleCpf)}
                    </div>
                  )}
                  <div className="text-sm text-[#222222] font-medium">
                    {order.model} — {order.quantity} un.
                  </div>
                  <div className="text-sm text-[#5D5E60] break-words">
                    {formatFullAddress(order)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${resultCls[result]}`}>
                    {resultLabel[result]}
                  </span>
                  <span className="text-xs text-[#5D5E60]">{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
