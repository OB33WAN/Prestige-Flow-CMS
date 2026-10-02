# Prestige Flow CMS and website source

GitHub is used for Decap CMS content editing, draft review, and source control. It does not host or automatically deploy the public website. Octopye Digital Designs remains the website host and the current Upload deployment remains in place.

This repository contains the website's full source: all HTML pages, stylesheets, JavaScript, images, CMS content collections, and build tools. The repository is public, so anyone can read or fork that source. The agency should use the editor instead of receiving repository write access. Its editor workflow is limited to page-content Markdown and image uploads, and a pull-request check rejects changes to design code, page templates, payment or API code, email settings, and other protected files. The CRM and payments API remain separate and are not included here.

## Local checks

Install Node.js 22, then run these commands from this folder:

```powershell
npm ci
npm run test:cms
npm run build
npm run check
```

The build creates `.public-site/`, which is ignored by Git. Pull requests run the CMS-only file-scope check and the site build/SEO checks. CMS drafts are reviewed as pull requests; merging updates the source repository but does not deploy the website. The site owner reviews and uploads approved releases through Octopye/EasyPanel.

The editor link is `https://prestigeflow.co.uk/admin/` once the latest site build containing `/admin/` is uploaded. Editors need their own GitHub accounts, but should not be added as repository collaborators. See `deploy/easypanel/CMS-GITHUB-SETUP.md` for the agency workflow and upload status.

Do not commit `.env` files, credentials, payment secrets, database URLs, or generated release archives.
