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

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated release archives.
