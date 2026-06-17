# Vite Module Federation on Cloudflare Workers

<img width="797" height="675" alt="image" src="https://github.com/user-attachments/assets/101e1b02-3d97-4088-b0ef-12fa4f03aac6" />

A minimal, production-shaped example of a **micro-frontend monorepo** using
**Module Federation** (`@module-federation/vite`) on **Cloudflare Workers**.

An npm-workspace monorepo with one **host** app and two **remote** micro-frontends
(MFEs), each deployed as its own Cloudflare Worker. The host loads the remotes at
runtime and proxies their assets same-origin, so there's no CORS in production and a
single host build works across every environment.

## Layout

```
apps/host/         Host shell. Cloudflare Worker (cloudflare-react) serving the SPA.
                   Consumes the remotes at runtime and proxies /remote-a/* and
                   /remote-b/* to them.
mfes/remote-a/     Remote MFE. Static-assets-only Worker exposing ./Widget.
mfes/remote-b/     Remote MFE. Static-assets-only Worker exposing ./Widget.
```

## How the remote URLs resolve (dev + deployed)

The host registers remotes **at runtime** (`apps/host/src/moduleFederation/`), so a
single build loads each remote from the right place per environment:

| Environment | Remote entry URL | How it's served |
|-------------|------------------|-----------------|
| **dev** | `http://localhost:5174/remoteEntry.js` (remote-a), `:5175` (remote-b) | each remote's Vite dev server, cross-origin (CORS `*`) |
| **deployed** | `/remote-a/remoteEntry.js`, `/remote-b/remoteEntry.js` | **same-origin**; the host Worker proxies `/remote-a/*` and `/remote-b/*` to the remote Workers (service bindings `REMOTE_A` / `REMOTE_B`) — no CORS |

Override a dev origin with `VITE_REMOTE_A_URL` / `VITE_REMOTE_B_URL` (e.g. point dev
at an already-deployed remote).

## Develop

```bash
npm install
npm run dev          # runs remote-a (5174) + remote-b (5175) + host (5173) together
```

Open http://localhost:5173 — the page shows the host shell with each remote's
`Widget` mounted inside it.

## Build

```bash
npm run build        # builds all workspaces
```

## Deploy

Deploy per environment — `qa` or `prod`. `VITE_APP_VERSION` is required:
it tags the deployed version (used for rollback) and is baked into the build.

```bash
VITE_APP_VERSION=v1.0.1 npm run deploy:qa        # or deploy:prod
```

Each `deploy:<env>` deploys the remotes first, then the host (the host's service
bindings target that env's remotes).

> **Before you deploy:** set your own Worker names and custom domains in the
> `wrangler.jsonc` files. The host's `apps/host/wrangler.jsonc` uses placeholder
> domains like `app-qa.your.domain.io` — replace them with your own (or remove the
> `routes` blocks to deploy on `*.workers.dev` instead).


## The workers results in cloudflare
```bash
VITE_APP_VERSION=1.0.0 npm run deploy:qa
```

<img width="1299" height="629" alt="Screenshot 2026-06-17 at 16 13 47" src="https://github.com/user-attachments/assets/31cf1680-8a78-4923-9145-339e23d2bc18" />

### Rollback

Each deploy creates an immutable version tagged with `VITE_APP_VERSION`. Rollback is
per-Worker — target it with `--name`.

```bash
# Roll back to the PREVIOUS version, recording a reason with -m / --message:
npx wrangler rollback --name cloudflare-react-qa -m "revert: bad qa release"
```

`wrangler rollback` takes a **version id**, not a tag — so to roll back to a specific
tagged version, look up its id first (the `Tag` column is the `VITE_APP_VERSION`):

```bash
# 1. find the version id for the tag you want (e.g. v1.0.1)
npx wrangler versions list --name cloudflare-react-qa

# 2. roll back to that id
npx wrangler rollback 1a2b3c4d-5e6f-7890-abcd-ef1234567890 \
  --name cloudflare-react-qa -m "pin qa back to v1.0.1"
```

Remotes roll back the same way — `--name cloudflare-react-remote-a-qa` (or
`-remote-b-qa`). Swap the `-qa` suffix for `-prod` for the other env.

## Preview URLs

`preview_urls` is enabled on every Worker, so you can upload a build as a new
**version** and get a URL for it **without touching production traffic**. Use
`--preview-alias` for a stable, readable URL (re-uploading with the same alias moves
it to the newest version, so the URL stays constant across pushes).

Host — the env is baked in at build time via `CLOUDFLARE_ENV`, so build against the
env whose remotes you want bound (e.g. `qa`), then upload:

```bash
cd apps/host
CLOUDFLARE_ENV=qa npm run build
npx wrangler versions upload --preview-alias pr-123
# → Version Preview Alias URL: https://pr-123-cloudflare-react-qa.<subdomain>.workers.dev
```

Remotes — env via `--env`:

```bash
cd mfes/remote-a
npm run build
npx wrangler versions upload --env qa --preview-alias pr-123
# → https://pr-123-cloudflare-react-remote-a-qa.<subdomain>.workers.dev
```

- Promote a previewed version to live traffic with `wrangler versions deploy`.
- **MFE caveat:** a host preview's service bindings point at the *deployed* remotes,
  not preview versions — so it previews host changes against the live remotes. To
  preview a remote change, upload a preview of that remote and open its own URL.

## Notes / gotchas baked into this setup

- The **remote** Workers use `not_found_handling: "none"` — MFE asset origins must
  404 on missing chunks, never SPA-fallback to `index.html`.
- The **host** Worker uses `run_worker_first` for `/remote-a/*`, `/remote-b/*`, and
  `/api/*` so it can proxy/handle those; everything else is served straight from
  static assets.
- The host Worker sets cache headers itself (`worker/index.ts`) because `_headers`
  files don't apply to responses a Worker returns via `env.ASSETS.fetch`. The remotes
  are assets-only Workers, so their own `public/_headers` apply.
- Shared singletons (`react`, `react-dom`) are declared in every `vite.config.ts` so
  there's one React instance across the federation boundary.
- `dts: false` on the federation plugin disables remote type generation (avoids a
  noisy build-time DTS step).
