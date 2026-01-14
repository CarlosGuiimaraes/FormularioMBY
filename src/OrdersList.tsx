import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function OrdersList() {
  const orders = useQuery(api.orders.listMyOrders, { limit: 10 });

  if (orders === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-4 text-gray-500">
        Você ainda não possui pedidos recentes.
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    sent: "Enviado",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order._id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="font-semibold text-gray-900">{order.selectedMachine}</div>
              <div className="text-sm text-gray-600">
                Quantidade: {order.quantity} • Pagamento: {order.paymentMethod}
              </div>
              <div className="text-sm text-gray-600">
                Total: R$ {order.totalPrice.toFixed(2)}
              </div>
            </div>

            <div className="text-sm">
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-medium">{statusLabel[order.status] ?? order.status}</div>
            </div>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            {new Date(order._creationTime).toLocaleString("pt-BR")}
          </div>
        </div>
      ))}
    </div>
  );
}
