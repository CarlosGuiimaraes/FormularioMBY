import { useEffect, useMemo, useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { POS_MODELS, PosModel } from "../convex/posConstants";
import {
  formatCpfCnpj,
  formatPhone,
  formatCep,
  formatFullAddress,
  maskCpfCnpj,
  maskCep,
  maskPhone,
} from "./lib/posFormatters";

type SubmissionResult = "not_sent" | "sent" | "error";

const resultLabel: Record<SubmissionResult, string> = {
  not_sent: "Não enviado",
  sent: "Enviado",
  error: "Erro",
};

const resultCls: Record<SubmissionResult, string> = {
  not_sent: "bg-white/10 text-white/60",
  sent: "bg-green-500/20 text-green-400",
  error: "bg-red-500/20 text-red-400",
};

type EditDraft = {
  cnpj: string;
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

function draftFromOrder(o: any): EditDraft {
  return {
    cnpj: formatCpfCnpj(o.cnpj),
    companyName: o.companyName,
    pagSeguroEmail: o.pagSeguroEmail,
    contactEmail: o.contactEmail,
    phone: formatPhone(o.phone),
    cep: formatCep(o.cep),
    street: o.street,
    number: o.number,
    complement: o.complement ?? "",
    district: o.district,
    city: o.city,
    state: o.state,
    model: o.model as PosModel,
    quantity: String(o.quantity),
  };
}

function formatDateTime(ms: number): string {
  try { return new Date(ms).toLocaleString("pt-BR"); } catch { return "—"; }
}

function buildCopyText(o: any): string {
  return [
    "PEDIDO POS — Make Your Bank",
    "=".repeat(40),
    `Data: ${formatDateTime(o.createdAt)}`,
    `Empresa: ${o.companyName}`,
    `CPF/CNPJ: ${formatCpfCnpj(o.cnpj)}`,
    `E-mail PagSeguro: ${o.pagSeguroEmail}`,
    `Telefone: ${formatPhone(o.phone)}`,
    "",
    "PRODUTO",
    "=".repeat(40),
    `Modelo: ${o.model}`,
    `Quantidade: ${o.quantity}`,
    `Tipo: Compra`,
    "",
    "ENDEREÇO",
    "=".repeat(40),
    `CEP: ${formatCep(o.cep)}`,
    `Logradouro: ${o.street}, ${o.number}${o.complement ? `, ${o.complement}` : ""}`,
    `Bairro: ${o.district}`,
    `Cidade: ${o.city} / ${o.state}`,
    "",
    "STATUS",
    "=".repeat(40),
    `Envio Monday: ${o.submissionResult}`,
  ].join("\n");
}

// ── Componentes de layout ──────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold tracking-tight mb-4">{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-0.5 text-sm text-white/90 break-words">{value ?? "—"}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/30";

function EditField({
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
      <label className="text-xs text-white/50">
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export function POSAdminPanel() {
  const [submissionResultFilter, setSubmissionResultFilter] = useState<SubmissionResult | "all">("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);
  const [selected, setSelected] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const queryArgs = useMemo(() => ({
    limit,
    submissionResult: submissionResultFilter === "all" ? undefined : (submissionResultFilter as SubmissionResult),
    search: search.trim() || undefined,
  }), [limit, submissionResultFilter, search]);

  const orders = useQuery(api.posOrders.listAllPosOrders, queryArgs);
  const submitToMonday = useAction(api.posOrders.submitPosOrderToMonday);
  const updateOrder = useMutation(api.posOrders.updatePosOrder);
  const deleteOrder = useMutation(api.posOrders.deletePosOrder);

  // Mantém selected sincronizado com a query reativa.
  // Quando uma mutation (save ou envio Monday) commita, orders atualiza
  // automaticamente via Convex reactivity e selected reflete os dados reais do DB.
  useEffect(() => {
    if (!selected || !orders || editMode) return;
    const fresh = orders.find((o) => o._id === selected._id);
    if (fresh && fresh.updatedAt !== selected.updatedAt) {
      setSelected(fresh);
    }
  }, [orders]);

  // ── Envio ao Monday ──────────────────────────────────────────────────────

  async function handleSubmitMonday(orderId: Id<"posOrders">, isSent: boolean) {
    setSendingId(String(orderId));
    const label = isSent ? "Reenviando para Monday..." : "Enviando para Monday...";
    const tid = toast.loading(label);
    try {
      await submitToMonday({ orderId });
      toast.success("Pedido enviado ao Monday com sucesso!", { id: tid });
      setSelected((prev: any) => prev ? { ...prev, submissionResult: "sent" } : prev);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar para Monday.", { id: tid });
      setSelected((prev: any) => prev ? { ...prev, submissionResult: "error" } : prev);
    } finally {
      setSendingId(null);
    }
  }

  // ── Copiar ───────────────────────────────────────────────────────────────

  function handleCopy(o: any) {
    navigator.clipboard
      .writeText(buildCopyText(o))
      .then(() => toast.success("Dados copiados."))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  // ── Edição ───────────────────────────────────────────────────────────────

  function openEdit() {
    if (!selected) return;
    setDraft(draftFromOrder(selected));
    setEditMode(true);
  }

  function setD(field: keyof EditDraft, value: string) {
    setDraft((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave() {
    if (!draft || !selected) return;
    setSaving(true);
    const tid = toast.loading("Salvando alterações...");
    try {
      await updateOrder({
        orderId: selected._id as Id<"posOrders">,
        cnpj: draft.cnpj,
        companyName: draft.companyName,
        pagSeguroEmail: draft.pagSeguroEmail,
        phone: draft.phone,
        cep: draft.cep,
        street: draft.street,
        number: draft.number,
        complement: draft.complement || undefined,
        district: draft.district,
        city: draft.city,
        state: draft.state,
        model: draft.model as PosModel,
        quantity: parseInt(draft.quantity, 10),
      });

      toast.success("Pedido atualizado.", { id: tid });
      setEditMode(false);
      // selected se sincroniza via useEffect quando orders atualizar
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar.", { id: tid });
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditMode(false);
    setDraft(null);
  }

  async function confirmDelete() {
    if (!selected) return;
    setDeleting(true);
    const tid = toast.loading("Apagando pedido...");
    try {
      await deleteOrder({ orderId: selected._id as Id<"posOrders"> });
      toast.success("Pedido apagado.", { id: tid });
      closeModal();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao apagar.", { id: tid });
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  function openModal(o: any) {
    setSelected(o);
    setEditMode(false);
    setDraft(null);
  }

  function closeModal() {
    setSelected(null);
    setEditMode(false);
    setDraft(null);
    setConfirmingDelete(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

      {/* Cabeçalho + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Painel POS ADM</h2>
          <p className="text-sm text-white/60">
            Pedidos de compra de terminal POS (<code className="text-white/40">posOrders</code>).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Buscar empresa, CNPJ, e-mail, modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={submissionResultFilter}
            onChange={(e) => setSubmissionResultFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="not_sent">Não enviado</option>
            <option value="sent">Enviado</option>
            <option value="error">Erro</option>
          </select>
          <select
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-auto rounded-2xl border border-white/10">
        <table className="min-w-full">
          <thead className="bg-black/20">
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Data</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Empresa</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">CPF / CNPJ</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">E-mail PagSeguro</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Telefone</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Modelo</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Qtd</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60 min-w-[240px]">Endereço</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Status</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => {
              const result = o.submissionResult as SubmissionResult;
              const isSending = sendingId === String(o._id);
              const isSent = result === "sent";
              return (
                <tr key={o._id} className="border-b border-white/10 last:border-b-0 hover:bg-white/[0.02] transition">
                  <td className="py-2 px-3 text-xs text-white/60 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                  <td className="py-2 px-3 text-sm text-white/90 whitespace-nowrap">{o.companyName}</td>
                  <td className="py-2 px-3 text-sm text-white/80 whitespace-nowrap tabular-nums">{formatCpfCnpj(o.cnpj)}</td>
                  <td className="py-2 px-3 text-sm text-white/70 whitespace-nowrap">{o.pagSeguroEmail}</td>
                  <td className="py-2 px-3 text-sm text-white/70 whitespace-nowrap tabular-nums">{formatPhone(o.phone)}</td>
                  <td className="py-2 px-3 text-sm text-white/90 whitespace-nowrap">{o.model}</td>
                  <td className="py-2 px-3 text-sm text-white/80 tabular-nums whitespace-nowrap">{o.quantity}</td>
                  <td className="py-2 px-3 text-sm text-white/70 min-w-[240px]">
                    <div className="break-words">{formatFullAddress(o)}</div>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${resultCls[result]}`}>
                      {resultLabel[result]}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold whitespace-nowrap"
                        onClick={() => openModal(o)}
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold whitespace-nowrap"
                        onClick={() => handleCopy(o)}
                      >
                        Copiar
                      </button>
                      <button
                        type="button"
                        disabled={isSending}
                        title={isSent ? "Reenviar ao Monday" : "Enviar ao Monday"}
                        className={[
                          "px-2 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition",
                          isSent
                            ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/50"
                            : "border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary",
                          isSending ? "opacity-40 cursor-not-allowed" : "",
                        ].join(" ")}
                        onClick={() => handleSubmitMonday(o._id as Id<"posOrders">, isSent)}
                      >
                        {isSending ? "…" : isSent ? "Reenviar" : "Monday"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!orders?.length && (
              <tr>
                <td className="py-4 px-3 text-sm text-white/60" colSpan={10}>
                  Nenhum pedido POS encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={editMode ? undefined : closeModal} />

          <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b0c10] p-5 shadow-lg overflow-y-auto max-h-[90vh]">

            {/* Header do modal */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-lg font-semibold tracking-tight">
                  {editMode ? "Editar Pedido POS" : "Detalhes do Pedido POS"}
                </div>
                <div className="mt-1 text-xs text-white/50">
                  ID: {String(selected._id)} • {formatDateTime(selected.createdAt)}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      disabled={saving}
                      className="px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-sm font-semibold text-primary disabled:opacity-50 transition"
                      onClick={handleSave}
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                      onClick={openEdit}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                      onClick={() => handleCopy(selected)}
                    >
                      Copiar
                    </button>
                    {!confirmingDelete && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 transition"
                        onClick={() => setConfirmingDelete(true)}
                      >
                        Apagar
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                      onClick={closeModal}
                    >
                      Fechar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Confirmação de exclusão ── */}
            {confirmingDelete && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="text-sm font-semibold text-red-400 mb-1">Confirmar exclusão</div>
                <p className="text-sm text-white/70 mb-4">
                  Tem certeza que deseja apagar o pedido de{" "}
                  <span className="font-semibold text-white">{selected.companyName}</span>?
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-sm font-semibold text-red-400 disabled:opacity-50 transition"
                    onClick={confirmDelete}
                  >
                    {deleting ? "Apagando..." : "Sim, apagar"}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* ── Modo visualização ── */}
            {!editMode && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SectionCard title="Dados da Empresa">
                    <div className="grid grid-cols-1 gap-3">
                      <FieldRow label="Razão Social" value={selected.companyName} />
                      <FieldRow label="CPF / CNPJ" value={formatCpfCnpj(selected.cnpj)} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Contato">
                    <div className="grid grid-cols-1 gap-3">
                      <FieldRow label="E-mail PagSeguro" value={selected.pagSeguroEmail} />
                      <FieldRow label="Telefone" value={formatPhone(selected.phone)} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Produto">
                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="Modelo" value={selected.model} />
                      <FieldRow label="Quantidade" value={selected.quantity} />
                      <FieldRow label="Tipo" value="Compra" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Endereço">
                    <div className="grid grid-cols-1 gap-3">
                      <FieldRow label="CEP" value={formatCep(selected.cep)} />
                      <FieldRow
                        label="Logradouro"
                        value={`${selected.street}, ${selected.number}${selected.complement ? `, ${selected.complement}` : ""}`}
                      />
                      <FieldRow label="Bairro" value={selected.district} />
                      <FieldRow label="Cidade / UF" value={`${selected.city} / ${selected.state}`} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Status de Envio">
                    <div className="grid grid-cols-1 gap-3">
                      <FieldRow
                        label="submissionResult"
                        value={
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${resultCls[selected.submissionResult as SubmissionResult]}`}>
                            {resultLabel[selected.submissionResult as SubmissionResult]}
                          </span>
                        }
                      />
                      {selected.submittedAt && (
                        <FieldRow label="Enviado em" value={formatDateTime(selected.submittedAt)} />
                      )}
                      {selected.submissionResult === "error" && selected.mondayError && (
                        <FieldRow
                          label="Detalhe do erro"
                          value={<span className="text-red-400 text-xs font-mono break-all">{selected.mondayError}</span>}
                        />
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard title="Auditoria">
                    <div className="grid grid-cols-1 gap-3">
                      <FieldRow label="Criado em" value={formatDateTime(selected.createdAt)} />
                      <FieldRow label="Atualizado em" value={formatDateTime(selected.updatedAt)} />
                      <FieldRow label="E-mail da conta" value={selected.userEmail ?? "—"} />
                    </div>
                  </SectionCard>
                </div>

                {/* Envio / Reenvio ao Monday */}
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {selected.submissionResult === "sent" ? "Reenviar ao Monday / Paytime" : "Enviar ao Monday / Paytime"}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">
                      {selected.submissionResult === "sent"
                        ? "Pedido já enviado. Clique para reenviar com os dados atuais."
                        : selected.submissionResult === "error"
                          ? "Tentativa anterior falhou. Clique para reenviar."
                          : "Enviar este pedido ao formulário Monday/Paytime."}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={sendingId === String(selected._id)}
                    className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-sm font-semibold text-primary disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                    onClick={() => handleSubmitMonday(
                      selected._id as Id<"posOrders">,
                      selected.submissionResult === "sent"
                    )}
                  >
                    {sendingId === String(selected._id)
                      ? "Enviando..."
                      : selected.submissionResult === "sent"
                        ? "Reenviar"
                        : "Enviar para Monday"}
                  </button>
                </div>
              </>
            )}

            {/* ── Modo edição ── */}
            {editMode && draft && (
              <div className="space-y-5">
                {/* Dados da empresa */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <div className="text-sm font-semibold tracking-tight">Dados da Empresa</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EditField label="CPF / CNPJ" required>
                      <input className={inputCls} placeholder="000.000.000-00 ou 00.000.000/0000-00" value={draft.cnpj}
                        onChange={(e) => setD("cnpj", maskCpfCnpj(e.target.value))} inputMode="numeric" />
                    </EditField>
                    <EditField label="Razão Social / Nome da Empresa" required>
                      <input className={inputCls} value={draft.companyName}
                        onChange={(e) => setD("companyName", e.target.value)} />
                    </EditField>
                  </div>
                </div>

                {/* Contato */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <div className="text-sm font-semibold tracking-tight">Contato</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EditField label="E-mail PagSeguro" required>
                      <input className={inputCls} type="email" value={draft.pagSeguroEmail}
                        onChange={(e) => setD("pagSeguroEmail", e.target.value)} />
                    </EditField>
                    <EditField label="Telefone" required>
                      <input className={inputCls} placeholder="(00) 00000-0000" value={draft.phone}
                        onChange={(e) => setD("phone", maskPhone(e.target.value))} inputMode="numeric" />
                    </EditField>
                  </div>
                </div>

                {/* Endereço */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <div className="text-sm font-semibold tracking-tight">Endereço</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EditField label="CEP" required>
                      <input className={inputCls} placeholder="00000-000" value={draft.cep}
                        onChange={(e) => setD("cep", maskCep(e.target.value))} inputMode="numeric" />
                    </EditField>
                    <EditField label="Logradouro" required>
                      <input className={inputCls} value={draft.street}
                        onChange={(e) => setD("street", e.target.value)} />
                    </EditField>
                    <EditField label="Número" required>
                      <input className={inputCls} value={draft.number}
                        onChange={(e) => setD("number", e.target.value)} />
                    </EditField>
                    <EditField label="Complemento">
                      <input className={inputCls} placeholder="Opcional" value={draft.complement}
                        onChange={(e) => setD("complement", e.target.value)} />
                    </EditField>
                    <EditField label="Bairro" required>
                      <input className={inputCls} value={draft.district}
                        onChange={(e) => setD("district", e.target.value)} />
                    </EditField>
                    <EditField label="Cidade" required>
                      <input className={inputCls} value={draft.city}
                        onChange={(e) => setD("city", e.target.value)} />
                    </EditField>
                    <EditField label="UF" required>
                      <input className={inputCls} maxLength={2} value={draft.state}
                        onChange={(e) => setD("state", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
                    </EditField>
                  </div>
                </div>

                {/* Produto */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <div className="text-sm font-semibold tracking-tight">Produto</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <EditField label="Modelo" required>
                      <select className={inputCls} value={draft.model}
                        onChange={(e) => setD("model", e.target.value)}>
                        <option value="">Selecione</option>
                        {POS_MODELS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </EditField>
                    <EditField label="Quantidade (1–5)" required>
                      <input className={inputCls} type="number" min={1} max={5} value={draft.quantity}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          setD("quantity", isNaN(n) ? "1" : String(Math.min(5, Math.max(1, n))));
                        }} inputMode="numeric" />
                    </EditField>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
