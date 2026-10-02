# Prestige Flow website and CMS

This repository contains the public Prestige Flow website, its Decap CMS admin, content collections, and the build checks used for review. The CRM and payment API are separate services and are intentionally not included here.

## Local checks

Install Node.js 22, then run these commands from this folder:

```powershell
npm ci
npm run test:cms
npm run build
npm run check
```

The build creates `.public-site/`; that generated directory is ignored by Git. Pull requests run the same checks before content can be merged. CMS drafts use Decap's editorial workflow and are reviewed as pull requests.

## CMS setup

The CMS admin is under `admin/`. Its GitHub backend targets `OB33WAN/Prestige-Flow-CMS` on `main`, and OAuth is handled by the separately deployed Cloudflare Worker at `cms-auth.prestigeflow.co.uk`. Keep the OAuth client secret and worker secrets in their respective secret settings; never commit them here.

The editable collections cover service, industry, and area pages. Rates, canonical URLs, redirects, structured data, payments, and technical settings remain controlled in code and should be reviewed by the site owner.

## Hosting

The public site can be built from `deploy/easypanel/site.Dockerfile`. It serves the static site on port 80. The existing API remains a separately configured EasyPanel service; site API origins are public URLs, while API and payment credentials belong only in the API service's secret environment settings.

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated archives.
