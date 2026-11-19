import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ServiceWorkerUpdater from "@/components/sync/ServiceWorkerUpdater";
import RegisterSW from "@/components/sync/RegisterSW";
import AgendaReminderNotifier from "@/components/sync/AgendaReminderNotifier";
import { AccessProvider, AuthProvider, LocalFirstProvider } from "@/providers";
import {
  getActiveTenant,
  getTenantCssVariables,
  getTenantPageTitle,
  getTenantSocialMetadata,
} from "@/config/tenant";

async function getMetadataBase(): Promise<URL> {
  const requestHeaders = await headers();
  const rawHost =
    requestHeaders.get("host") ?? requestHeaders.get("x-forwarded-host");
  const host = rawHost?.split(",")[0].trim();
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim()
    .toLowerCase();
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? forwardedProtocol
      : host?.startsWith("localhost")
        ? "http"
        : "https";

  if (host && !/[\\/\s?#@]/.test(host)) {
    const requestOrigin = `${protocol}://${host}`;
    if (URL.canParse(requestOrigin)) return new URL(requestOrigin);
  }

  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  const normalizedUrl = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`;

  if (!URL.canParse(normalizedUrl)) {
    throw new Error("A URL base dos metadados sociais é inválida.");
  }

  return new URL(normalizedUrl);
}

export async function generateMetadata(): Promise<Metadata> {
  const resolution = getActiveTenant();
  const title = getTenantPageTitle(resolution);
  const social = getTenantSocialMetadata(resolution);
  const metadataBase = await getMetadataBase();

  return {
    metadataBase,
    title,
    description: social.description,
    applicationName: social.siteName,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: social.siteName,
      title: social.title,
      description: social.description,
      images: [
        {
          url: social.image,
          width: 1920,
          height: 1080,
          alt: `${social.siteName} — gestão pecuária`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: social.title,
      description: social.description,
      images: [social.image],
    },
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
