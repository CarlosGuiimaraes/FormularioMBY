import { useMemo, useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MaquininhasForm } from "./MaquininhasForm";
import { OrdersList } from "./OrdersList";
import { AdminPanel } from "./AdminPanel";

type View = "solicitacao" | "admin";

export default function App() {
  const authInfo = useQuery(api.auth.authInfo);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const [view, setView] = useState<View>("solicitacao");

  const isAdmin = useMemo(() => {
    return !!authInfo?.isAuthenticated && !!authInfo?.isAdmin;
  }, [authInfo]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster />
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-primary">Solicitação de Maquininhas</h2>

          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2 ml-4">
              <button
                className={`px-3 py-1 rounded text-sm border ${
                  view === "solicitacao"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
                onClick={() => setView("solicitacao")}
              >
                Solicitação
              </button>
              <button
                className={`px-3 py-1 rounded text-sm border ${
                  view === "admin"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
                onClick={() => setView("admin")}
              >
                Painel ADM
              </button>
            </div>
          )}
        </div>

        <SignOutButton />
      </header>

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-3">Sistema de Maquininhas</h1>
            <Authenticated>
              <p className="text-lg text-gray-600">
                Bem-vindo, {loggedInUser?.email ?? authInfo?.email ?? "usuário"}!
              </p>
            </Authenticated>
            <Unauthenticated>
              <p className="text-lg text-gray-600">Faça login para continuar.</p>
            </Unauthenticated>
          </div>

          <Authenticated>
            {isAdmin && (
              <div className="sm:hidden flex items-center justify-center gap-2 mb-6">
                <button
                  className={`px-3 py-1 rounded text-sm border ${
                    view === "solicitacao"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                  onClick={() => setView("solicitacao")}
                >
                  Solicitação
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm border ${
                    view === "admin"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                  onClick={() => setView("admin")}
                >
                  Painel ADM
                </button>
              </div>
            )}

            {view === "admin" && isAdmin ? (
              <AdminPanel />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Dados do Cliente</h2>
                  <MaquininhasForm />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Pedidos Recentes</h2>
                  <OrdersList />
                </div>
              </div>
            )}
          </Authenticated>

          <Unauthenticated>
            <div className="max-w-md mx-auto">
              <SignInForm />
            </div>
          </Unauthenticated>
        </div>
      </main>
    </div>
  );
}
