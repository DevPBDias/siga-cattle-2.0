/// <reference lib="webworker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

// ============================================================================
// CONFIGURATION - Version and Cache Names
// ============================================================================
// v33: Use the SIGA Cattle splash screen in the app shell.
const SCHEMA_VERSION = "v34";
const CACHE_NAME = `rico-ouro-cache-${SCHEMA_VERSION}`;
const API_CACHE_NAME = `rico-ouro-api-${SCHEMA_VERSION}`;

// ============================================================================
// APP SHELL - Essential assets that MUST be available offline
// ============================================================================
const APP_SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/splash-siga-cattle.png",
  "/login",
  "/home",
  "/cadastro",
  "/consulta",
  "/reproducao",
  "/reproducao/lote",
  "/vacinas",
  "/nascimentos",
  "/mortes",
  "/calendario",
  "/pesagem-ce",
  "/comercial",
  "/movimentacoes",
  "/movimentacoes/criar",
  "/perfil",
  "/gerenciar",
  "/gerenciar/clientes",
  "/gerenciar/clientes/novo",
  "/gerenciar/doses-semen",
  "/geral",
  "/geral/planilhas",
  "/geral/relatorios",
  "/geral/relatorios/pdf",
  "/geral/relatorios/planilhas",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function cacheResponse(
  cacheName: string,
  request: Request,
  response: Response,
): Promise<void> {
  try {
    if (
      response &&
      response.status === 200 &&
      (response.type === "basic" || response.type === "cors")
    ) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
  } catch (error) {
    console.warn("Service Worker: Failed to cache response", error);
  }
}

async function cacheUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  for (const url of urls) {
    try {
      const cached = await cache.match(url);
      if (!cached) {
        const response = await fetch(url);
        if (response && response.status === 200) {
          await cache.put(url, response);
        }
      }
    } catch (error) {
      console.warn(`Service Worker: Failed to proactively cache ${url}`, error);
    }
  }
}

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

self.addEventListener("install", (event: ExtendableEvent) => {
  console.log(`Service Worker: Installing ${SCHEMA_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachePromises = APP_SHELL_ASSETS.map(async (url) => {
        try {
          await cache.add(url);
        } catch (error) {
          // Missing assets shouldn't block installation
        }
      });
      await Promise.all(cachePromises);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (
            !key.includes(SCHEMA_VERSION) &&
            (key.startsWith("rico-ouro-cache-") ||
              key.startsWith("rico-ouro-api-") ||
              key.startsWith("rico-ouro-dynamic-"))
          ) {
            console.log("Service Worker: Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === "CACHE_DYNAMIC_ROUTES") {
    event.waitUntil(cacheUrls(event.data.urls as string[]));
  }
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});

// ============================================================================
// FETCH - Caching Strategies
// ============================================================================

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension")) return;

  const url = new URL(event.request.url);

  // CRITICAL: Bypass Service Worker for /api/sync
  // RxDB needs to know the real connection status to manage its own queue.
  if (url.pathname === "/api/sync") {
    console.log("[SW] Bypassing cache for /api/sync");
    return;
  }

  // 1. Static Assets (_next/static) - Cache-First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            await cacheResponse(CACHE_NAME, event.request, networkResponse);
          }
          return networkResponse;
        } catch {
          return new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // 2. Generic API Requests - Network-First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        const NETWORK_TIMEOUT = 5000;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
          const networkResponse = await fetch(event.request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (networkResponse && networkResponse.status === 200) {
            await cacheResponse(API_CACHE_NAME, event.request, networkResponse);
          }
          return networkResponse;
        } catch {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          return new Response(JSON.stringify({ error: "Offline", cached: false }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })()
    );
    return;
  }

  // 3. Navigation (HTML) - Network-First with App Shell Fallback
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            await cacheResponse(CACHE_NAME, event.request, networkResponse);
          }
          return networkResponse;
        } catch {
          const exactMatch = await caches.match(event.request);
          if (exactMatch) return exactMatch;
          
          const rootResponse = await caches.match("/");
          if (rootResponse) return rootResponse;

          return caches.match("/offline.html") as Promise<Response>;
        }
      })()
    );
    return;
  }

  // 4. Supabase Storage (Images) - Cache-First
  if (url.hostname.includes("supabase.co") && url.pathname.includes("/storage/")) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            await cacheResponse(CACHE_NAME, event.request, networkResponse);
          }
          return networkResponse;
        } catch {
          return new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // 5. Default - Cache-First
  event.respondWith(
    caches.match(event.request).then(async (response) => {
      if (response) return response;
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          await cacheResponse(CACHE_NAME, event.request, networkResponse);
        }
        return networkResponse;
      } catch {
        return new Response("Offline", { status: 503 });
      }
    })
  );
});

// Note: Background Sync is now managed entirely by RxDB replication logic.
// Manual offline queue and periodic sync handlers removed in v29.
