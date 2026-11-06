---
slug: amazon-bedrock-agentcore-browser
title: Amazon Bedrock AgentCore Browser
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-11-06
editorial_status: "manual_polished"
editorial_batch: "2026-11-06-full-tool-card-editorial"
editorial_verdict: caution
editorial_verdict_headline: "With caution: verify a read-only flow first"
editorial_verdict_text: "The documented isolation, Live View, and IAM controls fit portals without a suitable API. Start with a bounded read-only run, then verify permissions, network access, result quality, and costs in the target account."
editorial_trust_label: "3 / 5 · check"
category: AI Infrastructure
price_model: Nutzungsbasiert
tags:
  - aws
  - browser automation
  - ai agents
  - infrastructure
official_url: "https://aws.amazon.com/bedrock/agentcore/"
description: "An isolated browser runtime for agents, with session controls, live viewing, optional recording, and configurable AWS permissions and network access."
translation: full
updated_at: 2026-11-06
---
# Amazon Bedrock AgentCore Browser

Amazon Bedrock AgentCore Browser gives AI agents a managed isolated browser runtime for navigating websites, completing forms, and collecting information. It removes much of the work involved in operating browser containers, but it does not remove the uncertainty of web automation: target sites, permissions, confirmations, and failure paths still need explicit controls.

<figure class="tool-editorial-figure">
  <video autoplay muted loop playsinline loading="lazy" preload="none" width="1280" height="720" poster="/images/tools/amazon-bedrock-agentcore-browser-editorial.webp" aria-label="Browser panels softly fade in and out around a compass in an isolated cloud browser scene.">
    <source src="/videos/tools/amazon-bedrock-agentcore-browser-motion-9c2b06a7c60e4ccb.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
    <img src="/images/tools/amazon-bedrock-agentcore-browser-editorial.webp" width="1280" height="720" alt="Isolated cloud browser session with agent controls, live viewing, and restricted network access" loading="lazy" decoding="async" />
  </video>
</figure>

## What is AgentCore Browser for?

Amazon Bedrock AgentCore Browser runs an agent's web interactions inside an isolated cloud-browser session. It is relevant to AWS teams when a portal lacks a suitable API and the session needs to fit their permission and operations model. The browser carries out interactions; it does not verify a value's business meaning or make a follow-on action safe.

For a stable, documented API, first check whether it covers the required task. Browser automation is appropriate when the web interface is the actual access path, such as bounded research or a supervised back-office workflow.

## What makes up a browser session?

AWS offers a managed browser for quick setup and custom browser resources for settings such as execution roles, network access, and session recording. The application starts an isolated session with a timeout. Live View lets an authorized operator observe and, when needed, interact with the running browser. Recording is available for custom browsers and is stored in your S3 bucket. [AWS documents the managed and custom browser options, Live View, and recording](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html).

## What does a safe read-only workflow look like?

Consider checking a record in a customer portal. The input is a record ID and a separate portal account with read access. The application starts a session with a timeout suited to the task and grants only the browser and AWS permissions it needs. Playwright connects through the allowed portal domain, reads the status and date, and returns structured fields with the source URL and retrieval time.

The automation does not click “Submit,” “Approve,” or similar controls. A person compares the fields with the source page or Live View and confirms the record; missing or ambiguous values remain unverified. If the run reaches an unexpected domain, expired login, CAPTCHA, or changed page, it stops instead of guessing at more clicks. The application then explicitly stops the session. AWS documents both manual stopping and termination after the configured timeout ([session fundamentals](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-resource-session-management.html), [managing sessions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-managing-sessions.html)).

## What belongs to the browser, model, and orchestrator?

The browser resource supplies the execution environment and session connections. The model interprets the task and can propose next steps. The agent application or orchestrator decides when to invoke the browser, which domains are allowed, what output format is expected, and where human approval is required. None of these components turns a plausible extraction into a verified business outcome by itself.

For DOM navigation, forms, and extraction, Playwright can use the WebSocket endpoint over the Chrome DevTools Protocol (CDP). `InvokeBrowser` adds operating-system-level mouse, keyboard, and screenshot actions for cases such as native dialogs outside the DOM. This is a different control surface, not a promise of more reliable agent decisions ([AWS on CDP and OS actions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-invoke.html)).

