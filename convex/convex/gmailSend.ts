"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { google } from "googleapis";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function toBase64Url(str: string) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export const sendResetCodeEmail = action({
  args: {
    to: v.string(),
    code: v.string(),
  },
  handler: async (_ctx, { to, code }) => {
    const clientId = getEnv("GMAIL_CLIENT_ID");
    const clientSecret = getEnv("GMAIL_CLIENT_SECRET");
    const refreshToken = getEnv("GMAIL_REFRESH_TOKEN");
    const sender = getEnv("GMAIL_SENDER_EMAIL");

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const subject = "Redefinição de senha — Make Your Bank";
    const text =
      "Recebemos uma solicitação para redefinir sua senha.\n\n" +
      `Código de verificação: ${code}\n\n` +
      "Se você não solicitou, ignore este e-mail.";

    const rawMessage = [
      `From: "MKY" <${sender}>`,
      `To: <${to}>`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      `Subject: ${subject}`,
      "",
      text,
    ].join("\r\n");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: toBase64Url(rawMessage) },
    });

    return { ok: true };
  },
});
