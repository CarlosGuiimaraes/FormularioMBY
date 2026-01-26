"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

type Flow = "signIn" | "signUp";

export function SignInForm() {
  const { signIn } = useAuthActions();

  const [flow, setFlow] = useState<Flow>("signIn");
  const [submitting, setSubmitting] = useState(false);

  // Reset de senha (duas etapas)
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  const isSignIn = flow === "signIn";

  async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);
    } catch (error: any) {
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
    } finally {
      setSubmitting(false);
    }
  }

  async function requestPasswordReset() {
    if (!resetEmail.trim()) {
      toast.error("Informe o e-mail da conta.");
      return;
    }

    try {
      const formData = new FormData();
      formData.set("email", resetEmail.trim());
      formData.set("flow", "reset");
      await signIn("password", formData);
      toast.success("Código enviado. Verifique seu e-mail.");
      setResetStep("verify");
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível enviar o código.");
    }
  }

  async function verifyPasswordReset() {
    if (!resetEmail.trim()) {
      toast.error("Informe o e-mail.");
      return;
    }
    if (!resetCode.trim()) {
      toast.error("Informe o código.");
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 8) {
      toast.error("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }

    try {
      const formData = new FormData();
      formData.set("email", resetEmail.trim());
      formData.set("code", resetCode.trim());
      formData.set("newPassword", resetNewPassword);
      formData.set("flow", "reset-verification");
      await signIn("password", formData);

      toast.success("Senha redefinida. Faça login com a nova senha.");
      setResetOpen(false);
      setResetStep("request");
      setResetCode("");
      setResetNewPassword("");
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível redefinir a senha.");
    }
  }

  function closeReset() {
    setResetOpen(false);
    setResetStep("request");
    setResetCode("");
    setResetNewPassword("");
  }

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleAuthSubmit}>
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
              onClick={() => {
                setResetEmail("");
                setResetCode("");
                setResetNewPassword("");
                setResetStep("request");
                setResetOpen(true);
              }}
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

      {/* Modal: reset de senha por código */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeReset} />

          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c10] p-5 shadow-lg">
            <div className="text-lg font-semibold">Redefinir senha</div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Enviaremos um código para o seu e-mail. Em seguida, informe o código e defina uma nova senha.
            </p>

            <div className="mt-4 space-y-3">
              <input
                className="auth-input-field"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Seu e-mail"
                autoComplete="email"
              />

              {resetStep === "verify" && (
                <>
                  <input
                    className="auth-input-field"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Código (6 dígitos)"
                    inputMode="numeric"
                  />
                  <input
                    className="auth-input-field"
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Nova senha (mín. 8 caracteres)"
                    autoComplete="new-password"
                  />
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                onClick={closeReset}
                type="button"
              >
                Cancelar
              </button>

              {resetStep === "request" ? (
                <button
                  className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-sm font-semibold"
                  onClick={requestPasswordReset}
                  type="button"
                >
                  Enviar código
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                    onClick={() => setResetStep("request")}
                    type="button"
                  >
                    Voltar
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-sm font-semibold"
                    onClick={verifyPasswordReset}
                    type="button"
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
