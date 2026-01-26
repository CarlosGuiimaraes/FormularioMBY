import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Provedor Resend para reset de senha (Convex Auth / Password).
 * Envia código numérico por e-mail.
 *
 * Requer no Convex:
 * - AUTH_RESEND_KEY
 * - AUTH_EMAIL_FROM
 */
export const ResendOTPPasswordReset = Resend({
  id: "resend-otp-reset",
  apiKey: process.env.AUTH_RESEND_KEY,

  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };

    // Código simples de 6 dígitos
    return generateRandomString(random, "0123456789", 6);
  },

  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const from = process.env.AUTH_EMAIL_FROM ?? "MKY <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Redefinição de senha — Make Your Bank",
      text:
        "Recebemos uma solicitação para redefinir sua senha.\n\n" +
        `Código de verificação: ${token}\n\n` +
        "Se você não solicitou, ignore este e-mail.",
    });

    if (error) {
      throw new Error("Falha ao enviar o e-mail de redefinição.");
    }
  },
});
