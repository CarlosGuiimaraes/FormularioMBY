import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Provedor de e-mail (Resend) para o fluxo de reset de senha do Convex Auth (Password provider).
 *
 * Variáveis de ambiente (Convex):
 * - AUTH_RESEND_KEY: API key do Resend
 * - AUTH_EMAIL_FROM: remetente (ex.: "MKY <onboarding@resend.dev>" ou seu domínio verificado)
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

    // Código numérico curto para facilitar digitação.
    const alphabet = "0123456789";
    const length = 6;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const from = process.env.AUTH_EMAIL_FROM ?? "MKY <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Redefinição de senha — MKY",
      text:
        "Recebemos uma solicitação de redefinição de senha.\n\n" +
        "Seu código é: " +
        token +
        "\n\n" +
        "Se você não solicitou, ignore este e-mail.",
    });

    if (error) {
      throw new Error("Não foi possível enviar o e-mail de redefinição.");
    }
  },
});
