import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env from monorepo root (packages/database -> ../../.env) so DATABASE_URL/DIRECT_URL
// are available to schema.prisma's env() calls. @prisma/config's datasource option doesn't
// support directUrl, so url/directUrl are declared in schema.prisma instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
});
