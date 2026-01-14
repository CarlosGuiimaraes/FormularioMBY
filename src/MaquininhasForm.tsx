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

  const formatMoney = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const calculateTotalPrice = () => {
    if (!formData.selectedMachine) return 0;

    if (formData.machineType === "pagseguro") {
      const machine = pagSeguroMachines.find(
        (m) => m.name === formData.selectedMachine
      );
      return machine ? machine.price * formData.quantity : 0;
    } else {
      const unitPrice = getSubPrice(formData.quantity);
      return unitPrice * formData.quantity;
    }
  };

  const calculateInstallmentPrice = () => {
    if (!formData.selectedMachine) return 0;

    if (formData.machineType === "pagseguro") {
      const machine = pagSeguroMachines.find(
        (m) => m.name === formData.selectedMachine
      );
      return machine ? machine.installmentPrice * formData.quantity : 0;
    } else {
      const unitPrice = getSubPrice(formData.quantity);
      return (
        (Math.round((unitPrice / 12) * 100) / 100) * formData.
