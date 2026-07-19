---
slug: amazon-bedrock-agentcore-browser
title: Amazon Bedrock AgentCore Browser
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: AI Infrastructure
price_model: Nutzungsbasiert
tags:
  - aws
  - browser automation
  - ai agents
  - infrastructure
official_url: "https://aws.amazon.com/bedrock/agentcore/"
description: "A managed isolated browser runtime for AI agents, with session controls, live viewing, recording, and AWS permission boundaries."
translation: full
updated_at: 2026-07-19
---
# Amazon Bedrock AgentCore Browser

Amazon Bedrock AgentCore Browser gives AI agents a managed isolated browser runtime for navigating websites, completing forms, and collecting information. It removes much of the work involved in operating browser containers, but it does not remove the uncertainty of web automation: target sites, permissions, confirmations, and failure paths still need explicit controls.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-bedrock-agentcore-browser-editorial.webp" alt="Isolated cloud browser session with agent controls, live viewing, and restricted network access" loading="lazy" decoding="async" />
</figure>

## What is AgentCore Browser for?

The service is part of Amazon Bedrock AgentCore but can be integrated as a browser tool in a custom agent architecture. It suits AWS teams that need web interactions to run separately from their own hosts and want to use IAM, CloudWatch, CloudTrail, S3, and established AWS operations. Plausible cases include portal-based research, working with forms that have no suitable API, and supervised back-office processes.

When a stable documented API exists, direct integration will usually be faster, cheaper, and more reliable. AgentCore Browser should fill a real browser-only gap rather than become the default integration mechanism.

## What makes up a browser session?

AWS provides a managed browser for quick setup and configurable custom browser resources. An application starts an isolated session and receives endpoints for automation and Live View. The WebSocket automation endpoint exposes Chrome DevTools Protocol control, which Playwright and agent frameworks can use. A separate InvokeBrowser interface controls mouse, keyboard, and screenshots at the operating-system level for cases such as native dialogs that CDP cannot reach.

Sessions have configurable timeouts. Custom browsers can use dedicated roles, network settings, and session recording to S3. Live View lets an operator watch and, when appropriate, interact with a run. CloudWatch metrics, CloudTrail events, and session replay provide technical evidence, but the application still needs its own record of the business outcome.

## What does a controlled rollout look like?

Choose a reversible flow on one clearly bounded website. Define the initial state, allowed domains, expected pages, stop conditions, and structured result. Create the browser resource with a least-privilege IAM role and choose deliberately among public networking, VPC access, or a customer-managed proxy. Credentials belong in an approved secret flow, not in prompts or session notes.

Test navigation and extraction before enabling a write action. Add one form step next, while submission, purchase, or publication requires human confirmation. The agent application should associate every session with a business task ID, handle timeouts, and stop safely when it encounters an unexpected domain, CAPTCHA, or layout.

## How is it integrated and operated?

The application starts and stops sessions through AgentCore APIs and streams automation commands through the supplied endpoint. Playwright is a practical choice for ordinary DOM actions; OS actions are a focused addition rather than a universal replacement. Teams that require stable source IP addresses can route traffic through their own proxy. Proxy credentials and S3 recordings need separate, narrowly scoped roles.

Operational signals include session duration, concurrency, failure rate, active CPU and memory, and target-site changes. A cleanup process should terminate orphaned sessions. Recording retention must be limited, and Live View should be available only to roles authorized to see the data displayed in the browser.

## How should reliability and quality be tested?

A test set should cover normal pages, delayed content, authentication, modal dialogs, pagination, empty results, and intentionally changed selectors. Measure correct extraction, unnecessary actions, recovery after timeout, and safe failure—not merely task completion. Transactional flows need an idempotency check at each step so a retry cannot create a duplicate booking or message.

Screenshots and replay help diagnosis but are not automatic proof that the result is correct. Compare extracted values with a known reference and evaluate agent decisions separately from browser mechanics. A production candidate also needs realistic concurrency tests and an operating allowance for websites that change without notice.

## What are the security and privacy boundaries?

Container isolation separates browser activity from the host, but it cannot stop an agent from following malicious instructions displayed on an allowed page. Page content is untrusted input. Domain allowlists, egress rules, minimal IAM roles, separate identities, and human approval for irreversible actions reduce exposure. Session cookies and stored profiles are credentials and require suitable protection and deletion controls.

Live View, screenshots, and replay may contain personal or confidential information. Define purpose, storage location, S3 encryption, retention, and access logging before enabling them. CloudTrail records API activity; it does not establish that an agent's business action was lawful or appropriate.

## What does it cost in practice?

AgentCore Browser charges for active CPU and memory used during a session. I/O and idle behavior affect the bill, while exact rates depend on region and the current AWS price list. The model, AgentCore Runtime or Gateway, data transfer, proxy infrastructure, S3 recordings, CloudWatch logs, and metrics can create additional charges.

Measure cost per successful business task rather than per session alone. Short timeouts, controlled concurrency, early failure, and direct APIs for stable substeps reduce consumption. A self-hosted browser cluster may be economical at consistently high utilization, but it adds patching, scaling, and security work.

## Editorial Assessment

Amazon Bedrock AgentCore Browser is a strong fit for AWS-oriented platform teams that need isolated, observable browser interactions governed through IAM. It delivers the most value for changing browser-only interfaces with clear operator oversight. Playwright, Puppeteer, or a direct API is more transparent for simple scraping, local testing, or systems with reliable programmatic interfaces.

## Alternatives

- [Browserbase](/en/tools/browserbase/): A specialized cloud-browser platform when an AWS-native AgentCore environment is not required.
- [Playwright](/en/tools/playwright/): Open-source browser control for teams willing to operate the runtime and scaling layer themselves.
- [Puppeteer](/en/tools/puppeteer/): A leaner JavaScript option for Chromium-focused automation without a managed agent platform.
- [AWS Bedrock](/en/tools/aws-bedrock/): The broader AWS model and agent platform when browser execution is only one part of the architecture.

## FAQ

**Does AgentCore Browser require an Amazon Bedrock model?**

AgentCore is designed for framework and model flexibility. The browser runtime is accessed through APIs, while the model, framework, and orchestration are selected separately.

**Can a person observe a running session?**

Yes. Live View exposes the session in real time and supports direct interaction. Access should be role-restricted because the session may display sensitive data.

**Why are both CDP and OS actions available?**

CDP handles DOM navigation and forms. OS actions also reach native dialogs, context menus, keyboard shortcuts, and full desktop screenshots.

**Does isolation replace a security review?**

No. Isolation protects the host boundary, but websites still provide untrusted content. Permissions, egress, confirmations, and data retention remain operator responsibilities.
