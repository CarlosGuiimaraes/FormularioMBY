import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { POS_MODELS, PosModel } from "../convex/posConstants";
import { maskCnpj, maskCpf, maskCep, maskPhone } from "./lib/posFormatters";

type FormState = {
  cnpj: string;
  responsibleCpf: string;
  companyName: string;
  pagSeguroEmail: string;
  contactEmail: string;
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
  responsibleCpf: "",
  companyName: "",
  pagSeguroEmail: "",
  contactEmail: "",
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
      <label className="text-xs font-medium text-white/70">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30";

export function POSForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const createPosOrder = useMutation(api.posOrders.createPosOrder);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cnpjDigits = form.cnpj.replace(/\D/g, "");
    const cpfDigits = form.responsibleCpf.replace(/\D/g, "");
    const cepDigits = form.cep.replace(/\D/g, "");
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (cnpjDigits.length !== 14) { toast.error("CNPJ deve ter 14 dígitos."); return; }
    if (cpfDigits.length !== 11) { toast.error("CPF deve ter 11 dígitos."); return; }
    if (!form.companyName.trim()) { toast.error("Razão Social é obrigatória."); return; }
    if (!form.pagSeguroEmail.trim()) { toast.error("E-mail PagSeguro é obrigatório."); return; }
    if (!form.contactEmail.trim()) { toast.error("E-mail de contato é obrigatório."); return; }
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
        responsibleCpf: cpfDigits,
        companyName: form.companyName.trim(),
        pagSeguroEmail: form.pagSeguroEmail.trim(),
        contactEmail: form.contactEmail.trim(),
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
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Solicitação de POS</h2>
        <p className="text-sm text-white/60 mt-1">
          Compra de terminal POS. Limite: 5 unidades por CNPJ/mês.
        </p>
      </div>

      {/* Dados da empresa */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Dados da Empresa
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="CNPJ" required>
            <input
              className={inputCls}
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={(e) => set("cnpj", maskCnpj(e.target.value))}
              inputMode="numeric"
            />
          </Field>

          <Field label="CPF do Responsável" required>
            <input
              className={inputCls}
              placeholder="000.000.000-00"
              value={form.responsibleCpf}
              onChange={(e) => set("responsibleCpf", maskCpf(e.target.value))}
              inputMode="numeric"
            />
          </Field>

          <Field label="Razão Social / Nome da Empresa" required>
            <input
              className={`${inputCls} sm:col-span-2`}
              placeholder="Nome da empresa"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Contato
        </div>
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

          <Field label="E-mail de contato" required>
            <input
              className={inputCls}
              type="email"
              placeholder="contato@empresa.com"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
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
      <div className="space-y-3">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Endereço de Entrega
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="CEP" required>
            <input
              className={inputCls}
              placeholder="00000-000"
              value={form.cep}
              onChange={(e) => set("cep", maskCep(e.target.value))}
              inputMode="numeric"
            />
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
      <div className="space-y-3">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Produto
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Modelo" required>
            <select
              className={inputCls}
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
            >
              <option value="">Selecione o modelo</option>
              {POS_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
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

        <p className="text-xs text-white/50">
          Tipo: Compra — Limite de 5 POS por CNPJ por mês (acumulado entre pedidos).
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition"
      >
        {loading ? "Enviando..." : "Enviar Pedido POS"}
      </button>
    </form>
  );
}
