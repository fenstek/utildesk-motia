# Backlink Outreach Log

Last updated: 2026-04-30

## Scope

This file tracks safe outreach for `https://tools.utildesk.de/`.

Working rule: prefer editorial, curated, startup/software, AI-discovery, and
German ecosystem resources. Avoid spam farms, paid backlink bundles, mandatory
reciprocal badges, broken forms, captcha walls that cannot be completed
honestly, and account registrations that require a private email identity.
Never submit or expose a personal first name or surname without explicit
project-owner approval for that exact submission.

## Product Passport

- Product name: Utildesk
- Website: https://tools.utildesk.de/
- English URL: https://tools.utildesk.de/en/
- Logo URL: https://tools.utildesk.de/logo-grid.svg
- German description: Kuratiertes Verzeichnis fuer AI-Tools, Automatisierung,
  Produktivitaet und redaktionelle Ratgeber.
- English description: Curated directory for AI tools, automation,
  productivity, and editorial guides.
- Suggested category: AI tools directory, productivity, automation, marketing
  and SEO, startup resource, software directory.
- Suggested tags: AI, AI tools, automation, productivity, software directory,
  startup tools, SEO, Ratgeber, guides.

Public contact email from the obfuscated German imprint:
`outcome_washed828@simplelogin.com`. The live page renders it with JavaScript,
so raw HTML checks do not see it as plain text. DNS for `utildesk.de` still
does not expose an MX record; do not use guessed domain emails such as
`support@utildesk.de` for outreach. Do not submit a personal provider name in
third-party outreach forms; use only `Utildesk` or `Utildesk Team` where a
name-like field is required.

## Submitted Or Previously Reported

| Resource | URL / route | Status | Notes |
| --- | --- | --- | --- |
| GrowDR | https://growdr.io/?q=utildesk | Live backlink confirmed | HTML/Next payload contains `Utildesk`, `https://tools.utildesk.de/`, status `approved`; detail route is `https://growdr.io/workflow/tools-utildesk-de`. |
| SaaSHub | https://www.saashub.com/utildesk-alternatives | Listing visible, backlink missing | Page is live and mentions Utildesk, but raw HTML did not contain `tools.utildesk.de` during the 2026-04-29 check. |
| Launch Llama | tools.launchllama.co | Pending / not visible | Previous handoff screenshot said approved; sitemap and public HTML did not show Utildesk yet. |
| AISO Tools | aisotools.com | Pending / not visible | Previous handoff screenshot said `success:true`; sitemap/search/direct routes did not show Utildesk yet. |
| The Next AI | thenextai.com | Pending / not visible | Previous handoff screenshot said `success:true`; checked direct routes and sitemap, no live listing yet. |
| zPlatform | zplatform.ai | Pending / not visible | Previous handoff screenshot said `success:true`; checked direct routes and sitemap, no live listing yet. |

## Free Quality Submissions - 2026-04-29

All submissions below used only the public imprint email and `Utildesk` or
`Utildesk Team`. No personal first name or surname was submitted.

| Resource | URL / route | Status | Notes |
| --- | --- | --- | --- |
| MyCaptionAI | https://www.mycaptionai.com/submit | Submitted | Direct POST to `/api/tool-submissions` returned `200` and redirected to `/submit?submitted=1`; page states review within 48 hours. |
| FindAIDir | https://findaidir.com/submit-tool | Submitted | Direct POST to `/api/tool-submissions` returned `201 {"ok":true,"accepted":true}` with category `Productivity`. |
| GPTBot | https://gptbot.io/submit-ai-tool | Submitted | Free `Standard` plan POST to `/api/submit-tool` returned `200 {"success":true}`; page states standard review may take 1-3 months and link is nofollow. |
| LineZine | https://linezine.com/list-your-tool | Submitted | Free listing POST to `/api/submit-tool` returned `200 {"success":true}`; page says review within 48 hours. |
| IndiaKaAI | https://indiakaai.com/contact?tab=submit | Submitted | Their submit form sends through EmailJS; API returned `200 OK`. Submitter name field used `Utildesk Team`. |
| AI Tools Index | https://aitoolsindex.org/submit | Submitted | POST to `/api/submit/enqueue-tool-submission` returned `success:true`, status `pending`, and a queue key. |
| TheToolBus | https://www.thetoolbus.ai/ai-tools/submit | Submitted | Free directory placement via FormSubmit redirected to `/ai-tools/submit?success=true`. |
| AI Journal / UseThisAI | https://usethisai.com/submit-tool | Submitted | Strapi POST to `https://strapi.usethisai.com/api/tool-submissions` returned `201`, status `pending`. |
| AI Tool Scouts | https://aitoolscouts.com/submit-tool.html | Submitted | POST to `submit-tool.php` returned `200 {"status":"success"}`. Submitter name field used `Utildesk Team`. |
| AI Tools Directory Site | https://aitoolsdirectory.site/submit.html | Submitted, delivery unconfirmed | FormSubmit POST returned `200`, but final URL stayed on FormSubmit rather than a site success redirect; treat as pending/unconfirmed. |
| AIFirstIndex | https://aifirstindex.com/submit | Submitted | Public form POST to `/api/submit-tool` returned `200 {"success":true,"id":77}`. |
| Faceless Directory | https://faceless.directory/submit | Submitted | Public form POST to `/api/submit-tool` returned `200 {"success":true}`; relevant niche around automation/content workflows. |
| Tools Directory Online | https://toolsdirectoryonline.com/submit | Submitted / pending | Public form POST to `/api/submit` returned success with id `bf0b924f-5892-4bd2-8d99-27a4309dfe51` and status `pending`. |
| Startup Collections | https://startupcollections.com/submit-product/ | Submitted | Embedded Google Form confirmed submission (`Ihre Antwort wurde gesendet`). Used the free queue and selected `No` for the optional `$10` skip-the-queue sponsorship. |
| FreeNoSignup | https://www.freenosignup.com/submit/ | Submitted | Embedded Google Form confirmed submission (`Ihre Antwort wurde gesendet`). Submitted as a free no-signup AI/productivity web resource. |
| NoSignupTools | https://nosignuptools.com/submit | Submitted | Browser form returned success toast: `Thanks for your submission! We’ve received your tool and will review it shortly.` Uploaded project logo and homepage screenshot only; no personal data. |
| AI Cloudbase | https://aicloudbase.com/submit | Submitted | Public JSON POST to `/api/submit` returned `200 {"success":true,"message":"Tool submitted successfully! We will review it soon."}`; category `AI Productivity Tools`, pricing `free`. |

