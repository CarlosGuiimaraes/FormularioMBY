import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import {
  formatCnpj,
  formatCpf,
  formatPhone,
  formatCep,
  formatFullAddress,
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

function formatDateTime(ms: number): string {
  try {
    return new Date(ms).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

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

function buildCopyText(o: any): string {
  const lines = [
    "PEDIDO POS — Make Your Bank",
    "=".repeat(40),
    `Data: ${formatDateTime(o.createdAt)}`,
    `Empresa: ${o.companyName}`,
    `CNPJ: ${formatCnpj(o.cnpj)}`,
    `CPF Responsável: ${formatCpf(o.responsibleCpf)}`,
    `E-mail PagSeguro: ${o.pagSeguroEmail}`,
    `E-mail Contato: ${o.contactEmail}`,
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
  ];
  return lines.join("\n");
}

export function POSAdminPanel() {
  const [submissionResultFilter, setSubmissionResultFilter] = useState<SubmissionResult | "all">("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);
  const [selected, setSelected] = useState<any | null>(null);

  const queryArgs = useMemo(() => ({
    limit,
    submissionResult:
      submissionResultFilter === "all" ? undefined : (submissionResultFilter as SubmissionResult),
    search: search.trim() || undefined,
  }), [limit, submissionResultFilter, search]);

  const orders = useQuery(api.posOrders.listAllPosOrders, queryArgs);

  function handleCopy(o: any) {
    navigator.clipboard
      .writeText(buildCopyText(o))
      .then(() => toast.success("Dados copiados para a área de transferência."))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
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

      <div className="overflow-auto rounded-2xl border border-white/10">
        <table className="min-w-full">
          <thead className="bg-black/20">
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Data</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Empresa</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">CNPJ</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">CPF Resp.</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">E-mail PagSeguro</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">E-mail Contato</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Telefone</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Modelo</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Qtd</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60 min-w-[260px]">Endereço</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Status</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-white/60">Ações</th>
            </tr>
          </thead>

          <tbody>
            {orders?.map((o) => {
              const result = o.submissionResult as SubmissionResult;
              return (
                <tr key={o._id} className="border-b border-white/10 last:border-b-0 hover:bg-white/3 transition">
                  <td className="py-2 px-3 text-xs text-white/60 whitespace-nowrap">
                    {formatDateTime(o.createdAt)}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/90 whitespace-nowrap">
                    {o.companyName}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/80 whitespace-nowrap tabular-nums">
                    {formatCnpj(o.cnpj)}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/70 whitespace-nowrap tabular-nums">
                    {formatCpf(o.responsibleCpf)}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/70 whitespace-nowrap">
                    {o.pagSeguroEmail}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/70 whitespace-nowrap">
                    {o.contactEmail}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/70 whitespace-nowrap tabular-nums">
                    {formatPhone(o.phone)}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/90 whitespace-nowrap">
                    {o.model}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/80 tabular-nums whitespace-nowrap">
                    {o.quantity}
                  </td>
                  <td className="py-2 px-3 text-sm text-white/70 min-w-[260px]">
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
                        onClick={() => setSelected(o)}
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
                        disabled
                        title="Envio ao Monday ainda não implementado"
                        className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold whitespace-nowrap opacity-40 cursor-not-allowed"
                      >
                        Monday
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!orders?.length && (
              <tr>
                <td className="py-4 px-3 text-sm text-white/60" colSpan={12}>
                  Nenhum pedido POS encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de detalhes */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />

          <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b0c10] p-5 shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-lg font-semibold tracking-tight">Detalhes do Pedido POS</div>
                <div className="mt-1 text-xs text-white/50">
                  ID: {String(selected._id)} • {formatDateTime(selected.createdAt)}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                  onClick={() => handleCopy(selected)}
                >
                  Copiar dados
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                  onClick={() => setSelected(null)}
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Dados da Empresa">
                <div className="grid grid-cols-1 gap-3">
                  <FieldRow label="Razão Social" value={selected.companyName} />
                  <FieldRow label="CNPJ" value={formatCnpj(selected.cnpj)} />
                  <FieldRow label="CPF Responsável" value={formatCpf(selected.responsibleCpf)} />
                </div>
              </SectionCard>

              <SectionCard title="Contato">
                <div className="grid grid-cols-1 gap-3">
                  <FieldRow label="E-mail PagSeguro" value={selected.pagSeguroEmail} />
                  <FieldRow label="E-mail Contato" value={selected.contactEmail} />
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
                  {selected.mondayError && (
                    <FieldRow label="Erro Monday" value={selected.mondayError} />
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

            {/* Ação futura: envio ao Monday */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Enviar ao Monday / Paytime</div>
                <div className="text-xs text-white/50 mt-0.5">
                  Disponível após mapeamento dos códigos de modelo.
                </div>
              </div>
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold opacity-40 cursor-not-allowed"
              >
                Em breve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
