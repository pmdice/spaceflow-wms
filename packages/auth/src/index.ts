import { betterAuth } from "better-auth";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import { db, Role } from "@spaceflow/database";
import { env } from "@spaceflow/config-env";

export function createAuthOptions(extraPlugins: BetterAuthPlugin[] = []): BetterAuthOptions {
  return {
    database: prismaAdapter(db, {
      provider: "postgresql",
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
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
    plugins: [
      customSession(async (ctx) => {
        const { user, session } = ctx;
        return {
          user: {
            ...user,
            role: (user as { role?: string }).role ?? Role.PICKER,
          },
          session,
        };
      }),
      ...extraPlugins,
    ],
  };
}

export const auth = betterAuth(createAuthOptions());
export type SpaceflowAuth = typeof auth;
