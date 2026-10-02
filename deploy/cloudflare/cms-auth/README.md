# Prestige Flow Decap CMS authentication Worker

This Cloudflare Worker handles Decap CMS GitHub OAuth for `OB33WAN/Prestige-Flow-CMS`. It is deployed separately from the static website.

## Before deploying

1. Create a GitHub OAuth App. Set its homepage to `https://cms-auth.prestigeflow.co.uk` and callback URL to `https://cms-auth.prestigeflow.co.uk/callback`.
2. In Cloudflare, open **Workers & Pages**, create or deploy this Worker, then attach the custom domain `cms-auth.prestigeflow.co.uk`. Cloudflare creates the DNS record and TLS certificate for that custom domain.
3. Add `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET` as **Worker secrets**. Never put the secret in source control or the public site's environment/configuration.
4. Keep `GITHUB_REPO_PRIVATE = "0"` for the current public repository. Change it to `"1"` only if the repository becomes private.

## Deploy from this folder

```powershell
npm install
npx wrangler login
npm run typecheck
npm run deploy
```

The Worker uses a short-lived, HttpOnly, Secure, SameSite=Lax state cookie and rejects callback requests whose OAuth `state` does not match. It returns the GitHub token only to the configured Prestige Flow CMS origins. The exact `http://localhost:4173` origin is included for local editor testing; keep local CMS preview on that port and add no wildcard localhost origins. Add any future CMS origin to `allowedCmsOrigins` in `src/index.ts` before using it.

The source repository is `OB33WAN/Prestige-Flow-CMS` (`main`). The CMS editor is served at `/admin/` on the website host; that path must be present in the current website deployment before editors can open it. Deploy the website CMS configuration only after the Worker hostname is serving HTTPS.
