import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

function base64UrlEncode(str: string) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa existe no runtime do Convex (web-like). Se falhar, te passo fallback.
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getAccessToken() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail OTP: variáveis ausentes. Defina GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET e GMAIL_REFRESH_TOKEN no Convex."
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || !json.access_token) {
    throw new Error(
      `Gmail OTP: falha ao obter access_token (${res.status}). ${JSON.stringify(json).slice(0, 300)}`
    );
  }

  return json.access_token as string;
}

export const GmailOTPPasswordReset = {
  id: "gmail-otp-reset",
  type: "email" as const,
  name: "Gmail OTP Reset",

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
    provider?: unknown;
  }) {
    const sender = process.env.GMAIL_SENDER_EMAIL;
    if (!sender) {
      throw new Error(
        "Gmail OTP: variável ausente. Defina GMAIL_SENDER_EMAIL no Convex."
      );
    }

    const accessToken = await getAccessToken();

    const subject = "Redefinição de senha — Make Your Bank";
    const text =
      "Recebemos uma solicitação para redefinir sua senha.\n\n" +
      `Código de verificação: ${token}\n\n` +
      "Se você não solicitou, ignore este e-mail.";

    const rawMessage = [
      `From: "MKY" <${sender}>`,
      `To: <${email}>`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      `Subject: ${subject}`,
      "",
      text,
    ].join("\r\n");

    const raw = base64UrlEncode(rawMessage);

    const sendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!sendRes.ok) {
      const errText = await sendRes.text().catch(() => "");
      throw new Error(
        `Gmail OTP: falha ao enviar e-mail (${sendRes.status}). ${errText.slice(0, 400)}`
      );
    }
  },
};
