// `_headers` files are NOT applied to responses a Worker returns (incl. via
// env.ASSETS.fetch) — https://developers.cloudflare.com/workers/static-assets/headers/
// — so the host sets cache headers here. Content-hashed /assets/* are immutable;
// HTML/everything else keeps the default (revalidate). Remotes are assets-only
// Workers, so their own _headers apply and pass through the proxy unchanged.
function withAssetCache(res: Response, pathname: string): Response {
  const out = new Response(res.body, res);
  // Content-hashed bundles never change for a URL → cache forever.
  // Everything else (index.html, etc.) must revalidate so new deploys are picked up.
  out.headers.set(
    "Cache-Control",
    pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  );
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy each remote MFE's assets same-origin so the browser loads the
    // remote entry + its chunks without CORS:  /<prefix>/<path> -> remote Worker /<path>.
    const remoteRoutes: Array<{ prefix: string; service: Fetcher }> = [
      { prefix: "/remote-a", service: env.REMOTE_A },
      { prefix: "/remote-b", service: env.REMOTE_B },
    ];
    for (const { prefix, service } of remoteRoutes) {
      if (url.pathname === prefix || url.pathname.startsWith(prefix + "/")) {
        const target = new URL(request.url);
        target.pathname = url.pathname.slice(prefix.length) || "/";
        return service.fetch(new Request(target, request));
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }

    // Everything else: serve the host's static assets (SPA).
    return withAssetCache(await env.ASSETS.fetch(request), url.pathname);
  },
} satisfies ExportedHandler<Env>;
