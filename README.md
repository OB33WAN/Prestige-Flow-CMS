# Prestige Flow CMS and website source

GitHub is used for Decap CMS content editing, draft review, and source control. Octopye Digital Designs remains the website host. The EasyPanel `old-web` service source is still Upload, so GitHub merges do not deploy automatically. The intended publishing flow is owner-approved pull request → merge to protected `main` → automatic deployment directly to production; setup details and the pending EasyPanel connection are in `deploy/easypanel/CMS-GITHUB-SETUP.md`.

This repository contains the website's full source: all HTML pages, stylesheets, JavaScript, images, CMS content collections, and build tools. The repository is public, so anyone can read or fork that source. The agency should use the editor instead of receiving repository write access. Its editor workflow is limited to CMS Markdown and image uploads, and a pull-request check rejects changes to website HTML, CSS, JavaScript, payment or API code, email settings, and other protected files. CMS pages automatically load the shared site styles and scripts; the agency cannot edit those assets. Current service and industry pages and the consolidated Areas overview are prefilled in the editor; selected copy, SEO fields and optional images are overlaid onto their existing templates at build time. Booking, enquiry email, and payment requests use the separate old-site API, which is not included here.

## Local checks

Install Node.js 22, then run these commands from this folder:

```powershell
npm ci
npm run test:cms
npm run build
npm run check
```

The build creates `.public-site/`, which is ignored by Git. Pull requests run the CMS-only file-scope check and the site build/SEO checks. To enable approval-gated automatic production deploys, protect `main` and connect the EasyPanel production website service as documented below. Once configured, only owner-approved and merged drafts deploy directly to production.

The intended editor link is `https://prestigeflow.co.uk/admin/`; it becomes available after the production EasyPanel source is switched and the first build is deployed. Editors need their own GitHub accounts, but should not be added as repository collaborators. See `deploy/easypanel/CMS-GITHUB-SETUP.md` for EasyPanel configuration and the agency workflow.

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated release archives.
