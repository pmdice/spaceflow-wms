import { betterAuth } from "better-auth";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import { db, Role } from "@spaceflow/database";
import { env } from "@spaceflow/config-env";

// `satisfies BetterAuthOptions`, not `: BetterAuthOptions` — an explicit return-type
// annotation widens the returned object to the interface's shape, which erases the literal
// types (e.g. additionalFields.role.type: "string") and the specific plugins-array structure
// that betterAuth()'s own generic inference needs downstream (auth.api.getSession()'s
// session.user.role). `satisfies` validates the object against BetterAuthOptions (so a typo
// here would still be caught) while preserving its own precise inferred type. Confirmed by a
// real `next build` TypeScript failure in apps/web/middleware.ts ("Property 'role' does not
// exist ...") when this was a plain `: BetterAuthOptions` annotation instead.
// Vercel assigns every deployment (including each preview) its own unique
// subdomain and injects it as VERCEL_URL. A fixed baseURL/BETTER_AUTH_URL
// can't match that, so BetterAuth's origin check rejects auth requests with
// a 403 on any deployment other than the one BETTER_AUTH_URL happens to
// point at. Trust the deployment's own origin in addition to the configured
// one so previews keep working without per-deployment config.
const vercelDeploymentUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

export function createAuthOptions(extraPlugins: BetterAuthPlugin[] = []) {
  return {
    database: prismaAdapter(db, {
      provider: "postgresql",
    }),
    baseURL: vercelDeploymentUrl ?? env.BETTER_AUTH_URL,
    trustedOrigins: vercelDeploymentUrl
      ? [env.BETTER_AUTH_URL, vercelDeploymentUrl]
      : [env.BETTER_AUTH_URL],
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
  } satisfies BetterAuthOptions;
}

export const auth = betterAuth(createAuthOptions());
export type SpaceflowAuth = typeof auth;
