"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  LogisticsFilterSchema: () => LogisticsFilterSchema,
  LogisticsIntentSchema: () => LogisticsIntentSchema,
  PalletActionSchema: () => PalletActionSchema
});
module.exports = __toCommonJS(index_exports);
var import_zod = require("zod");
var LogisticsFilterSchema = import_zod.z.object({
  palletId: import_zod.z.string().nullable().describe("Die konkrete Paletten-ID (z.B. 'PAL-00001') bei direkter Suche. Null, wenn nicht erw\xE4hnt."),
  destination: import_zod.z.string().nullable().describe("Die exakte Zielstadt (z.B. 'Z\xFCrich', 'Bern'). Null, wenn nicht erw\xE4hnt."),
  status: import_zod.z.enum(["all", "stored", "transit", "delayed"]).describe("Der Status der Fracht. 'all', wenn nicht spezifisch gefragt."),
  urgencyLevel: import_zod.z.enum(["all", "low", "medium", "high"]).describe("Dringlichkeitsstufe. 'all', wenn nicht erw\xE4hnt."),
  weightMinKg: import_zod.z.number().nullable().describe("Minimales Gewicht in kg. Beispiel: '\xFCber 300kg' => 300. Null, wenn nicht erw\xE4hnt."),
  weightMaxKg: import_zod.z.number().nullable().describe("Maximales Gewicht in kg. Beispiel: 'unter 300kg' => 300. Null, wenn nicht erw\xE4hnt."),
  highlightColor: import_zod.z.string().nullable().describe("Ein Hex-Farbcode (z.B. '#ff0000' f\xFCr rot), wenn der User eine farbliche Markierung w\xFCnscht.")
});
var PalletActionSchema = import_zod.z.enum([
  "receive",
  "putaway",
  "scan",
  "relocate",
  "pick",
  "load",
  "delay",
  "set_status",
  "set_destination"
]);
var LogisticsIntentSchema = import_zod.z.object({
  intentType: import_zod.z.enum(["filter", "action"]),
  filter: LogisticsFilterSchema,
  action: PalletActionSchema.nullable(),
  maxTargets: import_zod.z.number().int().min(1).max(50).default(10),
  targetPalletId: import_zod.z.string().nullable().default(null),
  targetZone: import_zod.z.enum(["A", "B", "C"]).nullable().default(null),
  targetStatus: import_zod.z.enum(["stored", "transit", "delayed"]).nullable().default(null),
  targetDestination: import_zod.z.string().nullable().default(null)
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LogisticsFilterSchema,
  LogisticsIntentSchema,
  PalletActionSchema
});
