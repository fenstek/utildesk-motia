---
slug: soapui
title: SoapUI
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-soapui-full-tool-card-editorial"
category: AI Coding
price_model: Freemium
tags:
  - api-testing
  - test-automation
  - developer-tools
official_url: 'https://smartbear.com/product/ready-api/api-functional-testing/'
description: 'Open-source tooling for repeatable SOAP and REST API tests with assertions, test cases, mock services, and a command-line runner.'
popularity: 0
translation: full
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# SoapUI

SoapUI is a desktop open-source tool for functional testing of SOAP, REST, and HTTP services. It is useful when a team needs to turn a WSDL or service contract into repeatable test cases, assertions, and mock responses. A lightweight client is usually faster for one exploratory request; SoapUI earns its place when an interaction must be checked repeatedly and later run from a build.

## Who should use SoapUI?

SoapUI fits QA teams, backend developers, and integration groups working across several service boundaries. It is particularly relevant for SOAP contracts, XML messages, authentication sequences, and regression tests around older or mixed technology stacks. Teams that mainly explore JSON endpoints or share simple requests may find a modern API client easier to adopt. SoapUI asks for more structure: projects, test suites, test cases, properties, and test data need to be maintained deliberately.

<figure class="tool-editorial-figure">
  <img src="/images/tools/soapui-editorial.webp" alt="Illustration for SoapUI: API plumbing lab with test pressure and response valves" loading="lazy" decoding="async" />
</figure>

## What belongs in a project?

A SoapUI project groups services, test suites, test cases, and individual test steps. Requests can carry assertions for HTTP status, XML schema, SOAP faults, XPath, or JSON content. Properties and property expansion keep hosts, IDs, and environment values separate from the request logic. Data-driven flows can loop through values from files or other data sources. Groovy scripts extend the test flow, but they are best reserved for behaviour that cannot be expressed clearly with ordinary test steps.

## A practical testing workflow

Start with a small contract test rather than a large collection of clicks:

- Import a WSDL, an API description, or a known endpoint and choose one representative happy path.
- Add at least one business assertion per request; a successful HTTP status does not prove a correct response.
- Model expired credentials, empty fields, SOAP faults, and malformed responses as explicit test cases.
- Keep environment values and test data outside the project logic and use a safe staging service.
- Run the same project file through the local TestRunner and then in CI, recording exit codes, reports, and the data needed to reproduce failures.

## Mocks, runners, and integration

MockServices simulate SOAP or REST responses before the real implementation is ready. A WSDL can provide the starting point, and responses can be static, sequenced, or selected with scripts. This helps when a client must be developed in parallel with a server or when a rare failure needs a deterministic reproduction. The boundary matters: a mock does not contain the real network topology, data, timeouts, or side effects of a live service. It is therefore not a replacement for a contract test against a realistically operated staging system.

SoapUI includes a command-line TestRunner for running suites or selected test cases from a build job. Maven, Jenkins, or another CI system can call that runner, but the integration still needs explicit team decisions. Test the failure exit code, report location, secret handling, and behaviour when a dependency is unavailable before treating the job as release evidence.

## Quality checks and limits

Good SoapUI suites separate transport, schema, and business assertions. A test that only checks parseable XML will not detect a wrong account balance. Conversely, an assertion on a volatile request ID creates noise. Each test case should state which regression it protects against, what data it needs, and how a failure can be reproduced. Load and security checks also need an approved target, a defined profile, and human interpretation; they are not automatic release approval. Central execution, broad parallelisation, and additional commercial capabilities are a ReadyAPI decision rather than something to assume from the free installation.

## Privacy and operations

API projects easily collect bearer tokens, basic-auth values, customer identifiers, and full XML payloads. Keep them out of Git, screenshots, and exported project files. Use synthetic data, narrow staging permissions, and review which logs and reports become CI artifacts. Groovy adds another operational boundary: file access, database connections, and external calls must be reviewed and installed reproducibly like any other test dependency. Mock services should listen only on controlled interfaces and ports; never present one as a hardened production service.

## Pricing and total effort

The vendor describes SoapUI Open Source as free and open source. That does not remove the cost of CI compute, staging services, test-data maintenance, report retention, and engineering time spent keeping assertions stable. ReadyAPI is the commercial companion with modules such as Test, Performance, and Virtualization; current licensing and pricing should be checked with SmartBear before procurement. For a team comparison, include migration effort, existing SoapUI projects, runner knowledge, and support requirements rather than looking only at the licence label.

## Alternatives

- [Postman](/en/tools/postman/): Easier for modern REST and JSON exploration, collections, and shared request examples; less natural when WSDL and XML regression coverage drive the work.
- [Insomnia](/en/tools/insomnia/): A lean developer-focused client for editing requests and environments without modelling a larger test project.
- [Hoppscotch](/en/tools/hoppscotch/): A browser-oriented route for exploratory HTTP calls and lightweight collaboration, rather than local SOAP project maintenance.
- [Bruno](/en/tools/bruno/): A Git-friendly, file-based API client for teams that want versioned collections and a deliberately local workflow.

## Editorial Assessment

SoapUI is recommended for QA and integration teams that need to exercise SOAP, XML, and repeatable service contracts through a GUI and a TestRunner. It creates value when assertions are meaningful, test data is separated from secrets, and a staging or mock workflow runs regularly in CI. For one-off REST calls, browser-first exploration, or a very lightweight Git collection model, one of the alternatives above is the better choice. Base the decision on protocol mix, existing project files, required CI execution, and maintenance effort rather than on the word "Freemium".

## FAQ

**Can a team use SoapUI for free?**

The open-source edition is described by the vendor as free. CI runners, staging environments, test-data maintenance, and possible ReadyAPI modules still create operational or licensing costs, so review the applicable terms before distributing it widely.

**Is SoapUI only for SOAP services?**

No. It also tests REST and HTTP services. SOAP and WSDL are simply areas where its project model and assertions are especially useful.

**Can a MockService be used in production?**

No. It returns defined test responses and is valuable for client development or failure scenarios, but it does not represent the data, operations, or side effects of a real service completely.

**How do SoapUI tests run in CI?**

Use the bundled command-line TestRunner to launch a project, suite, or test case. Pilot the job with explicit checks for exit codes, report storage, secret handling, and unavailable dependencies before using it as release evidence.
