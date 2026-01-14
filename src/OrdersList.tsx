import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function OrdersList() {
  const orders = useQuery(api.orders.listMyOrders, { limit: 20 });
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

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
        Nenhum pedido recente foi encontrado para este usuário.
      </div>
    );
  }

  const handleStatusChange = async (
    orderId: Id<"orders">,
    newStatus: "pending" | "sent" | "completed" | "cancelled"
  ) => {
    await updateOrderStatus({ orderId, status: newStatus });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="font-semibold text-gray-900">
                  {order.selectedMachine}
                </div>
                <div className="text-sm text-gray-600">
                  Quantidade: {order.quantity} • Pagamento: {order.paymentMethod}
                </div>
                <div className="text-sm text-gray-600">
                  Total: R$ {order.totalPrice.toFixed(2)}
                </div>
              </div>

              <div className="min-w-[180px]">
                <label className="block text-xs text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(order._id, e.target.value as any)
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="pending">Pendente</option>
                  <option value="sent">Enviado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              {new Date(order._creationTime).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
