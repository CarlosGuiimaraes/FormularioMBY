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
  not_sent: "bg-white/10 text-white/70",
  sent: "bg-green-500/20 text-green-400",
  error: "bg-red-500/20 text-red-400",
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
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4">Meus Pedidos POS</h2>
        <p className="text-sm text-white/60">Carregando...</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold tracking-tight mb-4">Meus Pedidos POS</h2>
        <p className="text-sm text-white/60">Nenhum pedido POS ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold tracking-tight mb-4">Meus Pedidos POS</h2>

      <div className="space-y-3">
        {orders.map((order) => {
          const result = order.submissionResult as SubmissionResult;
          return (
            <div
              key={order._id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold truncate">{order.companyName}</div>
                  <div className="text-sm text-white/60 tabular-nums">
                    CNPJ: {formatCnpj(order.cnpj)}
                  </div>
                  <div className="text-sm text-white/60">
                    CPF responsável: {formatCpf(order.responsibleCpf)}
                  </div>
                  <div className="text-sm text-white/80">
                    {order.model} — {order.quantity} un.
                  </div>
                  <div className="text-sm text-white/60 break-words">
                    {formatFullAddress(order)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${resultCls[result]}`}
                  >
                    {resultLabel[result]}
                  </span>
                  <span className="text-xs text-white/40">{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
