# Backlink Outreach Log

Last updated: 2026-05-02

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

## Free Quality Submissions - 2026-05-02

All submissions below used `utildesk@proton.me` where account or email
confirmation was needed. No personal first name or surname was submitted. Use
only `Utildesk` or `Utildesk Team` for name-like fields; keep Proton and any
account credentials in project secrets and never expose or reuse the Proton
password in logs.

| Resource | URL / route | Status | Notes |
| --- | --- | --- | --- |
| ToolNova | https://toolnova.ai/submit-tool | Submitted / pending | Free form accepted and showed the thank-you screen. Category used: `AI Productivity Tools`. Public search did not show a live listing yet. |
| AimyFlow | https://www.aimyflow.com/en/submit | Submitted / pending | Public form POST to `/api/submit` returned `200` with `pending_review`. Public explore search did not show a live listing yet. |
| Tuvavo | https://tuvavo.com/submit-tool | Submitted / pending | Free form accepted and showed review timing of 3-5 business days. Public tools search did not show a live listing yet. |
| AI You Imagine | https://aiyouimagine.com/submit | Submitted / pending | Account was created with email confirmation only, no personal name. Logo upload returned `200`; `ai_tool_submissions` insert returned `201`. Public category page did not show a live listing yet. |
| AIToolboard | https://aitoolboard.com/submit | Submitted / pending | Free listing form showed `Tool submitted successfully! It will be reviewed by our team.` Search currently only echoes the query, so no backlink is confirmed yet. |
| BestAiToolSpot | https://bestaitoolspot.com/submit-ai/ | Email submission sent / pending | Their page requests email submissions. Sent tool details from `utildesk@proton.me` to `hassaan.baits@gmail.com`; no public listing yet. |
| MakerHunt | https://makerhunt.io/project/utildesk | Scheduled / backlink visible | Registered by magic link only, selected the free no-badge `Nofollow Launch`, and scheduled launch for week 2026-W19, May 4-11. Raw public HTML returns `200` and contains `https://tools.utildesk.de/` with `nofollow`. |
| SaaSRow | https://saasrow.com/submit | Submitted / pending | Free tier accepted the URL, fetched site metadata, and created a pending submission. Free listing is advertised as dofollow but expires after 90 days; management-link email endpoint returned `404`, so treat public listing as pending until visible. |
| EarlyHunt | https://earlyhunt.com/project/utildesk | Scheduled / backlink visible | Registered by email magic link only, no personal profile data. Selected free `Nofollow Launch`, no badge required, scheduled week 2026-W34, Aug 17-24. Raw public HTML returns `200` and contains `https://tools.utildesk.de/` with `nofollow`. |
| IndieHunt | https://indiehunt.io/project/utildesk | Scheduled / backlink visible | Registered by email magic link only, no personal profile data. Selected free `Nofollow Launch`, no badge required, scheduled week 2026-W38, Sep 14-21. Raw public HTML returns `200` and contains `tools.utildesk.de` with `nofollow`. |

Follow-up verification on 2026-05-02:

- MakerHunt was the first newly confirmed public backlink from this batch. It
  is nofollow and scheduled for the May 4-11, 2026 launch week, but the public
  project page already contains the Utildesk URL in raw HTML.
- ToolNova, AimyFlow, Tuvavo, AI You Imagine, AIToolboard, and BestAiToolSpot
  did not show a public `tools.utildesk.de` backlink immediately after
  submission. Treat them as moderation-pending, not failed.
- Second-pass checks confirmed EarlyHunt and IndieHunt as additional live
  public nofollow backlinks. SaaSRow submission remains moderation-pending and
  did not expose a public `tools.utildesk.de` backlink yet.

## Blocked Or Failed New Attempts - 2026-05-02

| Resource | Current finding |
| --- | --- |
| ToolJunction | Free listing path requires adding their badge/backlink on the homepage or footer; not submitted. |
| ToolIndex | `toolindex.ai` and `www.toolindex.ai` still returned DNS resolution errors. |
| EveryAI | Requires login and the live site has mixed low-signal/spammy listings; not submitted. |
| Tools AI Online | Submission page is protected by reCAPTCHA and broad ad-consent flow; not submitted. |
| Aindexc | `/submit` returned `404`; no usable submission form found. |
| Aieternals | HTTPS returned SSL/protocol failures and HTTP returned empty response; not submitted. |
| AIToolsMarketer | Form exists, but submit is blocked by reCAPTCHA; not submitted without human captcha handling. |
| AITrove | `/submit` returned `404`; contact form requires first name and last name; not submitted. |
| Launching Next | Submit flow is blocked by a Cloudflare security check; not submitted. |
| AI Respo | `https://airespo.com/submit-ai-tool` returned `404`; not submitted. |
| AI Dreamhub | Submission flow requires either a verification badge/backlink or a paid option; not submitted. |
| Zearches | Public URL submission exists, but directory quality is borderline because of affiliate/ad-heavy signals; skipped unless volume is explicitly prioritized over quality. |
| SaaSCity | Submit flow showed registration/backlink/badge signals; not submitted. |
| ShowMeYour.site | Login, paid, badge, founder identity, and Twitter signals; not submitted. |
| ShowMeYourSaaS | Inspected as a SaaS-directory candidate, but not submitted yet because of quality/identity uncertainty. |
| BetterLaunch | Free dofollow path requires a badge; not submitted. |
| SaaSCubes | Free route showed mutual backlink/badge and founder/Twitter signals; not submitted. |
| Projektify.de | Flow showed captcha/login/register/paid and personal-name/Twitter signals; not submitted. |
| Dofollow.Tools | Form is usable, but the free plan requires adding a dofollow backlink/badge in the site footer; not submitted. |
| ToolDirs | Same submit-template family as Dofollow.Tools; held because the free path is expected to require reciprocal badge/backlink. |
| First Look | Same submit-template family as Dofollow.Tools; held because the free path is expected to require reciprocal badge/backlink. |
| MarketingDB | Free plan requires embedding their badge; premium no-badge route is paid. Not submitted. |
| ListMySaaS | Free plan requires badge verification; premium no-badge route is paid. Not submitted. |
| BuildHop | Signup-only flow found, but no public submit route was available without creating an account first. Not submitted. |
| RaceToShip | Submit route forces login before form access; not submitted in this pass. |
| FutureTools | Public form requires CAPTCHA and a submitter name field; not submitted. |
| SideProjectors | Marketplace/profile flow rather than a clean directory submission; account/profile risk is higher. Not submitted. |
| Aitoonic | Public form exists, but browser automation was redirected to an Access Denied page; not submitted. |

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
| Launching Next | Free startup/project submission, human review, no reciprocal requirement observed. | Cloudflare security check confirmed on 2026-05-02; needs manual browser access if pursued. |
| AI Respo | Free manual AI directory, no paid feature requirement observed from search context. | Submit route returned `404` on 2026-05-02; hold until a valid route is found. |
| AITrove | Curated AI tools directory with manual review. | Submit route returned `404`; contact form requires first name and last name. |
| AI Review Battle | Free AI review/directory submission with manual review. | Requires email. |
| AIToolsMarketer | Free AI software/tool submission; marketing-oriented audience. | reCAPTCHA blocks automated submission; not suitable without human captcha handling. |
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
`outcome_washed828@simplelogin.com`. For account/email-verification flows, use
`utildesk@proton.me` only when the platform does not require personal identity;
keep credentials in project secrets and never reuse or expose the Proton
password. For submitter/name fields, use only `Utildesk` or `Utildesk Team`.
If a platform requires a real personal name, skip it and mark it as blocked
unless the project owner explicitly approves that exact submission.