Follow-up verification on 2026-04-29:

- AI Tools Index queue status changed from `pending` to `success` through
  `/api/submit/get-tool-submission`, but no public `Utildesk` listing or
  `tools.utildesk.de` backlink was visible yet on the public pages checked.
- Public search/direct checks for MyCaptionAI, FindAIDir, GPTBot, LineZine,
  IndiaKaAI, AI Tools Index, TheToolBus, UseThisAI, AI Tool Scouts, and AI
  Tools Directory Site did not show a live backlink immediately after
  submission. Any `Utildesk` match on query pages was only the search query
  echoed in HTML, not a published listing.
- Public search/direct checks for AIFirstIndex, Faceless Directory, Tools
  Directory Online, Startup Collections, FreeNoSignup, NoSignupTools, and AI
  Cloudbase did not show a live `tools.utildesk.de` backlink immediately after
  submission. These should be treated as moderation-pending, not published.

Follow-up verification on 2026-04-30:

- External exact-match search for `tools.utildesk.de` did not find new public
  backlinks outside the Utildesk project.
- Direct HTML/slug/search checks still show only the previously confirmed
  GrowDR backlink as live. SaaSHub still has a visible Utildesk listing but no
  raw `tools.utildesk.de` backlink in the fetched HTML.
- API/search checks for AIFirstIndex, Tools Directory Online, NoSignupTools,
  and AI Cloudbase returned no public Utildesk result yet. Other submitted
  directories checked by direct/search routes also remain moderation-pending or
  not visible.

## Blocked Or Failed New Attempts - 2026-04-29

| Resource | Current finding |
| --- | --- |
| Airadar | Form is otherwise relevant and free, but two honest POST attempts with CSRF token and visible math answer returned server `500`; do not retry until their form is fixed. |
| AI Tool Claw | Form endpoint `/api/submit-tool/` returned server `500`; likely broken. |
| NavTools | Free path requires Cloudflare Turnstile verification; not submitted without browser/human verification. |
| AI Workbench | reCAPTCHA-protected submission; not submitted. |
| TakeAI | Cloudflare Turnstile present; not submitted. |
| AI Tool Discovery | Free listing requires adding their badge/backlink; rejected under the no-reciprocal rule. |
| ToolIndex | `toolindex.ai` and `www.toolindex.ai` did not resolve from the local environment. |
| SoloTools | Looks relevant and free, but local HTTP requests timed out repeatedly; not submitted. |
| Artelligence | reCAPTCHA-protected submission; not submitted. |
| IntelligentTools | Turnstile/Supabase submission flow; not submitted without browser/human verification. |
| Aindexc | Search result pointed to `/submit`, but the live site is an agency/contact site rather than a usable AI directory submit form. |
| Toolsland | Free form exists, but its GraphQL backend at `https://api.toolsland.ai/graphql` returned Railway `404 Application not found`; not submitted. |
| ToolScout | Browser form can be filled, but submit is blocked by a login modal/greyout overlay; no submit request was sent. |
| FiveTaco | URL submit flow opens a `Sign up to continue` modal; not submitted because account creation is required. |
| SimpleLister | Redirects to `/auth` and states free slots are full for the next 9 months; only paid submissions are accepted. |
| iFoundAI | Public form looks clean, but submit redirects to `/auth`; not submitted because account login is required. |
| Tiny Startups | Tally form requires submitter first name, last name, and X username; not submitted under the no-personal-name rule. |
| Stremit | Free submission path redirects to a login/magic-link flow; not submitted. |
| AI Tools Directory | The usable route is `/submit-tool`, but the page explicitly rejects AI-written/copied content; skipped until the project owner provides human-written unique copy. |
| OpenAIToolsHub | Free AI directory form exists, but is protected by reCAPTCHA; not submitted. |
| ImgToolsHub | Submit route redirects to login; not submitted. |
| Webwiki | Cloudflare challenge blocks the submit flow; not submitted. |
| Dang.ai | Submit flow contains reCAPTCHA and paid/fast-track signals; not submitted. |
| Alternative.me | Account required; not submitted. |
| TechDirectory | Account/registration and reCAPTCHA signals; not submitted. |
| SaaS AI Tools | Signup and reCAPTCHA required; not submitted. |
| OpenUpvote | Submit route exposes login-only flow; not submitted. |
| StillUp.to | Submit route redirects to Google OAuth; not submitted. |
| YourAITool | Submit routes returned `410 Gone`; not submitted. |
| AllinAI.tools | Submit routes returned `404`; not submitted. |

