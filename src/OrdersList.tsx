import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function OrdersList() {
  const orders = useQuery(api.orders.listOrders);
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

  const handleStatusChange = async (orderId: Id<"orders">, status: string) => {
    try {
      await updateOrderStatus({
        orderId,
        status: status as "pending" | "sent" | "completed" | "cancelled",
      });
      toast.success("Status atualizado.");
    } catch (e) {
      toast.error("Você não tem permissão para alterar o status.");
    }
  };

  if (!orders) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-white">
        <p className="text-sm text-gray-600">Nenhum pedido encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order._id} className="p-4 border rounded-lg bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{order.customerName}</h3>
              <p className="text-sm text-gray-600">{order.customerPhone}</p>
              {order.customerEmail && (
                <p className="text-sm text-gray-600">{order.customerEmail}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100">
                {order.status}
              </span>
            </div>
          </div>

          <div className="mt-3 text-sm">
            <p>
              <strong>Máquina:</strong> {order.selectedMachine}
            </p>
            <p>
              <strong>Quantidade:</strong> {order.quantity}
            </p>
            <p>
              <strong>Pagamento:</strong>{" "}
              {order.paymentMethod === "avista" ? "À vista" : "Parcelado"}
            </p>
            <p>
              <strong>Total:</strong> {formatBRL(order.totalPrice)}
            </p>
            {order.installmentPrice && (
              <p>
                <strong>Parcela:</strong> 12x {formatBRL(order.installmentPrice)}
              </p>
            )}
          </div>

          <div className="flex justify-between items-end mt-3">
            <div className="text-xs text-gray-400">
              {new Date(order._creationTime).toLocaleString("pt-BR")}
            </div>

            <div className="flex space-x-2">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pendente</option>
                <option value="sent">Enviado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
