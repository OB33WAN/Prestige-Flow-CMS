# Prestige Flow CMS setup and editor access

## What the CMS does

The CMS is an editing screen for reviewing and drafting page copy, page images and SEO fields. It lists all 7 active service pages, 15 active industry pages and the consolidated Areas overview with their current wording prefilled. Editors can update selected text/image fields on those pages or draft new service, industry and area pages. Decap saves changes in GitHub and opens a pull request for review. After you approve and merge that pull request to protected `main`, the configured EasyPanel production service should build and deploy the approved content directly to production; there is no automatic staging publication in this workflow.

Existing-page edits replace only preselected text, metadata and optional page images in the built copy of the HTML templates. CMS pages automatically load the shared site CSS and JavaScript, but the agency cannot edit those assets or raw HTML, layouts, links, service cards, booking/payment content, prices, canonical rules, redirects or structured data. CMS copy and image paths are validated before a build, and the GitHub check rejects changes outside CMS Markdown and CMS image uploads. Individual area pages were retired and redirect to the consolidated Areas overview. That overview is available under **Current areas overview**; use **New area page drafts** only for a genuinely new page after your approval.

## The link to send editors

Editors will use after the production service publishes the editor:

`https://prestigeflow.co.uk/admin/`

The EasyPanel `old-web` service source is currently **Upload**, so GitHub merges do not deploy the site yet. Configure the production-serving service's source as the GitHub repository, confirm the production domain is attached to that service, and deploy the first build. Once enabled, owner-approved merges to `main` should trigger production builds. Do not configure this workflow to deploy the content to staging.

## What an editor needs

- Their own GitHub account. Do not share your account or add the agency as a repository collaborator.
- Access to the editor link after deployment.
- To sign in, they choose GitHub and authorize the Prestige Flow CMS OAuth app. With Open Authoring they submit drafts from their own fork as pull requests; they do not get permission to write to `main`.

The GitHub repository is public so the agency can inspect the HTML, CSS, JavaScript and other website source. They can read or fork it, but should not be given repository write access. The CMS editor exposes content fields only. The `CMS file scope` check accepts Markdown in `content/cms/` and images in `assets/cms/`; it blocks website HTML, CSS, JavaScript, Stripe/payment logic, API configuration and email settings.

The CMS is configured to use `OB33WAN/Prestige-Flow-CMS` on `main`. Its OAuth Worker is `https://cms-auth.prestigeflow.co.uk`; the Worker source and deployment instructions are in `deploy/cloudflare/cms-auth/`. The GitHub OAuth app callback must remain `https://cms-auth.prestigeflow.co.uk/callback`. Keep `GITHUB_OAUTH_SECRET` only in the Cloudflare Worker secret settings.

## Review and publishing steps

1. The editor opens `/admin/`, signs in with their own GitHub account, and selects **Current service pages**, **Current industry pages** or **Current areas overview** to review/edit existing copy, or one of the **New … page drafts** collections to propose a new page. Retired area URLs are not listed as active pages.
2. They create or edit a draft and choose **Ready for review**. Decap creates a pull request in GitHub.
3. You review the draft and the automated **cms-file-scope** and **build** checks. The `main` branch must require one code-owner approval before a pull request can merge.
4. After you approve and merge the pull request, EasyPanel's GitHub webhook should deploy that commit directly to the production service. No ZIP upload or staging step is part of this workflow. Keep main protected and do not merge until the content review and all checks pass.

Do not use numeric prices, payment promises, unverified accreditations, guarantees, testimonials or unsupported location claims in new page copy. Use the approved service rates and existing booking/contact links. The build rejects placeholder copy, weak pages, invalid internal links and conflicting routes.

## Account and service checks

- The Cloudflare Worker must have `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET` set as Worker secrets and the custom domain `cms-auth.prestigeflow.co.uk` serving HTTPS.
- The Worker must respond at `/` and redirect `/auth?provider=github` to GitHub. Its message allowlist includes the apex, `www`, `test` and `staging` website origins.
- The CMS editor page must load at the production origin before you share that link. Test sign-in, a draft pull request, both checks, owner review/merge, and automatic production deployment before treating the workflow as ready for the agency.
- GitHub Actions runs `npm ci`, `npm run test:cms`, `npm run build`, and `npm run check` for pull requests and pushes to `main`.
- In GitHub, protect `main`: require a pull request, one approval from a code owner, and successful `cms-file-scope` and `build` checks before merging. The repository contains `.github/CODEOWNERS` to request your review. Do not grant the agency repository write access.

## EasyPanel production deployment

**Pending activation:** The current EasyPanel `old-web` source is still **Upload**. On the service that will serve the production website, choose **Source → GitHub** and configure:

- Repository: `OB33WAN/Prestige-Flow-CMS`
- Branch: `main`
- Build path: `/`
- Builder: **Dockerfile**
- Dockerfile path: `deploy/easypanel/site.Dockerfile`
- Auto Deploy: enabled (GitHub webhook)

Save and deploy once to publish the editor and site on the production domain. Verify the production domain is attached to this service before enabling auto-deploy. This is the live website, so the required owner pull-request approval is the release gate; merges to `main` deploy directly to production. Do not put Stripe, SMTP, API, or database secrets in this public website service.
