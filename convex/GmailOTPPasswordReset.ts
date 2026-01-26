import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { api } from "./_generated/api";
import { ConvexHttpClient } from "convex/browser";

export const GmailOTPPasswordReset = {
  id: "gmail-otp-reset",

  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 6);
  },

  async sendVerificationRequest({
    identifier: email,
    token,
  }: {
    identifier: string;
    token: string;
  }) {
    // Este provider não deve importar "googleapis" diretamente.
    // Em vez disso, chamamos uma Action Node ("use node") que faz o envio via Gmail API.
    const deploymentUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!deploymentUrl) {
      throw new Error(
        "Gmail OTP: CONVEX_URL (ou NEXT_PUBLIC_CONVEX_URL) não definida. Necessário para chamar a action gmailSend."
      );
    }

    const client = new ConvexHttpClient(deploymentUrl);

    await client.action(api.gmailSend.sendResetCodeEmail, {
      to: email,
      code: token,
    });
  },
};
