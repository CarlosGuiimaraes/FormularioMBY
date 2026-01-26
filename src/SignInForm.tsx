"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);

  const isSignIn = flow === "signIn";

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);

          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error?.message?.includes("Invalid password")) {
              toastTitle = "Senha inválida. Tente novamente.";
            } else if (error?.message?.includes("User not found")) {
              toastTitle = "Usuário não encontrado. Verifique o e-mail ou faça o cadastro.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Não foi possível efetuar o login. Verifique os dados e tente novamente."
                  : "Não foi possível se cadastrar. Verifique os dados e tente novamente.";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="E-mail"
          required
          autoComplete="email"
        />

        <div className="flex flex-col gap-2">
          <input
            className="auth-input-field"
            type="password"
            name="password"
            placeholder="Senha"
            required
            autoComplete={isSignIn ? "current-password" : "new-password"}
          />

          {isSignIn && (
            <button
              type="button"
              className="text-left text-sm text-white/70 hover:text-white hover:underline"
              onClick={() => setShowResetHelp(true)}
            >
              Esqueceu sua senha?
            </button>
          )}
        </div>

        <button className="auth-button" type="submit" disabled={submitting}>
          {isSignIn ? "Entrar" : "Cadastrar"}
        </button>

        <div className="text-center text-sm text-secondary">
          <span>{isSignIn ? "Não tem uma conta? " : "Já tem uma conta? "}</span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(isSignIn ? "signUp" : "signIn")}
          >
            {isSignIn ? "Cadastre-se" : "Fazer login"}
          </button>
        </div>
      </form>

      {/* Modal simples de orientação */}
      {showResetHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowResetHelp(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c10] p-5 shadow-lg">
            <div className="text-lg font-semibold">Redefinição de senha</div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Por segurança, senhas não podem ser visualizadas no portal. No momento,
              a redefinição é feita pelo administrador/suporte.
            </p>

            <div className="mt-3 text-sm text-white/70">
              Procedimento:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Envie uma solicitação ao administrador informando o e-mail da conta.</li>
                <li>O administrador providenciará a redefinição e te enviará uma senha provisória.</li>
              </ul>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                onClick={() => setShowResetHelp(false)}
              >
                Fechar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-sm font-semibold"
                onClick={() => {
                  toast.info("Solicite a redefinição ao administrador informando seu e-mail.");
                  setShowResetHelp(false);
                }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