## New Quality Targets

These are worth doing, but may still require account confirmation:

| Resource | Why it is relevant | Blocker |
| --- | --- | --- |
| Launching Next | Free startup/project submission, human review, no reciprocal requirement observed. | Requires submitter name and email; Cloudflare/browser challenge may block raw HTTP. |
| AI Respo | Free manual AI directory, no paid feature requirement observed. | Requires name and email. |
| AITrove | Curated AI tools directory with manual review. | Requires email; likely browser/JS form. |
| AI Review Battle | Free AI review/directory submission with manual review. | Requires email. |
| AIToolsMarketer | Free AI software/tool submission; marketing-oriented audience. | Requires email. |
| AlternativeTo | High-quality software alternatives graph; strong long-term backlink potential. | Requires account and product fit review. |
| Product Hunt | High-authority launch platform with real audience. | Requires account and launch strategy; should not be used as a casual backlink drop. |
| Uneed | Product Hunt alternative with active maker audience. | Requires account. |
| BetaList | Startup validation audience. | Requires submitter identity/email and product/startup positioning. |
| Crunchbase | Company/profile authority and entity signal. | Requires account and organization details. |
| Startbase | German startup ecosystem platform. | Requires registration; best fit only if Utildesk has a real company/startup profile. |
| OMR Reviews | German software discovery/review ecosystem. | Vendor/profile process, likely manual contact. |
| Capterra / GetApp / Software Advice | High-quality software directories. | Vendor onboarding; Utildesk may need to be positioned as a software product, not only a content directory. |
| G2 / TrustRadius | High-quality review platforms. | Vendor onboarding and customer review process. |
| Crozdesk / SaaSworthy / Tekpon | Software discovery platforms. | Vendor/contact flow and product fit review. |

## Paid Or Reciprocal Targets To Avoid Unless Approved

| Resource | Current finding |
| --- | --- |
| TAAFT / There's An AI For That | Paid listing starts at about $49; free path is a monthly X thread, not direct submission. |
| Futurepedia | Paid listing packages; basic was shown as sold out during check. |
| Toolify | Paid listing around $99. |
| TopAI.tools | Paid listing around $47. |
| AITools.fyi | Fast-track redirects to paid BoostMyTool flow around $30. |
| Cite.sh | Paid AI citation listing around $29. |
| LaunchDirectories | Free plan requires adding their badge; paid plan removes badge. |
| Fazier | Free plan requires backlink/embed badge; paid plan removes backlink requirement. |
| TheToolsVerse | Free plan requires reciprocal backlink in footer. |
| Submit25 / BacklinkRocket | Submit25's own listing requires paid BacklinkRocket bundle. |

## Rejected During Search

| Resource | Reason |
| --- | --- |
| ModeCollapse | Domain appears parked/expired via Parklogic script rather than a real submission page. |
| ai.toolsbundle.com | HTTP showed an expired-domain page; HTTPS failed. |
| GlowHaven | Looks like a broad low-signal AI-tools page; not a priority for a clean backlink profile. |
| mystartups.de | Has startup listing but site also surfaces backlink-marketplace style signals; not a first-wave target. |

## Safe Submission Copy

Short headline:

```text
Curated AI tools directory and practical automation guides
```

Short description:

```text
Utildesk is a curated German-first directory for AI tools, automation,
productivity workflows, and practical editorial guides, with an English layer
for international readers.
```

Long description:

```text
Utildesk helps people discover and compare AI tools, automation software, and
productivity resources without ad-heavy noise. The site combines a curated
tools catalogue with practical Ratgeber guides, structured data, sitemap
hygiene, machine-readable feeds, and English pages under /en/ for international
readers. It is useful for founders, operators, marketers, and builders who want
to find reliable AI and automation tools faster.
```

## Next Required Input

Use the public imprint contact for no-account editorial forms:
`outcome_washed828@simplelogin.com`. For submitter/name fields, use only
`Utildesk` or `Utildesk Team`. If a platform requires a real personal name,
skip it and mark it as blocked unless the project owner explicitly approves
that submission.
