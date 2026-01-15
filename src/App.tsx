import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { MaquininhasForm } from "./MaquininhasForm";
import { OrdersList } from "./OrdersList";
import { AdminPanel } from "./AdminPanel";

export default function App() {
  const authInfo = useQuery(api.auth.authInfo);
  const loggedInUser = useQuery(api.users.getMe);

  const isAdmin = !!authInfo?.isAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-primary">Pedido de Maquininhas</h2>

            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2 ml-4">
                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  ADM
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Authenticated>
              <button
                className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                onClick={() => authInfo?.signOut?.()}
              >
                Sign out
              </button>
            </Authenticated>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <Unauthenticated>
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido de Maquininhas</h1>
            <p className="text-gray-600 mb-6">
              Faça login para acessar o formulário.
            </p>
            <SignInForm />
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-3">Pedido de Maquininhas</h1>
            <p className="text-lg text-gray-600">
              Bem-vindo, {loggedInUser?.email ?? authInfo?.email ?? "usuário"}!
            </p>
          </div>

          {isAdmin && (
            <div className="mb-8">
              <AdminPanel />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <MaquininhasForm />
            <OrdersList isAdmin={isAdmin} />
          </div>
        </Authenticated>
      </main>
    </div>
  );
}
