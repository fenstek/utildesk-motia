---
slug: firebase-realtime-database
title: Firebase Realtime Database
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Entwickler-Tools"
price_model: "Usage-based"
tags: [database, realtime, cloud, developer-tools]
official_url: "https://firebase.google.com/products/realtime-database"
description: "Firebase Realtime Database is a managed JSON datastore for apps that need to synchronize state, lists, or presence information with low latency across connected clients."
updated_at: 2026-07-14
popularity: 0
tier: "D"
generated_at: "2026-05-18"
translation: full
---
# Firebase Realtime Database

Firebase Realtime Database is a managed JSON datastore for mobile and web applications where several clients need to see the same state quickly. Typical uses include chat messages, presence, live status, and small collaborative interfaces. The core is not a relational table model: it is a JSON tree with listeners, SDKs, and rules. That makes the first release approachable, but it also means that paths, queries, and permissions need deliberate design before production.

<figure class="tool-editorial-figure">
  <img src="/images/tools/firebase-realtime-database-editorial.webp" alt="A team watches connected realtime data flows in a control room" loading="lazy" decoding="async" />
</figure>

## What the product does

The database maintains a connection between an application and the server and notifies registered clients about changes. The SDK supports `set`, `update`, `push`, and transactions for changing one node or several paths. Auto-generated keys are useful for lists and concurrent writes. Firebase manages the database service itself; it does not replace a domain data model, a server-side release process, or an operational owner.

## Data model and queries

All data is stored as a JSON tree. Nesting is possible, but reading a node also reads its children, and an allow rule on a parent path can grant access to the whole subtree. For chats, lists, and relationships, a relatively flat and partly redundant structure is usually safer: metadata, members, and messages live at separate paths and are connected by IDs. Queries can order and limit data using keys or indexed child values, but this is not the join and aggregation model of a SQL database.

## A practical adoption workflow

Start with one real use case, such as presence and messages for a room. Define paths, allowed operations, data ownership, and deletion semantics. Then use the Emulator Suite and integration tests for authentication, invalid payloads, offline transitions, and concurrent changes. Version the `.read`, `.write`, `.validate`, and required `.indexOn` rules and deploy them deliberately. Only after measuring download volume, reconnect behavior, and error handling should the path be opened to production traffic.

## Runtime, offline behavior, and integration

Client SDKs can queue local changes during temporary network loss and synchronize them later. `/.info/connected`, server timestamps, and `onDisconnect` support presence and last-seen features; multi-device sessions and reauthentication still need testing. Firebase Authentication can supply identities to Rules, while App Check adds an attestation layer against abusive clients. Admin SDKs and a REST API support server-side jobs, exports, and migrations. A dependable backup and restore process remains an operational responsibility: Firebase documentation does not recommend using the REST API as a regular backup mechanism.

## Quality and production boundaries

A useful pilot measures more than visible updates: payload size, listener scope, write conflicts, offline recovery, rule coverage, and cost per meaningful user flow. Common failures are structural: large parent reads, uncontrolled fan-out writes, missing indexes, or Rules that accidentally grant an entire subtree. For relational dependencies, advanced search, analytical aggregation, or strongly isolated tenants, another database may require less custom logic. The coupling to Firebase and the work required to migrate out of a JSON tree should also be documented before adoption.

## Security, privacy, and governance

Access is denied by default, but production safety still depends on an explicit review. Realtime Database `.read` and `.write` rules cascade from parent paths and cannot reliably revoke access below a parent that already grants it. `.validate` checks data after a write has been authorized, while `.indexOn` supports query performance. Keep Rules in version control and exercise them with emulator tests. For personal or confidential data, add data classification, retention and deletion rules, regional and contractual review, and a plan for export, incident response, and provider exit. App Check is an additional control, not a replacement for Authentication and Security Rules.

## Costs and ongoing operations

Firebase lists a no-cost Realtime Database allowance on the Spark plan; the current official figures include 1 GB of stored data and 10 GB of downloads per month. On Blaze, that allowance remains and usage beyond it is billed. Firebase currently lists 5 US dollars per GB-month for additional storage and 1 US dollar per GB of downloads; region, traffic patterns, and other Firebase products can change the total. Concurrent connections, listener design, logging, authentication, rules testing, backups, and migration work also belong in the budget. Set budget alerts and run a load test with realistic payloads before moving a live workload to Blaze.

## Editorial Assessment

Firebase Realtime Database is a good fit for a small or medium mobile or web feature that needs a clearly bounded shared live state and a fast delivery path, especially when the team already uses Firebase. Its value comes from simple listener flows, offline behavior, and presence—not from the label “realtime” alone. The decision is sound only when paths, Rules, emulator tests, export and restore, and cost alerts are treated as part of the product. For relational data, sophisticated queries, independent infrastructure, or a strong portability requirement, a narrower alternative is usually the better choice.

## Alternatives

- [Google Cloud Firestore](/en/tools/google-cloud-firestore/): A document-oriented Firebase database with a richer query model when structured documents and filtering matter more than a simple JSON tree.
- [AWS AppSync](/en/tools/aws-appsync/): A managed GraphQL and Pub/Sub interface when clients should select fields across several data sources.
- [Socket.IO](/en/tools/socket-io/): A library for a self-operated backend when the team wants separate control over transport, database, and business logic.
- [Pusher](/en/tools/pusher/): Hosted realtime channels when the requirement is event delivery and durable state will live elsewhere.
- [MongoDB](/en/tools/mongodb/): A document database with a broader query and operating model when persistence and analysis extend beyond live listeners.

## FAQ

**When is Realtime Database a better choice than Cloud Firestore?**

When a flat, shared state with straightforward listeners is the central requirement. Compare Cloud Firestore early if the application needs richer document queries, more elaborate filtering, or a document-oriented model.

**Are the data public by default?**

No. Without rules that grant access, reads and writes are denied. Broad or temporary public rules can still expose data, so Authentication, Rules tests, and a release review need to be handled together.

**How should offline synchronization be tested?**

Test deliberate disconnections, multiple devices, duplicate writes, and app crashes. The team must decide which local change wins, how conflicts become visible, and whether sensitive data may persist on the device.

**Is Realtime Database suitable for relational business data?**

Only for clearly bounded, intentionally denormalized submodels. If joins, complex aggregation, ad-hoc analysis, or cross-entity business transactions are central, evaluate a relational or more query-oriented alternative.

**What should be settled before moving to Blaze?**

Measure payloads and listener scope, run a realistic load test, and configure budget alerts. Include Rules, export and restore, and the usage of other Firebase products in the same cost review.
