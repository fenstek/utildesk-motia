---
slug: rossum
title: "Rossum"
updated_at: 2026-08-17
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-08-17
editorial_status: manual_polished
editorial_batch: 2026-08-17-ocr-document-rewrite
category: "Automatisierung"
price_model: "Individuelles Angebot"
tags: [ocr, invoice, document-ai, automation, api]
official_url: "https://rossum.ai/"
description: "Rossum is a document AI platform for recurring business documents such as invoices, purchase orders and delivery notes. Its focus is extraction, exception handling and operational review."
created_at: 2026-05-10
popularity: 0
tier: A
lastReviewed: 2026-08-17
translation: full
---
# Rossum

Rossum is a document-automation platform for operational document streams, especially accounts payable. Its distinctive unit is the queue and review workflow: documents are received, classified, extracted, and sent to an operator when an exception needs attention. The resulting data still has to satisfy ERP and approval rules.

<figure class="tool-editorial-figure"><img src="/images/tools/rossum-editorial.webp" alt="Rossum queue showing extracted invoice fields and a review exception" loading="lazy" decoding="async" /></figure>

## Document streams and queues

Define which document types enter which queue and which fields matter there. Invoices, purchase orders, and delivery notes need different controls. A useful queue exposes status, ownership, and next action rather than merely storing a JSON response.

## Extraction and review

Rossum can extract document fields, but an operator still needs to handle uncertain values and business exceptions. Compare totals, suppliers, order references, and tax data with the source document. Corrections should remain traceable and must not silently create a wrong posting.

## A bounded rollout

Start with a narrow supplier or invoice stream and collect real layout variants. Measure field quality, straight-through rate, and review minutes separately. A document can be extracted accurately and still require review because an order is missing or the invoice is a duplicate.

## Integration and ownership

Plan API, exports, webhooks, ERP destination, roles, and escalation together. Someone must own unprocessed queue items; a technical retry must not create a second invoice. Preserve links between the original file, extracted data, and final decision.

## Evaluation and limits

Test poor scans, new suppliers, credit notes, multi-page documents, and missing order numbers. Evaluate classification and routing as well as OCR fields. Rossum does not decide your accounting treatment, tax interpretation, or internal approval matrix.

## Data and pricing

Financial documents need an explicit rule for region, roles, retention, and deletion. Check Rossum's current commercial terms because scope and pricing depend on the process. Budget for review, ERP work, and exception volume in addition to the service itself.

## Editorial assessment

Rossum fits teams that need a visible operational review process for recurring business documents. Teams with their own review UI may prefer [mindee](/en/tools/mindee/) or [veryfi](/en/tools/veryfi/); stable layouts with explicit rules may favour [docparser](/en/tools/docparser/).

## Alternatives

- [mindee](/en/tools/mindee/): Developer API for a custom review and integration surface.
- [veryfi](/en/tools/veryfi/): API-first financial-document extraction for an application you own.
- [docparser](/en/tools/docparser/): Rule-based layout control for known document forms.
- [nanonets](/en/tools/nanonets/): Classification, model routing, and workflow automation.

## FAQ

**When should an invoice enter review?**

When a required field is missing, confidence is insufficient, the purchase-order link fails, or a business conflict appears. Set thresholds from your own labelled fixtures.

**Does Rossum replace an ERP?**

No. It can prepare document data and handle exceptions; vendor master data, coding, approval, and posting remain in the destination process.

**What should a useful pilot measure?**

Track field errors, routing correctness, straight-through rate, review minutes, and duplicate cases. OCR accuracy alone hides operational work.

**When is an API-first alternative preferable?**

When the team already owns the review interface and business rules. A focused extraction API can then provide data without another queue layer.
