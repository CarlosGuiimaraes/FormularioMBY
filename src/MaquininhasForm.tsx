import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface MachineOption {
  name: string;
  price: number;
  installmentPrice: number;
}

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pagSeguroMachines: MachineOption[] = [
  { name: "Smart", price: 196.08, installmentPrice: 16.34 },
  { name: "Moderninha Pro", price: 107.88, installmentPrice: 8.99 },
  { name: "Minizinha Chip", price: 47.88, installmentPrice: 3.99 },
];

const subadquirenteMachines: MachineOption[] = [
  { name: "POS A960", price: 826, installmentPrice: 69 },
];

export function MaquininhasForm() {
  const createOrder = useMutation(api.orders.createOrder);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    machineType: "pagseguro" as "pagseguro" | "subadquirente",
    selectedMachine: "",
    quantity: 1,
    paymentMethod: "avista" as "avista" | "parcelado",
  });

  const renderMachineOptions = () => {
    if (formData.machineType === "pagseguro") {
      return pagSeguroMachines.map((machine) => {
        const totalPrice = machine.price * formData.quantity;
        const installmentPrice = machine.installmentPrice * formData.quantity;

        return (
          <div
            key={machine.name}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              formData.selectedMachine === machine.name
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() =>
              setFormData((prev) => ({ ...prev, selectedMachine: machine.name }))
            }
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{machine.name}</h3>
                <p className="text-sm text-gray-600">
                  Unitário: {formatBRL(machine.price)} à vista ou 12x{" "}
                  {formatBRL(machine.installmentPrice)}
                </p>

                {formData.quantity > 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Total ({formData.quantity}x): {formatBRL(totalPrice)} à vista
                    ou 12x {formatBRL(installmentPrice)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      });
    }

    return subadquirenteMachines.map((machine) => {
      const totalPrice = machine.price * formData.quantity;
      const installmentPrice = machine.installmentPrice * formData.quantity;

      return (
        <div
          key={machine.name}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            formData.selectedMachine === machine.name
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() =>
            setFormData((prev) => ({ ...prev, selectedMachine: machine.name }))
          }
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{machine.name}</h3>
              <p className="text-sm text-gray-600">
                Unitário: {formatBRL(machine.price)} à vista ou 12x{" "}
                {formatBRL(machine.installmentPrice)}
              </p>

              {formData.quantity > 1 && (
                <p className="text-sm text-gray-600 mt-1">
                  Total ({formData.quantity}x): {formatBRL(totalPrice)} à vista
                  ou 12x {formatBRL(installmentPrice)}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  const calculateSelectedMachinePrices = () => {
    const machines =
      formData.machineType === "pagseguro" ? pagSeguroMachines : subadquirenteMachines;

    const selected = machines.find((m) => m.name === formData.selectedMachine);
    if (!selected) return { totalPrice: 0, installmentPrice: 0 };

    return {
      totalPrice: selected.price * formData.quantity,
      installmentPrice: selected.installmentPrice * formData.quantity,
    };
  };

  const { totalPrice, installmentPrice } = calculateSelectedMachinePrices();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selectedMachine) {
      toast.error("Selecione uma máquina.");
      return;
    }

    try {
      await createOrder({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        machineType: formData.machineType,
        selectedMachine: formData.selectedMachine,
        quantity: formData.quantity,
        paymentMethod: formData.paymentMethod,
        totalPrice,
        installmentPrice: formData.paymentMethod === "parcelado" ? installmentPrice : undefined,
      });

      toast.success("Pedido enviado com sucesso.");

      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        machineType: "pagseguro",
        selectedMachine: "",
        quantity: 1,
        paymentMethod: "avista",
      });
    } catch (error) {
      toast.error("Erro ao enviar pedido.");
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Dados do Cliente</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email (opcional)
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Tipo de Máquina</h2>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="pagseguro"
                checked={formData.machineType === "pagseguro"}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    machineType: "pagseguro",
                    selectedMachine: "",
                  }))
                }
              />
              PagSeguro
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="subadquirente"
                checked={formData.machineType === "subadquirente"}
                onChange={() =>
                  setFormData((prev) => ({
                    ...prev,
                    machineType: "subadquirente",
                    selectedMachine: "",
                  }))
                }
              />
              Subadquirente
            </label>
          </div>

          <div className="space-y-3">{renderMachineOptions()}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Pagamento</h2>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="avista"
                checked={formData.paymentMethod === "avista"}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, paymentMethod: "avista" }))
                }
              />
              À vista
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="parcelado"
                checked={formData.paymentMethod === "parcelado"}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, paymentMethod: "parcelado" }))
                }
              />
              Parcelado (12x)
            </label>
          </div>

          {formData.selectedMachine && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-semibold">
                Total: {formatBRL(totalPrice)}
              </p>
              {formData.paymentMethod === "parcelado" && (
                <p className="text-sm text-gray-600 mt-1">
                  12x de {formatBRL(installmentPrice)}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-md bg-primary text-white font-semibold hover:opacity-90 transition"
        >
          Enviar Pedido
        </button>
      </form>
    </div>
  );
}
