import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignInForm } from "./SignInForm";
import { MaquininhasForm } from "./MaquininhasForm";
import { OrdersList } from "./OrdersList";
import { AdminPanel } from "./AdminPanel";

export default function App() {
  const authInfo = useQuery(api.auth.authInfo);
  const loggedInUser = useQuery(api.users.getMe);
  const { signOut } = useAuthActions();

  const isAdmin = !!authInfo?.isAdmin;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
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

      <main className="mx-auto max-w-7xl px-4 py-10">
        <Unauthenticated>
          <div className="max-w-md mx-auto bg-white/5 p-6 rounded-2xl border border-white/10">
            <h1 className="text-2xl font-semibold mb-2">Acesso</h1>
            <p className="text-white/70 mb-6">Faça login para enviar o pedido.</p>
            <SignInForm />
          </div>
        </Unauthenticated>

        <Authenticated>
          {/* Hero */}
          <section className="mb-8">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8">
              <div className="max-w-3xl">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Solicitação de Maquininhas
                </h1>
                <p className="mt-3 text-white/70">
                  Preencha os dados, escolha o modelo e finalize. O total (à vista ou parcelado) é calculado em tempo real.
                </p>
              </div>
            </div>
          </section>

          {isAdmin && (
            <section className="mb-8">
              <AdminPanel />
            </section>
          )}

          {/* Landing layout: form + sidebar */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <MaquininhasForm />
            </div>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-20">
                <OrdersList isAdmin={isAdmin} />
              </div>
            </div>
          </section>
        </Authenticated>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        Make Your Bank • Formulário interno
      </footer>
    </div>
  );
}
