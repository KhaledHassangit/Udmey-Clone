"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email to verify your account");
    router.push(`/${locale}/auth/sign-in`);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-xl">
        <h1 className="font-display text-3xl font-bold text-white">{t("signUp")}</h1>
        <form onSubmit={handleSignUp} className="mt-8 space-y-4">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Button type="submit" className="w-full" disabled={loading}>
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Have an account?{" "}
          <Link href={`/${locale}/auth/sign-in`} className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
