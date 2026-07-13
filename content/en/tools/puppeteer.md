---
slug: puppeteer
title: Puppeteer
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-tool-quality-campaign-03
category: Developer
price_model: Open Source
tags: [testing, automation, developer-tools, browser]
official_url: "https://pptr.dev/"
popularity: 0
translation: full
---
# Puppeteer

Puppeteer is a JavaScript library for controlling Chrome or Firefox through the DevTools Protocol or WebDriver BiDi. Teams commonly use it for browser tests, screenshots, PDF output, controlled data collection, and repeatable browser flows. It runs without a visible browser window by default, while the same flow can run headed for debugging.

## Who is Puppeteer for?

Puppeteer suits JavaScript and TypeScript teams that want to build browser-level automation into an application or script. It works well for PDF rendering, visual regression work, controlled crawls, and testing Chromium-centred products. Teams needing an extensive runner, reporting, projects, and WebKit support should also evaluate [Playwright](/en/tools/playwright/).

## A sensible first use

Do not start with a huge end-to-end suite. Pick one business-critical journey, such as login plus export, and write a stable test using semantic locators. The test should assert a visible user expectation, not incidental CSS classes or arbitrary delays.

## Browsers and installation

The regular `puppeteer` package downloads a compatible Chrome browser, while `puppeteer-core` uses a browser supplied by the team. Modern package managers can block installation scripts, preventing the browser download. Check this explicitly in CI and onboarding, otherwise the first run fails only in one environment.

## Stability in test operations

Fixed sleeps are the usual source of flaky tests. Wait instead for explicit navigation, an element, or an expected network response. Keep test data controlled and isolate tests that run in parallel. Screenshots, HTML excerpts, and consistent logs help explain a failure rather than rerunning it blindly.

## Limits and security

Puppeteer is not permission to crawl third-party services aggressively or automate browser logins without limits. Respect terms, rate limits, and privacy. Put secrets in the CI secret store, not test code or screenshots. For money, customer accounts, or deletion actions, a test environment and explicit approvals are essential.

## Alternatives to Puppeteer

- [Playwright](/en/tools/playwright/): for a full E2E framework across Chromium, Firefox, and WebKit.
- [Selenium](/en/tools/selenium/): when existing WebDriver infrastructure or many languages are decisive.
- [Cypress](/en/tools/cypress/): for frontend-centred testing with its own developer experience.
- [WebdriverIO](/en/tools/webdriverio/): when WebDriver standards and integrations dominate the stack.

## Editorial assessment

Puppeteer is a precise choice for teams using browser automation programmatically, especially in the Chrome ecosystem. It is less a test-management system than a dependable control library. The best pilot is a small reproducible flow with real failure artefacts and clear ownership.

## FAQ

**Is Puppeteer only for screenshots?**

No. Screenshots and PDFs are common uses, but the library also drives navigation, forms, network activity, and page content for tests and controlled workflows.

**Does Puppeteer always need a visible browser?**

No. Headless is the default. A visible browser can be launched for debugging.

**When is Playwright the better choice?**

When cross-browser testing, an integrated runner, trace inspection, and a broader E2E toolset are the priority.
