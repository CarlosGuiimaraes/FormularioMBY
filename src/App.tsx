import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MaquininhasForm } from "./MaquininhasForm";
import { OrdersList } from "./OrdersList";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Solicitação de Maquininhas</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Sistema de Maquininhas</h1>
        <Authenticated>
          <p className="text-xl text-secondary">
            Bem-vindo, {loggedInUser?.email ?? "usuário"}!
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-secondary">Faça login para continuar</p>
        </Unauthenticated>
      </div>

      <Authenticated>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Nova Solicitação</h2>
            <MaquininhasForm />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pedidos Recentes</h2>
            <OrdersList />
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </div>
  );
}
