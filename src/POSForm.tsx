import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { POS_MODELS, PosModel } from "../convex/posConstants";
import { maskCpfCnpj, maskCep, maskPhone } from "./lib/posFormatters";

type FormState = {
  cnpj: string;
  companyName: string;
  whiteLabel: string;
  pagSeguroEmail: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  model: PosModel | "";
  quantity: string;
};

const EMPTY: FormState = {
  cnpj: "",
  companyName: "",
  whiteLabel: "",
  pagSeguroEmail: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  model: "",
  quantity: "1",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-4 w-0.5 rounded-full bg-primary" />
      <span className="text-xs font-bold text-primary uppercase tracking-widest">{children}</span>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[#5D5E60]">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#222222] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

export function POSForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const createPosOrder = useMutation(api.posOrders.createPosOrder);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCepChange(masked: string) {
    set("cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro ?? prev.street,
        district: data.bairro ?? prev.district,
        city: data.localidade ?? prev.city,
        state: data.uf ?? prev.state,
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cnpjDigits = form.cnpj.replace(/\D/g, "");
    const cepDigits = form.cep.replace(/\D/g, "");
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (cnpjDigits.length !== 11 && cnpjDigits.length !== 14) {
      toast.error("Documento inválido. Informe CPF (11 dígitos) ou CNPJ (14 dígitos).");
      return;
    }
    if (!form.companyName.trim()) { toast.error("Razão Social é obrigatória."); return; }
    if (!form.whiteLabel.trim()) { toast.error("Credenciadora / WL é obrigatória."); return; }
    if (!form.pagSeguroEmail.trim()) { toast.error("E-mail PagSeguro é obrigatório."); return; }
    if (phoneDigits.length < 10) { toast.error("Telefone inválido."); return; }
    if (cepDigits.length !== 8) { toast.error("CEP deve ter 8 dígitos."); return; }
    if (!form.street.trim()) { toast.error("Logradouro é obrigatório."); return; }
    if (!form.number.trim()) { toast.error("Número é obrigatório."); return; }
    if (!form.district.trim()) { toast.error("Bairro é obrigatório."); return; }
    if (!form.city.trim()) { toast.error("Cidade é obrigatória."); return; }
    if (!/^[A-Za-z]{2}$/.test(form.state.trim())) { toast.error("UF inválida. Use 2 letras (ex: SP)."); return; }
    if (!form.model) { toast.error("Selecione o modelo."); return; }

    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 5) { toast.error("Quantidade deve ser entre 1 e 5."); return; }

    setLoading(true);
    const tid = toast.loading("Enviando pedido...");

    try {
      await createPosOrder({
        cnpj: cnpjDigits,
        companyName: form.companyName.trim(),
        whiteLabel: form.whiteLabel.trim(),
        pagSeguroEmail: form.pagSeguroEmail.trim(),
        phone: phoneDigits,
        cep: cepDigits,
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || undefined,
        district: form.district.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        model: form.model as PosModel,
        quantity: qty,
      });

      toast.success("Pedido POS enviado com sucesso!", { id: tid });
      setForm(EMPTY);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar pedido.", { id: tid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white shadow-card p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-[#222222] tracking-tight">Solicitação de POS</h2>
        <p className="text-sm text-[#5D5E60] mt-0.5">
          Compra de terminal POS — limite de 5 unidades por CPF/CNPJ por mês.
        </p>
      </div>

      {/* White Label */}
      <div>
        <SectionLabel>Dados do White Label / Credenciadora</SectionLabel>
        <Field label="Credenciadora / White Label" required>
          <input
            className={inputCls}
            placeholder="Nome da credenciadora ou White Label"
            value={form.whiteLabel}
            onChange={(e) => set("whiteLabel", e.target.value)}
          />
        </Field>
      </div>

      {/* Dados da empresa */}
      <div>
        <SectionLabel>Dados da Empresa</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="CPF / CNPJ" required>
            <input
              className={inputCls}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={form.cnpj}
              onChange={(e) => set("cnpj", maskCpfCnpj(e.target.value))}
              inputMode="numeric"
            />
          </Field>
          <Field label="Razão Social / Nome da Empresa" required>
            <input
              className={inputCls}
              placeholder="Nome da empresa"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Contato */}
      <div>
        <SectionLabel>Contato</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="E-mail cadastro PagSeguro" required>
            <input
              className={inputCls}
              type="email"
              placeholder="email@empresa.com"
              value={form.pagSeguroEmail}
              onChange={(e) => set("pagSeguroEmail", e.target.value)}
            />
          </Field>
          <Field label="Telefone" required>
            <input
              className={inputCls}
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(e) => set("phone", maskPhone(e.target.value))}
              inputMode="numeric"
            />
          </Field>
        </div>
      </div>

      {/* Endereço */}
      <div>
        <SectionLabel>Endereço de Entrega</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="CEP" required>
            <div className="relative">
              <input
                className={inputCls}
                placeholder="00000-000"
                value={form.cep}
                onChange={(e) => handleCepChange(maskCep(e.target.value))}
                inputMode="numeric"
                disabled={cepLoading}
              />
              {cepLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-semibold animate-pulse">
                  buscando...
                </div>
              )}
            </div>
          </Field>
          <Field label="Logradouro" required>
            <input
              className={inputCls}
              placeholder="Rua, Av., etc."
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
            />
          </Field>
          <Field label="Número" required>
            <input
              className={inputCls}
              placeholder="123"
              value={form.number}
              onChange={(e) => set("number", e.target.value)}
            />
          </Field>
          <Field label="Complemento">
            <input
              className={inputCls}
              placeholder="Apto, Bloco, Sala... (opcional)"
              value={form.complement}
              onChange={(e) => set("complement", e.target.value)}
            />
          </Field>
          <Field label="Bairro" required>
            <input
              className={inputCls}
              placeholder="Bairro"
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
            />
          </Field>
          <Field label="Cidade" required>
            <input
              className={inputCls}
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="UF" required>
            <input
              className={inputCls}
              placeholder="SP"
              maxLength={2}
              value={form.state}
              onChange={(e) => set("state", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
            />
          </Field>
        </div>
      </div>

      {/* Produto */}
      <div>
        <SectionLabel>Produto</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Modelo" required>
            <select
              className={inputCls}
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            >
              <option value="">Selecione o modelo</option>
              {POS_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade (máx. 5 por pedido)" required>
            <input
              className={inputCls}
              type="number"
              min={1}
              max={5}
              value={form.quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (isNaN(v)) { set("quantity", "1"); return; }
                set("quantity", String(Math.min(5, Math.max(1, v))));
              }}
              inputMode="numeric"
            />
          </Field>
        </div>
        <p className="text-xs text-[#5D5E60] mt-2">Tipo: Compra — Limite de 5 POS por CPF/CNPJ por mês.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary-hover disabled:opacity-50 transition shadow-sm"
      >
        {loading ? "Enviando..." : "Enviar Pedido POS"}
      </button>
    </form>
  );
}
