"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();

  const otherLocale = locale === "en" ? "ar" : "en";

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Lumina
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href={`/${locale}/courses`}
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            {t("explore")}
          </Link>
          {session && (
            <Link
              href={`/${locale}/dashboard`}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {t("myLearning")}
            </Link>
          )}
          <Link
            href={`/${locale}/instructor`}
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            {t("teach")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link href={`/${otherLocale}`} className="text-xs text-zinc-500 hover:text-zinc-300 px-2">
            {otherLocale.toUpperCase()}
          </Link>
          {session ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/${locale}/dashboard`}>{session.user.name ?? "Account"}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/auth/sign-in`}>{t("signIn")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/auth/sign-up`}>{t("getStarted")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
