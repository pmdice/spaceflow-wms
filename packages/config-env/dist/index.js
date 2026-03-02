"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  env: () => env
});
module.exports = __toCommonJS(index_exports);
var import_zod = require("zod");
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var import_dotenv = require("dotenv");
var envSchema = import_zod.z.object({
  DATABASE_URL: import_zod.z.string().url(),
  BETTER_AUTH_SECRET: import_zod.z.string().min(32),
  BETTER_AUTH_URL: import_zod.z.string().url().default("http://localhost:3000"),
  OPENAI_API_KEY: import_zod.z.string().min(1),
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development")
});
function findRoot(dir) {
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) {
    return dir;
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    throw new Error("Could not find project root (pnpm-lock.yaml)");
  }
  return findRoot(parent);
}
function loadEnv() {
  const rootDir = findRoot(process.cwd());
  const envPath = path.resolve(rootDir, ".env");
  console.log(`Loading .env from: ${envPath}`);
  (0, import_dotenv.config)({ path: envPath });
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "\u274C Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2)
    );
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}
var env = loadEnv();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  env
});
