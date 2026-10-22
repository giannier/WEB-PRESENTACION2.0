# Deploy (static export)

This fork builds with `output: 'export'` (see `next.config.mjs`). `npm run build` produces
a plain static `out/` folder — HTML, CSS, JS, and the images under `public/` — with no
Node server involved.

Deploying means getting the contents of `out/` onto the host, nothing else:

- **Git**: push `out/` (or its contents) to whatever branch/path the host serves from.
- **FTP**: upload the contents of `out/` to the host's web root.

No Node.js runtime, no `node_modules`, no process manager needed on the server. The 4
contact/voice endpoints that used to be local API routes now call the original project's
live Vercel deployment directly (see `src/lib/apiBaseUrl.ts`).
