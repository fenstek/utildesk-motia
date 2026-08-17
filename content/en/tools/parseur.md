---
slug: parseur
title: "Parseur"
updated_at: 2026-08-17
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-08-17
editorial_status: manual_polished
editorial_batch: 2026-08-17-ocr-document-rewrite
category: "Automatisierung"
price_model: "Abonnement"
tags: [pdf, email-parser, data-extraction, automation, no-code]
official_url: "https://parseur.com/"
description: "Parseur accepts emails, attachments and files such as PDFs, spreadsheets and images, then turns them into structured data. Uploads, dedicated mailboxes and an API can feed downstream automation."
created_at: 2026-05-10
popularity: 0
tier: A
lastReviewed: 2026-08-17
translation: full
---
# Parseur

Parseur is a mailbox-centred parser for email, attachments, and recurring documents. An incoming item is assigned to a mailbox, a visual parser or AI instructions turn it into fields, and the result leaves through webhooks, exports, or automation platforms. That shape is different from a general-purpose OCR training service.

<figure class="tool-editorial-figure"><img src="/images/tools/parseur-editorial.webp" alt="Parseur mailbox with parser fields flowing into an automation" loading="lazy" decoding="async" /></figure>

## Mailbox and API intake

Create a mailbox for a supplier or document stream and send email, files, or text to the appropriate address. The current API can manage mailboxes, fields, webhooks, and documents, while template creation remains a visual-editor activity. This split matters when editors maintain parsing rules but engineering owns delivery monitoring.

## Fields and changing layouts

Model the fields the destination actually needs rather than exporting every character. Test different senders, attachments, tables, and empty values in the editor. If suppliers use incompatible layouts, separate parsers or explicit rules are easier to operate than one schema that hides the distinction.

## Asynchronous processing

An accepted upload means receipt, not completed parsing. Webhooks are the practical push path for production; polling a document or downloading mailbox-level exports are alternatives. Receivers should acknowledge quickly, store the document identifier, and make retries idempotent.

## Exports and automation

Parseur offers mailbox-level CSV, JSON, and Excel downloads and connects to Zapier, Make, n8n, and Power Automate. A custom service can use the REST API, API key, logs, and a controlled webhook endpoint. Download URLs contain a secret and must not leak into tickets, browser history, or public logs.

## Verification and limits

Compare extracted values with the original message and attachment, especially totals, date formats, and repeated rows. Check that the document entered the right mailbox before triggering a downstream action. Parseur structures the data; approval, deduplication, and accounting rules belong to the receiving system.

## Privacy and operations

Define retention, roles, API-key handling, and treatment of personal attachments before forwarding real mail. Monitor webhook failures, rate limits, parser edits, and undeliverable messages. A secret export URL deserves the same care as an authentication token.

## Pricing and fit

Plan costs around the subscription, processed-document volume, and automation or export paths required. Compare the current Parseur pricing page with mailbox volume and review effort. Parseur is compelling when email intake is the centre of the process; [mindee](/en/tools/mindee/) or [google-document-ai](/en/tools/google-document-ai/) offer a different developer and processor model.

## Editorial assessment

Parseur suits teams that want to connect recurring email fields quickly through a visual parser. That convenience still creates template-maintenance work when suppliers change. Stable zonal rules or a large accounts-payable review operation may point to [docparser](/en/tools/docparser/) or [rossum](/en/tools/rossum/) instead.

## Alternatives

- [docparser](/en/tools/docparser/): Layout and rule-based extraction with visible crops, keywords, and table rules.
- [nanonets](/en/tools/nanonets/): Model, classification, and routing workflows for business documents.
- [mindee](/en/tools/mindee/): Developer APIs and SDKs rather than a mailbox-first setup.
- [google-document-ai](/en/tools/google-document-ai/): Processor infrastructure with Google Cloud governance.

## FAQ

**Does a successful upload mean parsing is finished?**

No. Parseur processes asynchronously. Use a webhook, status retrieval, or an export, and make the receiving service safe against late and repeated deliveries.

**Can the API create parsing templates?**

The API manages items such as mailboxes, fields, documents, and webhooks. Current documentation describes template creation and editing as visual-editor work.

**How should export URLs be protected?**

Treat them as credentials because they can provide data directly. Keep them out of public logs and restrict every place where a generated URL is stored.

**When is Parseur a poor fit?**

It is a weaker choice when the application needs its own models, deep classification, or a tightly controlled processing region. A processor or developer API with the required governance may fit better.
