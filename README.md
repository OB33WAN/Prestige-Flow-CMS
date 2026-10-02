# Prestige Flow CMS and website source

GitHub is used for Decap CMS content editing, draft review, and source control. It does not host or automatically deploy the public website. EasyPanel remains the website host and the current Upload deployment remains in place.

This repository contains the public site templates, assets, content collections, and CMS build tools because the CMS needs them to create and validate pages. CRM and payments API code are separate and intentionally excluded.

## Local checks

Install Node.js 22, then run these commands from this folder:

```powershell
npm ci
npm run test:cms
npm run build
npm run check
```

The build creates `.public-site/`, which is ignored by Git. Pull requests run the site and CMS checks. CMS editorial drafts are reviewed as pull requests; merging updates the source repository but does not deploy the website. Prepare and upload a release through EasyPanel only when the site owner requests a deployment.

## CMS setup

The admin is under `admin/`. Its GitHub backend targets `OB33WAN/Prestige-Flow-CMS` on `main`. GitHub OAuth is handled by the separately deployed Cloudflare Worker at `cms-auth.prestigeflow.co.uk`. Keep the OAuth client secret and worker secrets in their respective secret settings; never commit them here.

The editable collections cover service, industry, and area pages. Prices, canonical URLs, redirects, structured data, payments, and technical settings remain under site-owner control and need review before release.

## EasyPanel release

The public site image can be built from `deploy/easypanel/site.Dockerfile` and serves on port 80. This Dockerfile is provided for a manually prepared EasyPanel release; the EasyPanel service is not connected to GitHub for automatic deployment. The existing API remains a separately configured EasyPanel service. API and payment credentials belong only in that API service's secret environment settings.

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated release archives.
