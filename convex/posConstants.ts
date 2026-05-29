import { v } from "convex/values";

export const posModelValidator = v.union(
  v.literal("Moderninha Pro 2"),
  v.literal("Moderninha Smart 2"),
  v.literal("Minizinha Chip 3"),
  v.literal("Moderninha Plus 2"),
  v.literal("Minizinha NFC 2"),
  v.literal("Moderninha ProFit"),
  v.literal("Moderninha Wifi Plus 2"),
);

export type PosModel =
  | "Moderninha Pro 2"
  | "Moderninha Smart 2"
  | "Minizinha Chip 3"
  | "Moderninha Plus 2"
  | "Minizinha NFC 2"
  | "Moderninha ProFit"
  | "Moderninha Wifi Plus 2";

// E-mail interno fixo que recebe os pedidos no Monday/Paytime.
// Nunca exposto ao cliente — sempre usado no campo e_mail do payload.
export const INTERNAL_CONTACT_EMAIL = "gerente@makeyourbank.com.br";

export const POS_MODELS: PosModel[] = [
  "Moderninha Pro 2",
  "Moderninha Smart 2",
  "Minizinha Chip 3",
  "Moderninha Plus 2",
  "Minizinha NFC 2",
  "Moderninha ProFit",
  "Moderninha Wifi Plus 2",
];
