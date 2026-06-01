import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignInForm } from "./SignInForm";
import { POSForm } from "./POSForm";
import { POSOrdersList } from "./POSOrdersList";
import { POSAdminPanel } from "./POSAdminPanel";

type AdminTab = "painel" | "novo";

export default function App() {
  const authInfo = useQuery(api.auth.authInfo);
  const loggedInUser = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();
  const [adminTab, setAdminTab] = useState<AdminTab>("painel");

  const isAdmin = !!authInfo?.isAdmin;

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#222222]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-[960px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <div className="h-2 w-2 rounded-full bg-accent" />
            </div>
            <div className="min-w-0">
              <div className="font-bold tracking-tight text-[#222222] truncate">Make Your Bank</div>
              <div className="text-xs text-[#5D5E60] truncate">
                {loggedInUser?.email ?? authInfo?.email ?? ""}
              </div>
            </div>
            {isAdmin && (
              <span className="ml-1 hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-semibold tracking-wide">
                ADM
              </span>
            )}
          </div>

          <Authenticated>
            <button
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm text-[#5D5E60] font-medium transition"
              onClick={() => void signOut()}
            >
              Sair
            </button>
          </Authenticated>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] px-4 py-8">
        <Unauthenticated>
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-1 rounded-full bg-primary" />
              <h1 className="text-xl font-bold text-[#222222]">Acesso ao Portal</h1>
            </div>
            <p className="text-[#5D5E60] mb-6 text-sm">Faça login para acessar o sistema de pedidos POS.</p>
            <SignInForm />
          </div>
        </Unauthenticated>

        <Authenticated>
          {isAdmin ? (
            <>
              <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-card p-1.5 flex gap-1.5">
                {(
                  [
                    { key: "painel", label: "POS ADM" },
                    { key: "novo",   label: "Novo Pedido" },
                  ] as { key: AdminTab; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    className={[
                      "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
                      adminTab === key
                        ? "bg-primary text-white shadow-sm"
                        : "text-[#5D5E60] hover:bg-gray-100",
                    ].join(" ")}
                    onClick={() => setAdminTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {adminTab === "painel" ? (
                <POSAdminPanel />
              ) : (
                <section className="space-y-5">
                  <POSForm />
                  <POSOrdersList />
                </section>
              )}
            </>
          ) : (
            <section className="space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-card px-8 py-7">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-1 rounded-full bg-primary flex-shrink-0" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
                    Solicitação de POS
                  </h1>
                </div>
                <p className="text-[#5D5E60] text-sm ml-4 pl-3">
                  Solicitação de compra de terminal POS. Limite de 5 por CNPJ/mês.
                </p>
              </div>
              <POSForm />
              <POSOrdersList />
            </section>
          )}
        </Authenticated>
      </main>

      <footer className="border-t border-gray-200 bg-white py-5 text-center text-xs text-[#5D5E60]">
        Make Your Bank &copy; {new Date().getFullYear()} — Sistema interno
      </footer>
    </div>
  );
}
