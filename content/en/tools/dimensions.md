---
slug: dimensions
title: Dimensions
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: AI Research
price_model: Je nach Plan
tags:
  - research
  - publications
  - analytics
official_url: "https://www.dimensions.ai/"
description: "Dimensions links publications, grants, patents and other research data for discovery, context analysis and repeatable bibliometric workflows."
popularity: 0
tier: C
source_language: de
translation: full
generated_at: 2026-05-15
updated_at: 2026-07-14
---
# Dimensions

Dimensions is a linked research information platform for teams that need to examine literature together with grants, patents, datasets, clinical trials and policy documents. Its practical role is research discovery and context analysis; it is not a substitute for methodological appraisal of a study or for an institution’s research information system. The free version is intended for personal, non-commercial use, while Dimensions Analytics and its data products provide broader access under a product and licensing arrangement.

## Who is Dimensions for?

Dimensions fits researchers, universities, libraries, funders, publishers, corporate R&D and life-science teams. It is most relevant when the question goes beyond “find papers”: Which funders support a topic, which patents or trials connect to a publication, and how is a research landscape changing? A lightweight search service may be better for one-off source discovery. Recurring landscape analysis, research evaluation and funding monitoring need explicit criteria, reproducible searches and the right access level.

## What data and components are included?

Depending on access, Dimensions links publications and citations with datasets, grants, patents, clinical trials and policy documents. The platform provides full-text and title/abstract search, filters and analytical views; additional products cover workflows such as reviewer finding, landscape discovery and reporting. Metadata can be exported for analysis and reference workflows. Links between records add context, but they do not prove that items are equivalent or causally related: teams still need to check records, affiliations, citation meaning and source coverage.

<figure class="tool-editorial-figure">
  <img src="/images/tools/dimensions-editorial.webp" alt="Research archive with connected citations and a bibliometric compass" loading="lazy" decoding="async" />
</figure>

## A practical research workflow

1. Define the question, population, time range and document types before searching. A broad keyword is not a review protocol.
2. Search full text or title/abstract, then apply discipline, organization, funder and date filters. Save the query logic.
3. Open important records in context: citing and cited work, related grants, patents, clinical trials and datasets.
4. Export only the metadata needed for the next step. Record the date, query, filters, licence and manual duplicate checks.
5. Have a second person sample-check results against original publications and primary sources before producing rankings, funding decisions or public claims.

## Integration and operations

The web application is enough for individual discovery. Institutional access can use options such as IP allowlisting, proxy access and single sign-on, according to the provider’s access model. For recurring pipelines, the Analytics API, CRIS API and, where contracted, Dimensions data on Google BigQuery can move data into existing systems. These are not automatically included with a free account. Production use therefore needs an API owner, secret management, quota and cost monitoring, an export convention and a plan for schema or version changes. The DSL release notes show that fields can evolve or be deprecated.

## Evaluation and quality control

Do not judge Dimensions by hit count. Build a test set of known publications, grants and organizations before rollout. Measure relevant-result precision, the share of records checked, time to a defensible answer and query reproducibility. Citation and attention indicators are signals of visibility, not direct measures of research quality. Systematic reviews, patent decisions and funding assessments require domain rules, primary sources and known coverage gaps to be documented separately.

## Security, privacy and governance

Do not use the platform as a repository for confidential grant applications, unpublished manuscripts or personal research notes until the contract and data flow have been reviewed. The provider’s privacy policy describes account, usage and publicly available research information, security measures and retention, and notes US-based business and infrastructure components plus international transfers. Organizations should clarify SSO, roles, administrator access, export rights, DPA/contract terms and deletion procedures. API and data licences also determine whether outputs must remain internal and what attribution or redistribution is permitted.

## Pricing and total cost

The free Dimensions access is for personal, non-commercial use and is narrower than Analytics in content, export, search and integrations. Dimensions Analytics, APIs, BigQuery data, modules and custom implementations are offered according to organizational needs; the provider directs commercial users to a demo or quote. Budget for more than seats: include SSO and IT operations, API engineering, BigQuery or export charges, data maintenance and subject-matter quality control. A useful quote request specifies document types, queries, user roles and how results may be reused.

## Editorial Assessment

Dimensions is recommended for research and innovation teams that repeatedly need context beyond publications and are willing to document queries, metrics and source checks. Its value appears when linked research data improves a concrete decision, such as funding monitoring, landscape analysis or a traceable portfolio review. For occasional searching, a small personal literature project or an openly oriented API workflow, Semantic Scholar, Lens.org or Google Scholar may be a better first choice. Dimensions earns its place when the additional context and institutional workflow justify the licence and verification effort.

## Alternatives

- [Semantic Scholar](/en/tools/semantic-scholar/): A free, AI-supported literature search for fast paper discovery and citation context without the full Dimensions data graph.
- [Lens.org](/en/tools/lens-org/): A good fit when scholarly publications and patents need to be searched together for intellectual-property research.
- [Scopus](/en/tools/scopus/): A commercial bibliometric database for institutional evaluation, citation analysis and standardized reporting.
- [Clarivate Analytics (Web of Science)](/en/tools/clarivate-analytics/): Relevant for organizations already using Web of Science for established analysis and evaluation workflows.
- [Google Scholar](/en/tools/google-scholar/): A low-friction, broad literature search for individuals, with less controlled filtering and bibliometric workflow support.

## FAQ

**Is Dimensions free to use?**

The free version is intended for personal, non-commercial use and focuses on publications, citations and connected context data. Institutional or commercial Analytics, API and data access follows different conditions.

**What is the difference between Dimensions Free and Dimensions Analytics?**

Analytics expands the content, filters, exports, analytical views and institutional access options. Grants, patents, clinical trials, policy documents and API or BigQuery access depend on the product and contract.

**Can Dimensions replace Scopus or Web of Science?**

Not automatically. Coverage, data models, metrics and licence terms differ. Run a controlled test with known records and compare the result with the evaluation standard used by your institution.

**Can I put Dimensions data into my own application?**

Only if the specific API or data agreement permits it. Check allowed use, rate limits, attribution, storage and redistribution before implementation; the free Metrics API access is explicitly tied to non-commercial conditions.

**How reliable are citation and attention metrics?**

They help analyze visibility and research connections, but do not by themselves measure quality, relevance or societal value. Combine them with subject-matter review and transparent criteria.

**What should a team avoid entering without review?**

Confidential applications, unpublished results and personal working notes should stay out until data flow, contract, roles and deletion are clear. Public metadata still comes with licence and usage rules.
