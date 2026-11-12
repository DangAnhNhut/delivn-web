import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "@/server/db";
import * as schema from "@/server/db/schema";

import { resolveAuthEnvironment } from "./auth-environment";
import { createAuthOptions } from "./auth-options";

const environment = resolveAuthEnvironment(process.env);

export const auth = betterAuth({
  ...createAuthOptions(environment),
  database: drizzleAdapter(getDb(), { provider: "pg", schema }),
});

export type AuthSession = typeof auth.$Infer.Session;
