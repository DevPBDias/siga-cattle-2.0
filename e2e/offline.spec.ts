import { expect, test } from "@playwright/test";

test("serves online-visited routes and precached public images offline", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("sw-update-dismissed", "true");
  });
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  const imagePaths = [
    "/icon-192.png",
    "/icon-512.png",
    "/apple-touch-icon.png",
    "/favicon.ico",
    "/logo_siga_cattle.png",
    "/logo_hor_siga_cattle.png",
    "/logo.svg",
    "/Background_Siga.png",
    "/branding/agro3mil/logo.png",
    "/branding/agro3mil/logo-report.png",
    "/branding/agro3mil/logo-icon.png",
    "/branding/agro3mil/logo-hor-indiouro.png",
    "/branding/agro3mil/Loading Screen Mobile.png",
    "/branding/agro3mil/Loading Screen Desktop.jpg",
    "/branding/haras-luma/logo_haras_luma.png",
    "/branding/haras-luma/logo-report.png",
    "/branding/haras-luma/Loading Screen Mobile.png",
    "/branding/haras-luma/Loading Screen Desktop.jpg",
  ];

  const cachedAssets = await page.evaluate(async (images) => {
    const cache = await caches.open("rico-ouro-cache-v38");
    const paths = [
      "/geral/evolucao",
      "/mover-rebanho",
      ...images,
    ];
    const matches = await Promise.all(paths.map((path) => cache.match(path)));
    const staticAssets: string[] = await (
      await fetch("/sw-static-assets.json")
    ).json();
    const cachedStaticAssets = await Promise.all(
      staticAssets.map((path) => cache.match(path)),
    );
    return {
      matches: matches.map(Boolean),
      staticAssetCount: staticAssets.length,
      allStaticAssetsCached: cachedStaticAssets.every(Boolean),
    };
  }, imagePaths);

  expect(cachedAssets.matches.every(Boolean)).toBe(true);
  expect(cachedAssets.staticAssetCount).toBeGreaterThan(0);
  expect(cachedAssets.allStaticAssetsCached).toBe(true);

  for (const route of ["/geral/evolucao", "/mover-rebanho"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
  }

  await page.evaluate(() => {
    const now = Date.now();
    const userId = "offline-e2e-user";
    const expiresAt = now + 60_000;

    localStorage.setItem(
      "rico_ouro_auth_cache",
      JSON.stringify({
        user: {
          id: userId,
          email: "offline-e2e@example.test",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date(now).toISOString(),
        },
        cachedAt: now,
        expiresAt,
      }),
    );
    localStorage.setItem(
      "rico_ouro_permissions_cache",
      JSON.stringify({
        userId,
        role: "owner",
        permissions: {},
        cachedAt: now,
        expiresAt,
      }),
    );
  });

  await context.setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);

  for (const route of ["/geral/evolucao", "/mover-rebanho"]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    expect(response?.fromServiceWorker()).toBe(true);
    if (route === "/geral/evolucao") {
      await expect(page.getByRole("combobox", { name: "Categoria" })).toBeVisible();
    } else {
      await expect(page.getByText("Mover Rebanho", { exact: true })).toBeVisible();
    }
  }

  const imageStatuses = await page.evaluate(async (images) => {
    const responses = await Promise.all(images.map((path) => fetch(path)));
    return responses.map((response) => response.status);
  }, imagePaths);
  expect(imageStatuses.every((status) => status === 200)).toBe(true);
});
