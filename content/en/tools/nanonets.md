---
slug: nanonets
title: "Nanonets"
updated_at: 2026-08-17
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-08-17
editorial_status: manual_polished
editorial_batch: 2026-08-17-ocr-document-rewrite
category: "Automatisierung"
price_model: "Je nach Plan"
tags: [ocr, invoice, document-ai, workflow, api]
official_url: "https://nanonets.com/"
description: "Nanonets combines OCR, field extraction and downstream workflow steps for invoices, receipts and other business documents. Its value lies in moving from recognition to review and routing."
created_at: 2026-05-10
popularity: 0
tier: A
lastReviewed: 2026-08-17
translation: full
---
# Nanonets

Nanonets combines document OCR with configurable workflows. Its distinctive shape is the combination of models or workflows that return fields and tables with document classification that can route different classes to different OCR models. That makes it a process component for incoming business documents rather than a plain text-only endpoint.

<figure class="tool-editorial-figure"><img src="/images/tools/nanonets-editorial.webp" alt="Nanonets workflow routing classified documents to OCR models" loading="lazy" decoding="async" /></figure>

## Where it fits

Nanonets can suit accounts payable, receipts, purchase orders, claims, or supplier documents when extracted values still need approval or rejection. Before building automation, define which class goes to which model and which fields must send a file to a human reviewer.

## Models and routing

The API supports OCR predictions for uploaded files or publicly reachable file URLs, with synchronous and asynchronous variants. Longer inputs benefit from an asynchronous job because result retrieval and failures are handled separately. A classification model can label receipts, invoices, and purchase orders, then route them to their respective OCR models.

## Training and fixtures

Build a fixture set for each class with different vendors, scan qualities, and page layouts. Configure fields and tables, train or improve the model, and compare predictions with labelled references. Do not feed corrections into learning or automation until the business reason for each correction is recorded.

## API integration

Nanonets documents its API around an API key sent through Basic Authentication and JSON responses. Your integration needs upload handling, prediction or file identifiers, page-level results, polling or webhook delivery, and a link to an internal document ID. Exporting to a system of record is a separate controlled action.

## Review and failure modes

A value can be syntactically plausible while being wrong for the transaction. Check currency, totals, supplier, purchase-order number, and page context outside the model. Low confidence, an unknown class, or a missing field should create a review task; routing alone is not exception management.

## Operations and data

Document key rotation, roles, retention, and permitted regions before sending invoices or identity material. Monitor API limits, asynchronous jobs, duplicate uploads, and model changes. Keep source files and extracted JSON under deliberate retention rules instead of treating the prediction as the only record.

## Pricing and choice

Check the current Nanonets offer for the model, volume, and workflow features required. Request volume is only one cost driver: review, misclassification, retraining, and integration maintenance also matter. A useful pilot reports correct routing and human minutes per document class.

## Editorial assessment

Nanonets is a good candidate when classification, extraction, and review belong to one incoming-document operation. A developer-owned API surface may be better served by [mindee](/en/tools/mindee/) or [veryfi](/en/tools/veryfi/), while stable layouts with visible rules point toward [docparser](/en/tools/docparser/).

## Alternatives

- [mindee](/en/tools/mindee/): API- and SDK-centred extraction for a custom application.
- [veryfi](/en/tools/veryfi/): A financial-document route focused on receipts and invoice fields.
- [docparser](/en/tools/docparser/): Visible zone, keyword, and table rules for known layouts.
- [rossum](/en/tools/rossum/): Queue and review operations for recurring business documents.

## FAQ

**When should a team use asynchronous OCR?**

Use it for longer or multi-page files when upload, result retrieval, and failure handling should not depend on one open request. The application then needs a durable job identifier.

**Can Nanonets distribute different document classes automatically?**

Yes. A classification and routing model can identify classes and send them to assigned OCR models. Test both normal documents and the incorrect-class route with real incoming samples.

**What should a reviewer inspect?**

Inspect the class, supplier, totals, currency, page context, and internal document identifier, not just one extracted field. This exposes plausible values attached to the wrong workflow.

**What belongs in the pilot budget?**

Include model and volume charges, API operations, review time, retraining, and source-document storage. Cost per successfully approved document is more useful than cost per upload.
