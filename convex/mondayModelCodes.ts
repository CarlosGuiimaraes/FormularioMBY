import type { PosModel } from "./posConstants";

/**
 * Mapa de modelo → código de campo Monday (status_1__1).
 * TODO: preencher cada código após mapeamento com a Paytime.
 * Se o código for undefined, o envio ao Monday será bloqueado para esse modelo.
 */
export const MONDAY_MODEL_CODES: Record<PosModel, string> = {
  "Moderninha Pro 2":       "0",
  "Moderninha Smart 2":     "1",
  "Minizinha Chip 3":       "2",
  "Moderninha Plus 2":      "3",
  "Minizinha NFC 2":        "4",
  "Moderninha ProFit":      "6",
  "Moderninha Wifi Plus 2": "7",
} as const;

export const MONDAY_ENDPOINT =
  "https://forms.monday.com/workforms/external/forms/660d43e4d527f4546a0f80557dfa5eb6/submissions?r=use1";
