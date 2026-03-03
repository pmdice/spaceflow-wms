// src/index.ts
import { z } from "zod";
import * as path from "path";
import * as fs from "fs";
import { config } from "dotenv";
var envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  OPENAI_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
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
  config({ path: envPath });
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
export {
  env
};
