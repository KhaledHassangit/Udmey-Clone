import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Lumina Learn — Premium Online Courses",
  description: "Cinema-quality streaming. Learn without limits.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
