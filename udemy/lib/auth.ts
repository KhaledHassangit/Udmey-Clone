import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/lib/db";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    process.env.ADMIN_DASHBOARD_URL ?? "http://localhost:5173",
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(process.env.GITHUB_CLIENT_ID && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    }),
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false,
      },
      locale: {
        type: "string",
        defaultValue: "en",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (!resend) {
          console.warn("[auth] RESEND_API_KEY missing — OTP:", otp, "for", email, type);
          return;
        }
        const subjects: Record<string, string> = {
          "sign-in": "Your Lumina sign-in code",
          "email-verification": "Verify your Lumina email",
          "forget-password": "Reset your Lumina password",
        };
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "Lumina <onboarding@resend.dev>",
          to: email,
          subject: subjects[type] ?? "Your verification code",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
              <h1 style="color: #6366f1;">Lumina Learn</h1>
              <p>Your verification code:</p>
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</p>
              <p style="color: #666; font-size: 14px;">Expires in 10 minutes. Never share this code.</p>
            </div>
          `,
        });
      },
      otpLength: 6,
      expiresIn: 600,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
