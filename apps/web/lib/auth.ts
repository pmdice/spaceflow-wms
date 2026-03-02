import { db, Role } from "@spaceflow/database";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret) {
  throw new Error("Missing BETTER_AUTH_SECRET environment variable.");
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: authSecret,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Prevent clients from assigning privileged roles during sign-up.
      role: {
        type: "string",
        required: false,
        defaultValue: Role.PICKER,
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