The API defines `PUBLIC` and `VPC` as network modes. A customer-managed proxy is configured separately for a session; it is not a third mode. That browser-level proxy setting does not enforce network-layer egress. VPC may be needed for private access and controlled routing. If a VPC session also needs public portals, its routes may require a NAT gateway; a public subnet alone does not provide internet access according to AWS ([network modes](https://docs.aws.amazon.com/bedrock-agentcore-control/latest/APIReference/API_BrowserNetworkConfiguration.html), [VPC access](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html), [browser proxies](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-proxies.html)).

## How should reliability and result quality be evaluated?

A test set should include ordinary pages, delayed loading, expired authentication, dialogs, pagination, empty results, and changed selectors. Compare extracted fields with known reference values, and track safe stops and unnecessary actions as well as completion. For any write workflow, check every step against duplicate actions and keep irreversible submission behind explicit human approval.

Screenshots and replay help with diagnosis but do not prove that a result is correct. Evaluate browser mechanics separately from model decisions, and watch for timeouts, retries, and target-site changes. An agent can draw the wrong conclusion even when the browser works as configured.

## What are the security and privacy boundaries?

Isolation separates the browser session from its host, but it cannot stop an agent from following misleading instructions on an allowed website. Treat page content as untrusted input. Limit IAM to the required browser actions and AWS resources, use a separate portal identity with appropriate read access, and define allowed domains and egress rules. Keep credentials in an approved secret flow rather than in the prompt.

Browser profiles can preserve cookies and `localStorage` across sessions. Changes persist only after an explicit save operation; sessions using a profile remain independent, and expired website cookies do not become valid again because they are stored in a profile. IAM controls access to profile resources, so treat profiles as credentials and store only the state the workflow needs ([AWS on browser profiles](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-profiles.html)).

Live View, screenshots, and recordings may expose confidential portal data. Set their purpose, access roles, S3 access, and retention before enabling them. CloudTrail records API calls, not the business correctness or legality of an outcome.

## What does AgentCore Browser cost?

AWS bills browser CPU by actual use and memory by the peak used, in per-second increments across the session. During I/O wait, CPU charges can fall to zero when no background process uses CPU; that does not make memory or other resources universally free. The [current AWS pricing page](https://aws.amazon.com/bedrock/agentcore/pricing/) also lists S3 storage for profiles and network transfer as possible charges.

Depending on the setup, costs can also come from the model, AgentCore Runtime or Gateway, CloudWatch, recordings, network transfer, and customer-managed proxy or NAT infrastructure. Region, account, and configuration determine the actual bill, so a local total cannot be promised without those details. Stop sessions, measure cost per reviewed task, and estimate the additional AWS resources separately.

## Editorial Assessment

**Editorial verdict: With caution.** AgentCore Browser fits AWS teams whose portal has no suitable API and who can configure isolated sessions, IAM, network rules, and human review. Begin with read-only work and require a traceable review before enabling writes. For stable API access, use the direct interface; for browser scripts that the team operates itself, consider Playwright; for a hosted browser outside this AWS integration, consider Browserbase.

## Alternatives

- [Browserbase](/en/tools/browserbase/): Hosted browser infrastructure for teams that want to run browser sessions outside their AgentCore environment.
- [Playwright](/en/tools/playwright/): Code-driven browser automation when the team wants to control the runtime and operations itself.
- [Puppeteer](/en/tools/puppeteer/): JavaScript control for Chromium tasks that do not need AgentCore session management.
- [Browser Use](/en/tools/browser-use/): A Python library for browser agents when the team wants to assemble agent logic and browser operations in its own stack.

## FAQ

**What does the browser do, and what remains with the model or orchestrator?**

The browser carries out navigation and interactions in the session. The model interprets the task; the agent application sets rules, chooses calls, checks structured results, and requests approval when needed. A successful browser action is not proof of a correct result.

**Can a person observe a running session?**

Yes. Live View shows the session in real time and supports direct interaction. Restrict access to roles that are authorized to see the data displayed there.

**Why are both CDP and OS actions available?**

CDP controls DOM-based navigation and forms. OS actions can also reach native dialogs, keyboard shortcuts, or the full screen. They cover cases the browser DOM does not expose.

**Does isolation replace a security review?**

No. It separates the session from its host but cannot prevent content on an allowed website from misleading the agent. IAM, domain and egress rules, human approval, and data retention still need attention.

**How can login state carry across sessions?**

A browser profile can store cookies and `localStorage`. This happens only after an explicit save; new sessions load the saved state independently, and website cookies can expire. Protect profiles with IAM.

**Is a proxy a separate network mode?**

No. AgentCore Browser has `PUBLIC` and `VPC` modes; proxy settings are configured separately on a session. Internet access from a VPC may require NAT, while a browser proxy alone does not enforce network-layer controls.

**Is the browser session free while it waits?**

Not in every respect. Under AWS's current model, CPU use may stop billing during I/O wait, while memory and other services can still incur charges. Check pricing for your region and account.
