"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SignInPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(`/${locale}/dashboard`);
  }

  async function handleOtp() {
    setLoading(true);
    if (!otpSent) {
      await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      setOtpSent(true);
      toast.success("Code sent to your email");
    } else {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) toast.error(error.message);
      else router.push(`/${locale}/dashboard`);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
        <h1 className="font-display text-3xl font-bold text-white">{t("signIn")}</h1>
        <p className="mt-2 text-sm text-zinc-500">Lumina Learn</p>

        <form onSubmit={handleEmailSignIn} className="mt-8 space-y-4">
          <div>
            <label className="text-xs text-zinc-500">{t("email")}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">{t("password")}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Sign in with password
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-zinc-600">{t("orContinue")}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: `/${locale}/dashboard` })}
          >
            {t("google")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => authClient.signIn.social({ provider: "github", callbackURL: `/${locale}/dashboard` })}
          >
            {t("github")}
          </Button>
        </div>

        <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
          <p className="text-xs text-zinc-500">{t("otp")}</p>
          {otpSent && (
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" />
          )}
          <Button variant="outline" className="w-full" onClick={handleOtp} disabled={loading || !email}>
            {otpSent ? t("verifyOtp") : t("sendOtp")}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href={`/${locale}/auth/sign-up`} className="text-violet-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
