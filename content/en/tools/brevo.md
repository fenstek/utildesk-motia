---
slug: brevo
title: Brevo
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Marketing & Vertrieb"
price_model: Freemium
tags:
  - email
  - marketing
  - crm
  - automation
official_url: "https://www.brevo.com/"
popularity: 0
translation: full
description: "Brevo combines campaigns, contact management, automations, and transactional messaging for teams that want to run customer communication as a measurable process."
updated_at: 2026-07-14
---
# Brevo

Brevo is a platform for email campaigns, contact management, marketing automation, and transactional messaging. It fits small and mid-sized teams that want to connect newsletters, forms, events, and follow-ups in one workspace. The important boundary is that Brevo does not replace consent management, data modelling, deliverability work, or human review of critical messages.

<figure class="tool-editorial-figure">
  <img src="/images/tools/brevo-editorial.webp" alt="a vivid mail workshop with segmented envelope routes" loading="lazy" decoding="async" />
</figure>

## Who is Brevo for?

Brevo is a practical candidate for marketers, agencies, shops, and service businesses that want recurring campaigns alongside a CRM-adjacent contact base. A newsletter team can maintain lists and segments, a sales team can track contacts and deals, and a product team can pass order or account events into transactional email. That does not make Brevo a substitute for a specialised data warehouse or a deeply customised enterprise CRM.

## What belongs in the workflow?

The core pieces are campaigns, contacts, segments, automations, and transactional delivery. Campaigns target recipients with the required permission. Automations can react to form submissions, clicks, attributes, or custom events and then update contacts, change lists, or send messages. API, SMTP, and webhooks connect the delivery path to a website, shop, or backend. SMS, WhatsApp, push, chat, and sales features are additional channels or products; availability depends on the relevant product area and plan.

## A workable first rollout

Start with one narrow flow, such as a confirmed signup followed by a welcome message. Define contact attributes, lists, consent evidence, the sending domain, and an owner before building the automation. Then create the message, test links and rendering, and have a second person review recipients and copy. Activate the workflow only after that check. A website or shop integration also needs a documented event schema, API or SMTP credentials, and a test path. Keep a manual fallback for missing events, blocked messages, and contacts that enter the wrong segment.

## Integration and daily operations

Developers should keep API keys separate by environment, send delivery events from webhooks to a controlled endpoint, and attach an internal correlation ID to logs. Brevo documents SDKs and APIs for common languages and webhooks for delivery, opens, clicks, bounces, unsubscribes, and contact changes. A webhook is not a complete monitoring system: the receiving service still needs retry handling, authentication or signature checks, rate-limit awareness, and a rule for which events are retained. Campaigns, templates, and segments should have an owner, purpose, and review or expiry date.

## Quality checks and evaluation

Before sending, check recipients, consent, sender identity, reply-to address, personalisation fields, links, unsubscribe handling, and mobile rendering. Afterward, review delivery, bounces, complaints, unsubscribes, clicks, and the conversion that matters for the workflow. Opens are not a sufficient success metric because tracking can be incomplete and privacy-sensitive. A useful pilot answers three questions: Does a defined action happen more often or faster? Does manual maintenance decrease? Do error and unsubscribe rates remain acceptable? Document that baseline before adding a more complicated journey.

## Privacy, security, and governance

Brevo may act as a processor or controller depending on the operation; the organisation must establish the applicable role, legal basis, and retention period for its own use. Marketing requires a defensible consent and unsubscribe process. Tracking, forms, integrations, and optional third-party features may require additional review. Use task-based permissions, keep API keys out of frontend code, and define export, deletion, retention, and log access rules. Brevo’s Privacy Policy and Data Processing Agreement belong in a vendor review. A GDPR reference on a landing page is not the same as a documented compliant process.

## Pricing and total cost

Brevo has a free entry point and paid plans. The cost structure can depend on email volume, plan level, additional channels, user seats, and optional Sales or Enterprise components. SMS and other credits may be charged separately; pay-as-you-go is a different fit from a recurring monthly plan for a team with irregular sending. Budget for domain and deliverability setup, template maintenance, list hygiene, integration operations, support, and a future export. Plans and included features change, so check the official pricing page for the relevant region and billing interval before committing.

## Editorial Assessment

We recommend Brevo to teams that want to combine email campaigns, straightforward contact processes, and transactional delivery without building a large messaging stack. It creates value when the process is clear, consent records are usable, and someone owns data quality and deliverability. Teams sending one occasional newsletter may prefer a narrower service; teams needing complex CRM objects, deep commerce event analysis, or strict enterprise governance should compare a specialised alternative through a real pilot.

## Alternatives

- [Klaviyo](/en/tools/klaviyo/): Better suited to ecommerce data, event-driven journeys, and revenue-focused segmentation.
- [ActiveCampaign](/en/tools/activecampaign/): A fit when multi-step lead nurturing and CRM-adjacent automation are central.
- [MailerLite](/en/tools/mailerlite/): A leaner option for newsletters, forms, and manageable automations without a broad CRM.
- [HubSpot Marketing Hub](/en/tools/hubspot-marketing-hub/): Useful when marketing must connect closely to a larger HubSpot CRM and reporting setup.
- [Mailchimp](/en/tools/mailchimp/): An alternative for teams prioritising a familiar campaign editor and established marketing routines.

## FAQ

**Is Brevo suitable for a first newsletter pilot?**

Yes, provided the contact source, consent, sending domain, and a small test audience are settled before sending. The free entry point does not remove those responsibilities.

**What is the difference between a campaign, an automation, and transactional email?**

A campaign is planned for a selected audience. An automation reacts to defined contact or event conditions. Transactional email is typically triggered by a concrete action such as an order or password request and can be sent through the API or SMTP.

**Does a website need a custom integration?**

For a simple signup form, a configured Brevo feature may be enough. Orders, account states, and custom events usually call for an API, SMTP, or webhook integration backed by a documented event model.

**How can a team prevent accidental or unlawful sends?**

Use separate lists and consent fields, role-based access, test messages, a two-person review, and explicit rules for unsubscribes and bounces. Define a stop switch and a manual escalation path before activating automation.

**What should be checked before moving to Brevo?**

Check contact and event export, sender and domain requirements, deliverability, API and webhook effort, retention, and ongoing maintenance cost. A small pilot gives more reliable evidence than a feature checklist.
