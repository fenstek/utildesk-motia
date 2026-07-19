---
slug: firebase-studio
title: Firebase Studio
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: "AI Infrastructure"
price_model: Freemium
tags: [ai, app-builder, cloud-development, firebase]
official_url: "https://firebase.studio/"
description: "A cloud development environment with Gemini and Firebase integration for existing workspaces; creation is disabled and shutdown is scheduled for March 2027."
translation: full
updated_at: 2026-07-19
---
# Firebase Studio

Firebase Studio is a browser-based cloud development environment with a code editor, terminal, previews, Gemini assistance, and Firebase deployment paths. Its product status is now the defining boundary: new sign-ups and workspaces were disabled on June 22, 2026, and the environment is scheduled to shut down on March 22, 2027. This card is therefore relevant to operating and migrating existing workspaces, not to selecting a platform for a new project.

## What Firebase Studio is and who can still use it

Existing users can open their current workspaces and continue developing, testing, and deploying applications until the shutdown date. Code view provides a cloud-hosted environment with customizable Nix configuration. The App Prototyping agent turns text, images, or sketches into a blueprint, code, and preview; that flow targets web applications and can no longer create a new workspace.

Firebase services such as Authentication, Cloud Firestore, and App Hosting are not being retired with Studio. The development environment is the affected product. According to Google, already deployed applications continue to run as long as their Firebase and Cloud resources are operated correctly outside Studio.

## Components in the workflow

A workspace combines Code OSS, a terminal, source control, web or Android previews, Open VSX extensions, and Gemini features. Projects can originate from GitHub, GitLab, Bitbucket, or an archive. Nix describes system packages and tooling. Firebase's Local Emulator Suite can test Firebase-facing behavior, while deployment may use App Hosting, Firebase Hosting, Cloud Run, or custom infrastructure depending on the application.

<figure class="tool-editorial-figure">
  <img src="/images/tools/firebase-studio-editorial.webp" alt="Browser development workspace with code, preview, cloud components, and a highlighted migration path" loading="lazy" decoding="async" />
</figure>

The App Prototyping agent and Gemini can write code and invoke tools. Their output still requires review: the official guidance warns that generated results can appear plausible while being incorrect and should not be used untested in production.

## A practical workflow for existing workspaces

1. Inventory source code, Git remotes, connected Firebase projects, hosting backends, domains, environment variables, and billing accounts.
2. Back up the workspace to a private Git repository or use the supported zip export. Be aware that the Prototyping agent may create local commits after its responses.
3. Run tests against emulators or separate projects, and validate Security Rules, authentication flows, and hosting configuration independently of the Studio preview.
4. Select a destination: Google AI Studio for browser-based prototyping or Google Antigravity for local, code-first agent work.
5. Migrate early, test the destination, and only then treat the old workspace as disposable.

Chat history is not automatically part of the standard code export. If it is needed for audit or design evidence, preserve the documented files separately and classify sensitive prompts like other project data.

## Migration, deployment, and operations

Google provides a guided transfer to Google AI Studio. Teams that need to retain an existing App Hosting URL should synchronize code through GitHub and recreate environment configuration in Firebase. Keys must not enter the repository; Secret Manager is more appropriate when granular access control is required.

The Antigravity path exports the workspace and opens it locally. The Firebase CLI can transform certain project types, but it may not update every framework completely. Preview, build, authentication, rules, domains, and deployment all require another test after migration. Google's timeline says any Studio data left behind will be permanently deleted on March 22, 2027.

## Evaluation and the production boundary

A generated preview is not production evidence. Convert requirements into tests, review the data model and Security Rules separately, exercise failures in emulators, and reproduce deployments from Git. AI features also need checks for prompt injection, unsuitable output, rate limits, and cost.

Portability is another acceptance criterion: can the application start, build, and deploy without the Studio workspace? Are secrets, APIs, and cloud resources documented? A project that can be recovered only through the current browser surface has not completed its migration.

## Security, privacy, and governance

Google advises users not to put personally identifiable information or user data into Gemini chat. `.aiexclude` can keep selected files out of Gemini context, and Git-ignored files are excluded from indexing. These controls do not replace data classification because source code, prompts, screenshots, and logs can still contain confidential material.

An automatically generated Gemini API key may be stored in a workspace `.env` file. Remove it before Git synchronization and recreate it as an environment variable or managed secret at the destination. Workspace sharing, Firebase IAM, billing access, and deployment permissions should be separated and granted with least privilege.

## Cost and transition effort

Existing Studio workspaces remain accessible without a separate Studio charge. Costs can still come from Google Developer Program Premium, Gemini or other model usage, and enabled Firebase or Google Cloud services. App Hosting and related integrations may require Cloud Billing; linking an account can move the Firebase project to the usage-based Blaze plan.

Migration work, temporary dual operation, regression testing, and replacement subscriptions are now more relevant than former workspace quotas because no new Studio workspace can be created.

## Editorial Assessment

We recommend Firebase Studio only to teams that must stabilize and migrate an existing workspace. It provides short-term value when the current environment is still working, the code is independently backed up, and there is a committed transition plan to Google AI Studio, Antigravity, or another development setup.

New projects should choose a platform with an ongoing product future. Existing teams should also stop treating Studio as the sole source for code, secrets, or deployment knowledge; success is a tested export and migration, not more work accumulated before shutdown.

## Alternatives

- [Google AI Studio](/en/tools/google-ai-studio/): Google's designated path for browser-based prompt prototyping and the most direct destination for Prototyper projects.
- [Replit](/en/tools/replit/): A browser development and deployment environment for teams that need new cloud workspaces rather than a retiring product.
- [StackBlitz](/en/tools/stackblitz/): A focused option for fast web prototypes and reproducible browser environments.
- [CodeSandbox](/en/tools/codesandbox/): An alternative for isolated development, reviews, and shared web projects without relying on Firebase Studio.

## FAQ

**Can I create a new Firebase Studio workspace now?**

No. New sign-ups and workspace creation have been disabled since June 22, 2026. Existing workspaces remain accessible until the announced shutdown and should be migrated now.

**Will deployed Firebase apps stop in 2027?**

Not merely because Studio ends. Core Firebase services and already deployed apps are separate. Still verify billing, backend resources, domains, secrets, and a deployment process that no longer depends on Studio.

**Which migration destination is a better fit?**

Google AI Studio fits browser-based prompt prototyping, while Google Antigravity targets local code-first and agentic workflows. Choose based on how the project is actually maintained, not the name of its previous workspace.

**Is a GitHub export a complete backup?**

No. Inventory cloud projects, hosting configuration, Security Rules, domains, environment variables, billing, and any required chat evidence. A successful restore and deployment test in the target environment is the dependable proof.
