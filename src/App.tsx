import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignInForm } from "./SignInForm";
import { MaquininhasForm } from "./MaquininhasForm";
import { OrdersList } from "./OrdersList";
import { AdminPanel } from "./AdminPanel";
import { POSForm } from "./POSForm";
import { POSOrdersList } from "./POSOrdersList";
import { POSAdminPanel } from "./POSAdminPanel";

type AdminTab = "pedidos" | "admin" | "posadm";
type FormTab = "maquininhas" | "pos";

export default function App() {
  const authInfo = useQuery(api.auth.authInfo);
  const loggedInUser = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();

  const isAdmin = !!authInfo?.isAdmin;

  const [adminTab, setAdminTab] = useState<AdminTab>("pedidos");
  const [formTab, setFormTab] = useState<FormTab>("maquininhas");

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto w-full max-w-[920px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-primary/25 border border-primary/30" />
            <div className="min-w-0">
              <div className="font-semibold tracking-tight truncate">Pedido de Maquininhas</div>
              <div className="text-xs text-white/60 truncate">
                {loggedInUser?.email ?? authInfo?.email ?? ""}
              </div>
            </div>

            {isAdmin && (
              <span className="ml-2 hidden sm:inline-flex text-[11px] px-2 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary">
                Admin
              </span>
            )}
          </div>

          <Authenticated>
            <button
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
              onClick={() => void signOut()}
            >
              Sair
            </button>
          </Authenticated>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[920px] px-4 py-10">
        <Unauthenticated>
          <div className="max-w-md mx-auto bg-white/5 p-6 rounded-2xl border border-white/10">
            <h1 className="text-2xl font-semibold mb-2">Acesso</h1>
            <p className="text-white/70 mb-6">Faça login para enviar o pedido.</p>
            <SignInForm />
          </div>
        </Unauthenticated>

        <Authenticated>
          <section className="mb-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8">
              <div className="max-w-3xl">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  {adminTab === "posadm"
                    ? "POS — Painel ADM"
                    : formTab === "pos"
                      ? "Solicitação de POS"
                      : "Solicitação de Maquininhas"}
                </h1>
                <p className="mt-3 text-white/70">
                  {adminTab === "posadm"
                    ? "Visualize e gerencie pedidos de compra de terminal POS."
                    : formTab === "pos"
                      ? "Solicitação de compra de terminal POS. Limite de 5 por CNPJ/mês."
                      : "Preencha os dados, escolha o modelo e finalize. O total é calculado em tempo real."}
                </p>
              </div>
            </div>
          </section>

          {/* Menu de abas — admin vê Pedidos / Painel ADM / POS ADM */}
          {isAdmin && (
            <section className="mb-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-2 flex gap-2">
                {(
                  [
                    { key: "pedidos", label: "Pedidos" },
                    { key: "admin", label: "Painel ADM" },
                    { key: "posadm", label: "POS ADM" },
                  ] as { key: AdminTab; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    className={[
                      "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
                      adminTab === key
                        ? "bg-primary text-white"
                        : "bg-black/20 text-white/70 hover:bg-black/30",
                    ].join(" ")}
                    onClick={() => setAdminTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Conteúdo */}
          {isAdmin && adminTab === "admin" ? (
            <AdminPanel />
          ) : isAdmin && adminTab === "posadm" ? (
            <POSAdminPanel />
          ) : (
            <>
              {/* Tabs de formulário: Maquininhas | POS — visíveis para todos */}
              <section className="mb-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2 flex gap-2">
                  {(
                    [
                      { key: "maquininhas", label: "Maquininhas" },
                      { key: "pos", label: "POS" },
                    ] as { key: FormTab; label: string }[]
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      className={[
                        "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
                        formTab === key
                          ? "bg-primary text-white"
                          : "bg-black/20 text-white/70 hover:bg-black/30",
                      ].join(" ")}
                      onClick={() => setFormTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {formTab === "maquininhas" ? (
                <section className="space-y-6">
                  <MaquininhasForm />
                  <OrdersList isAdmin={isAdmin} />
                </section>
              ) : (
                <section className="space-y-6">
                  <POSForm />
                  <POSOrdersList />
                </section>
              )}
            </>
          )}
        </Authenticated>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        Make Your Bank • Formulário interno
      </footer>
    </div>
  );
}
