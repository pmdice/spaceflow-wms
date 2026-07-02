import { z } from "zod";
import * as path from "node:path";
import * as fs from "node:fs";
import { config } from "dotenv";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  OPENAI_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function findRoot(dir: string): string | null {
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) {
    return dir;
  }
  const parent = path.dirname(dir);
  if (parent === dir) {
    return null;
  }
  return findRoot(parent);
}

function loadEnv() {
  // Deployment platforms (Vercel, etc.) inject env vars directly into
  // process.env — there's no .env file or monorepo checkout to find in the
  // deployed serverless bundle, so treat a missing root as "nothing to load".
  const rootDir = findRoot(process.cwd());
  if (rootDir) {
    const envPath = path.resolve(rootDir, ".env");
    console.log(`Loading .env from: ${envPath}`);
    config({ path: envPath });
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2)
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = loadEnv();
