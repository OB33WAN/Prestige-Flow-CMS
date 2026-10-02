# Prestige Flow CMS setup and editor access

## What the CMS does

The CMS is a password-protected editing screen for drafting new service, industry and area pages. Editors enter page copy and SEO fields in a web form; Decap saves a draft in GitHub and opens a pull request for review. It does not let an outside editor publish directly. The public website stays on its existing Octopye/EasyPanel Upload deployment and does not update automatically when a pull request is merged.

The CMS is currently for **new** SEO landing pages. The existing hand-built pages are not editable from this screen. Prices, payment terms, canonical rules, redirects and structured data stay centrally managed and are checked by the build.

## The link to send editors

After the latest website build has been uploaded to the website service, editors will use:

`https://prestigeflow.co.uk/admin/`

For a staging check, use `https://staging.prestigeflow.co.uk/admin/` if that staging domain is attached to the current website service. At present, both `/admin/` paths return 404, so the editor is **not yet live** and this link is not ready to send. The local build includes the editor under `.public-site/admin/`; the production or staging website needs that build uploaded through Octopye/EasyPanel first.

## What an editor needs

- Their own GitHub account. Do not share your account or add the agency as a repository collaborator.
- Access to the editor link after deployment.
- To sign in, they choose GitHub and authorize the Prestige Flow CMS OAuth app. With Open Authoring they submit drafts from their own fork as pull requests; they do not get permission to write to `main`.

The GitHub repository is public so the agency can inspect the HTML, CSS, JavaScript and other website source. They can read or fork it, but should not be given repository write access. The CMS editor exposes the content fields only. The `CMS file scope` check rejects pull requests that change anything beyond page Markdown in `content/cms/` and image files in `assets/cms/`; in particular, it blocks website HTML, CSS, JavaScript, Stripe/payment logic, API configuration and email links.

The CMS is configured to use `OB33WAN/Prestige-Flow-CMS` on `main`. Its OAuth Worker is `https://cms-auth.prestigeflow.co.uk`; the Worker source and deployment instructions are in `deploy/cloudflare/cms-auth/`. The GitHub OAuth app callback must remain `https://cms-auth.prestigeflow.co.uk/callback`. Keep `GITHUB_OAUTH_SECRET` only in the Cloudflare Worker secret settings.

## Review and publishing steps

1. The editor opens `/admin/`, signs in with their own GitHub account, and selects **Service pages**, **Industry pages**, or **Area pages**.
2. They create or edit a draft and choose **Ready for review**. Decap creates a pull request in GitHub.
3. You review the draft and the automated **build** check. Merge only when you are happy with the copy and SEO fields.
4. Merging updates the source repo only. To put the approved page on the public website, prepare and upload the website build through Octopye/EasyPanel. The existing Upload deployment remains in place; GitHub does not trigger a website deployment.

Do not use numeric prices, payment promises, unverified accreditations, guarantees, testimonials or unsupported location claims in new page copy. Use the approved service rates and existing booking/contact links. The build rejects placeholder copy, weak pages, invalid internal links and conflicting routes.

## Account and service checks

- The Cloudflare Worker must have `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET` set as Worker secrets and the custom domain `cms-auth.prestigeflow.co.uk` serving HTTPS.
- The Worker must respond at `/` and redirect `/auth?provider=github` to GitHub. Its message allowlist includes the apex, `www`, `test` and `staging` website origins.
- The CMS editor page must load at the intended website origin before you share that link. Test sign-in, a draft pull request, the build check, review/merge, and the separate website upload before treating the workflow as ready for the agency.
- GitHub Actions runs `npm ci`, `npm run test:cms`, `npm run build`, and `npm run check` for pull requests and pushes to `main`.
- In GitHub, protect `main`: require a pull request, one approval from a code owner, and successful `cms-file-scope` and `build` checks before merging. The repository contains `.github/CODEOWNERS` to request your review. Do not grant the agency repository write access.
