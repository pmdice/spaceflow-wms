import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createAuthOptions } from "@spaceflow/auth";

export const auth = betterAuth(createAuthOptions([nextCookies()]));
