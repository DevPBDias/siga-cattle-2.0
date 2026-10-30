import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ServiceWorkerUpdater from "@/components/sync/ServiceWorkerUpdater";
import RegisterSW from "@/components/sync/RegisterSW";
import AgendaReminderNotifier from "@/components/sync/AgendaReminderNotifier";
import { AccessProvider, AuthProvider, LocalFirstProvider } from "@/providers";
import { getActiveTenant, getTenantCssVariables, getTenantPageTitle } from "@/config/tenant";

export function generateMetadata(): Metadata {
  const resolution = getActiveTenant();
  const title = getTenantPageTitle(resolution);

  return {
    title,
    description:
      "Gerencie o rebanho, pesos e vacinas da fazenda — mesmo offline.",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title,
    },
    icons: {
      icon: [
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
        { url: "/favicon.ico", sizes: "48x48" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

export function generateViewport(): Viewport {
  const resolution = getActiveTenant();
  return {
    themeColor: resolution.tenant?.primaryColor || "#1e3b2b",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resolution = getActiveTenant();
  const cssVariables = getTenantCssVariables(resolution.tenant);

  return (
    <html lang="pt-BR" suppressHydrationWarning style={cssVariables as React.CSSProperties}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content={getTenantPageTitle(resolution)} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />

        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LocalFirstProvider>
            <AccessProvider>
              <RegisterSW />
              <AgendaReminderNotifier />
              {children}
              <ServiceWorkerUpdater />
            </AccessProvider>
          </LocalFirstProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
