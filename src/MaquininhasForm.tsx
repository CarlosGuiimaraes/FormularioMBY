import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface MachineOption {
  name: string;
  price: number;
  installmentPrice: number;
}

const pagSeguroMachines: MachineOption[] = [
  { name: "Smart", price: 196.08, installmentPrice: 16.34 },
  { name: "Moderninha Pro", price: 107.88, installmentPrice: 8.99 },
  { name: "Minizinha Chip", price: 47.88, installmentPrice: 3.99 },
];

const getSubPrice = (quantity: number): number => {
  if (quantity <= 10) return 525;
  if (quantity <= 19) return 475;
  if (quantity <= 49) return 425;
  if (quantity <= 99) return 375;
  return 325;
};

export function MaquininhasForm() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    machineType: "pagseguro" as "pagseguro" | "subadquirente",
    selectedMachine: "",
    quantity: 1,
    paymentMethod: "avista" as "avista" | "parcelado",
  });

  const createOrder = useMutation(api.orders.createOrder);

  const calculateTotalPrice = () => {
    if (!formData.selectedMachine) return 0;

    if (formData.machineType === "pagseguro") {
      const machine = pagSeguroMachines.find(m => m.name === formData.selectedMachine);
      return machine ? machine.price * formData.quantity : 0;
    } else {
      const unitPrice = getSubPrice(formData.quantity);
      return unitPrice * formData.quantity;
    }
  };

  const calculateInstallmentPrice = () => {
    if (!formData.selectedMachine) return 0;

    if (formData.machineType === "pagseguro") {
      const machine = pagSeguroMachines.find(m => m.name === formData.selectedMachine);
      return machine ? machine.installmentPrice * formData.quantity : 0;
    } else {
      const unitPrice = getSubPrice(formData.quantity);
      return Math.round((unitPrice / 12) * 100) / 100 * formData.quantity;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.selectedMachine) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const totalPrice = calculateTotalPrice();
    const installmentPrice = calculateInstallmentPrice();

    try {
      const orderId = await createOrder({
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

      // Gerar mensagem do WhatsApp
      const message = generateWhatsAppMessage(formData, totalPrice, installmentPrice);
      const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      toast.success("Pedido criado! Redirecionando para WhatsApp...");
      
      // Reset form
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
      toast.error("Erro ao criar pedido");
    }
  };

  const generateWhatsAppMessage = (data: typeof formData, total: number, installment: number) => {
    const machineInfo = data.machineType === "pagseguro" 
      ? `${data.selectedMachine} (PagSeguro)`
      : data.selectedMachine === "POS A960" 
        ? "POS A960 (Subadquirente)"
        : "S920 (Subadquirente)";

    const paymentInfo = data.paymentMethod === "avista"
      ? `À vista: R$ ${total.toFixed(2)}`
      : `Parcelado: 12x de R$ ${installment.toFixed(2)} sem juros (Total: R$ ${total.toFixed(2)})`;

    return `🏪 *NOVA SOLICITAÇÃO DE MAQUININHA*

👤 *Cliente:* ${data.customerName}
📱 *Telefone:* ${data.customerPhone}
${data.customerEmail ? `📧 *Email:* ${data.customerEmail}` : ''}

🖥️ *Máquina:* ${machineInfo}
📦 *Quantidade:* ${data.quantity}
💰 *Pagamento:* ${paymentInfo}

_Pedido gerado automaticamente pelo sistema_`;
  };

  const renderMachineOptions = () => {
    if (formData.machineType === "pagseguro") {
      return pagSeguroMachines.map((machine) => {
        const totalPrice = machine.price * formData.quantity;
        const totalInstallment = machine.installmentPrice * formData.quantity;
        
        return (
          <div key={machine.name} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="selectedMachine"
                value={machine.name}
                checked={formData.selectedMachine === machine.name}
                onChange={(e) => setFormData({ ...formData, selectedMachine: e.target.value })}
                className="text-blue-600"
              />
              <div className="flex-1">
                <h4 className="font-semibold">{machine.name}</h4>
                <p className="text-sm text-gray-600">
                  Unitário: R$ {machine.price.toFixed(2)} à vista ou 12x R$ {machine.installmentPrice.toFixed(2)}
                </p>
                {formData.quantity > 1 && (
                  <p className="text-sm font-medium text-blue-600">
                    Total ({formData.quantity}x): R$ {totalPrice.toFixed(2)} à vista ou 12x R$ {totalInstallment.toFixed(2)}
                  </p>
                )}
              </div>
            </label>
          </div>
        );
      });
    } else {
      const unitPrice = getSubPrice(formData.quantity);
      const installmentPrice = Math.round((unitPrice / 12) * 100) / 100;
      const totalPrice = unitPrice * formData.quantity;
      const totalInstallment = installmentPrice * formData.quantity;
      
      return (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="selectedMachine"
                value="POS A960"
                checked={formData.selectedMachine === "POS A960"}
                onChange={(e) => setFormData({ ...formData, selectedMachine: e.target.value })}
                className="text-blue-600"
              />
              <div className="flex-1">
                <h4 className="font-semibold">POS A960</h4>
                <p className="text-sm text-gray-600">
                  Unitário: R$ 826,00 à vista ou 12x R$ 69,00
                </p>
                {formData.quantity > 1 && (
                  <p className="text-sm font-medium text-blue-600">
                    Total ({formData.quantity}x): R$ {(826 * formData.quantity).toFixed(2)} à vista ou 12x R$ {(69 * formData.quantity).toFixed(2)}
                  </p>
                )}
              </div>
            </label>
          </div>
          
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="selectedMachine"
                value="S920"
                checked={formData.selectedMachine === "S920"}
                onChange={(e) => setFormData({ ...formData, selectedMachine: e.target.value })}
                className="text-blue-600"
              />
              <div className="flex-1">
                <h4 className="font-semibold">S920</h4>
                <p className="text-sm text-gray-600">
                  Unitário: R$ {unitPrice.toFixed(2)} à vista ou 12x R$ {installmentPrice.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Preço baseado na quantidade: {formData.quantity} unidade(s)
                </p>
                {formData.quantity > 1 && (
                  <p className="text-sm font-medium text-blue-600">
                    Total ({formData.quantity}x): R$ {totalPrice.toFixed(2)} à vista ou 12x R$ {totalInstallment.toFixed(2)}
                  </p>
                )}
              </div>
            </label>
          </div>
        </div>
      );
    }
  };

  const totalPrice = calculateTotalPrice();
  const installmentPrice = calculateInstallmentPrice();

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Dados do Cliente */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Dados do Cliente</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(11) 99999-9999"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (opcional)
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tipo de Máquina */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Tipo de Máquina</h3>
        
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="machineType"
              value="pagseguro"
              checked={formData.machineType === "pagseguro"}
              onChange={(e) => setFormData({ 
                ...formData, 
                machineType: e.target.value as "pagseguro",
                selectedMachine: ""
              })}
              className="text-blue-600"
            />
            <span>PagSeguro</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="machineType"
              value="subadquirente"
              checked={formData.machineType === "subadquirente"}
              onChange={(e) => setFormData({ 
                ...formData, 
                machineType: e.target.value as "subadquirente",
                selectedMachine: ""
              })}
              className="text-blue-600"
            />
            <span>Subadquirente</span>
          </label>
        </div>
      </div>

      {/* Quantidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantidade (máximo 100 unidades)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={formData.quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            const clampedValue = Math.min(Math.max(value, 1), 100);
            setFormData({ ...formData, quantity: clampedValue });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Selecione a quantidade de maquininhas desejada
        </p>
      </div>

      {/* Seleção de Máquina */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Escolha a Máquina</h3>
        <div className="space-y-3">
          {renderMachineOptions()}
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Forma de Pagamento</h3>
        
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="avista"
              checked={formData.paymentMethod === "avista"}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as "avista" })}
              className="text-blue-600"
            />
            <span>À Vista</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="parcelado"
              checked={formData.paymentMethod === "parcelado"}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as "parcelado" })}
              className="text-blue-600"
            />
            <span>Parcelado (12x sem juros)</span>
          </label>
        </div>
      </div>

      {/* Total do Pedido */}
      {formData.selectedMachine && totalPrice > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 shadow-lg">
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center justify-center gap-2">
              💰 Total do Pedido
            </h3>
            
            <div className="bg-white rounded-lg p-5 border border-green-100 shadow-sm">
              <p className="text-sm text-gray-600 mb-3">
                {formData.selectedMachine} ({formData.machineType}) • {formData.quantity} unidade(s)
              </p>
              
              {formData.paymentMethod === "avista" ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-green-700">
                    R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-base text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full inline-block">
                    À Vista
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      12x de R$ {installmentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full inline-block mt-1">
                      sem juros no cartão
                    </p>
                  </div>
                  <div className="border-t border-green-200 pt-3">
                    <p className="text-lg font-semibold text-green-700">
                      Valor Total: R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-semibold text-lg"
      >
        Enviar Pedido via WhatsApp
      </button>
    </form>
  );
}
