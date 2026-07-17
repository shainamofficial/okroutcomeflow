import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client";
import { resetPasswordEmail, sendEmail } from "../lib/email";
import * as authSchema from "./schema";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google is only registered when credentials are present, so the module
// imports cleanly in dev/CI without them. Set both env vars to enable it.
const socialProviders =
  googleClientId && googleClientSecret
    ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
    : {};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8787",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:8080")
    .split(",")
    .map((o) => o.trim()),
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  // Generate UUID ids so a future migration can import existing users with
  // their current Supabase auth uuid as the Better Auth id, preserving every
  // FK (users_profile / user_roles / organization_memberships all key on it).
  advanced: {
    database: { generateId: () => randomUUID() },
  },
  emailAndPassword: {
    enabled: true,
    // No verification email wired yet; the existing Supabase-era flow used
    // confirm-email off in dev. Provisioning of profile/org/role happens in
    // the database trigger on the user table (see the better-auth migration).
    requireEmailVerification: false,
    // Sends via Resend when RESEND_API_KEY is set; otherwise sendEmail logs
    // the link to the console (dev/CI fallback). See lib/email.ts.
    sendResetPassword: async ({ url, user }) => {
      const { subject, html, text } = resetPasswordEmail(url, user.name);
      await sendEmail({ to: user.email, subject, html, text });
    },
  },
  socialProviders,
});

export type Auth = typeof auth;
