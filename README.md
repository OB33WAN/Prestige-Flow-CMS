# Prestige Flow CMS and website source

GitHub is used for Decap CMS content editing, draft review, and source control. Octopye Digital Designs remains the website host. The EasyPanel `old-web` service serves staging. Its source still needs to be changed from Upload to this repository before approved changes can auto-deploy; setup details are in `deploy/easypanel/CMS-GITHUB-SETUP.md`. The apex/live domain is not attached to this staging service.

This repository contains the website's full source: all HTML pages, stylesheets, JavaScript, images, CMS content collections, and build tools. The repository is public, so anyone can read or fork that source. The agency should use the editor instead of receiving repository write access. Its editor workflow is limited to CMS Markdown and image uploads, and a pull-request check rejects changes to website HTML, CSS, JavaScript, payment or API code, email settings, and other protected files. Current service and industry pages and the consolidated Areas overview are prefilled in the editor; selected copy and SEO fields are overlaid onto their existing templates at build time. The CRM and payments API remain separate and are not included here.

## Local checks

Install Node.js 22, then run these commands from this folder:

```powershell
npm ci
npm run test:cms
npm run build
npm run check
```

The build creates `.public-site/`, which is ignored by Git. Pull requests run the CMS-only file-scope check and the site build/SEO checks. To enable approval-gated automatic staging deploys, protect `main` and connect the EasyPanel staging service as documented below. Once configured, approved and merged drafts deploy to staging.

The intended editor link is `https://staging.prestigeflow.co.uk/admin/`; it becomes available after the EasyPanel source is switched and the first build is deployed. Editors need their own GitHub accounts, but should not be added as repository collaborators. See `deploy/easypanel/CMS-GITHUB-SETUP.md` for EasyPanel configuration and the agency workflow.

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated release archives.
