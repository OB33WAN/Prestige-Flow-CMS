# Prestige Flow CMS and website source

GitHub is used for Decap CMS content editing, draft review, and source control. Octopye Digital Designs remains the website host. The EasyPanel `old-web` service serves staging and is configured to build from this repository; approved changes merged to protected `main` deploy to staging automatically. The apex/live domain is not attached to this deployment.

This repository contains the website's full source: all HTML pages, stylesheets, JavaScript, images, CMS content collections, and build tools. The repository is public, so anyone can read or fork that source. The agency should use the editor instead of receiving repository write access. Its editor workflow is limited to page-content Markdown and image uploads, and a pull-request check rejects changes to design code, page templates, payment or API code, email settings, and other protected files. The CRM and payments API remain separate and are not included here.

## Local checks

Install Node.js 22, then run these commands from this folder:

```powershell
npm ci
npm run test:cms
npm run build
npm run check
```

The build creates `.public-site/`, which is ignored by Git. Pull requests run the CMS-only file-scope check and the site build/SEO checks. Protect `main` so changes require a pull request, one code-owner approval, and passing `cms-file-scope` and `build` checks. Once the owner approves and merges a draft, EasyPanel automatically builds and deploys that commit to staging.

The editor link is `https://staging.prestigeflow.co.uk/admin/`. Editors need their own GitHub accounts, but should not be added as repository collaborators. See `deploy/easypanel/CMS-GITHUB-SETUP.md` for EasyPanel configuration and the agency workflow.

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated release archives.
