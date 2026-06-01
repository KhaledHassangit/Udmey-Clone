import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Syne, DM_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import "../globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "ar")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} min-h-screen bg-[#0a0a0f] font-sans text-zinc-100 antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
