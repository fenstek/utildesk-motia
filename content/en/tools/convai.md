---
slug: convai
title: Convai
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "AI Chatbots"
price_model: Freemium
tags: [ai, chatbot, game-development, voice]
official_url: "https://convai.com/"
description: "Convai builds interactive AI characters for games, virtual worlds, and embedded voice or text dialogue, with a clear boundary between a prototype and an operable application."
popularity: 0
tier: D
generated_at: 2026-05-11
source_language: de
translation: full
updated_at: 2026-07-14
---
# Convai

Convai is a platform for interactive AI characters, not primarily a conventional website support bot. Teams define a character’s personality, backstory, knowledge, voice, and actions, then bring it into a scene through the Playground, Avatar Studio, web integrations, or game-engine plugins. That makes it relevant for NPCs, immersive demos, simulations, and voice-enabled avatars. The important boundary is that a convincing Playground conversation does not prove stable production behaviour, predictable latency, controlled costs, or a reliable fallback path.

<figure class="tool-editorial-figure">
  <img src="/images/tools/convai-editorial.webp" alt="Virtual character connecting speech, knowledge, and actions inside an interactive 3D scene" loading="lazy" decoding="async" />
</figure>

## Who is Convai for?

Convai fits game studios, XR and simulation teams, and developers who want to give a character text or voice interaction inside Unity, Unreal, or a web experience. It can also make sense for a small proof of concept such as a virtual guide or role-play training scene. Teams that only need a rule-based FAQ, a helpdesk form, or a conventional phone bot should first evaluate a product designed around that workflow.

## What needs to be configured?

The Convai Playground is where a character gets its description, personality, language, and voice. The Knowledge Bank stores text knowledge that can be connected to a character; the documentation currently describes TXT uploads and recommends resetting a chat session after changing its knowledge. Backstory and Knowledge Bank serve different purposes: backstory establishes the role and world, while a knowledge source supplies concrete domain information. Actions connect dialogue to the scene, for example by allowing movement or interaction with objects.

## A practical path from prototype to scene

Start with one character and one bounded goal. For example, an NPC might explain three locations and send unknown questions to an in-game menu. Collect typical, ambiguous, adversarial, and out-of-scope inputs before adding more features. Once text dialogue behaves acceptably, add voice, animation, and scene objects. In Unity or Unreal, the engine components, avatar, animation controller, interactable objects, and navigation still have to work together. A character understanding “go to the gate” will not move correctly unless the action, scene setup, and navigation mesh are configured and tested as one system.

## Integration and operations

Convai documents Unity and Unreal plugins as well as web and PlayCanvas integrations. Its Core APIs cover character creation and configuration, while Interaction APIs handle text or audio input and return text or audio responses. Keep API keys in a protected server-side or runtime environment, never in a public client bundle. Versioning, chat history, and evaluation support comparisons, but they do not replace automated tests or human review for risky dialogue. A public application also needs timeouts, rate-limit handling, offline behaviour, and a comprehensible fallback when the service or a model is unavailable.

## Evaluate the experience, not the demo

Define a test set of realistic questions, deliberate misunderstandings, and boundary cases before rollout. Measure grounded answers, unsupported claims, voice clarity, response latency, cost per session, and the rate of clean handoffs to another UI or a human. For actions, check that only approved objects and movements are triggered. Record each character version and compare it with the previous one before widening access. Improvisation is part of an NPC experience, but it is not a substitute for factual or safety controls.

## Privacy, rights, and governance

Convai’s Privacy Policy describes account, communication, device, usage, and interaction data, and says personal information may be transferred to facilities and servers in the United States. It refers to commercially reasonable safeguards, but that is not a blanket compliance approval for every organization. Do not place unnecessary personal or confidential information in a Knowledge Bank or test conversation. European deployments should review purpose, legal basis, retention, data-subject rights, subprocessors, and whether a DPA is required. Convai’s Terms also generally require attribution for applications made available to third parties unless that requirement is waived in writing or replaced by an agreement.

## Pricing and real operating costs

Convai offers a Free entry level and paid creator/developer tiers; its official pricing page currently lists Indie Dev, Professional, Scale, and Business with monthly and discounted annual displays. The tiers differ in areas such as interaction quotas, monthly active end users, Knowledge Bank size, versioning, APIs, evaluation, voices, and cloud or avatar capabilities. The pricing FAQ says unused interactions do not roll into the next billing period. Budget for sessions, voice and third-party provider usage, engine development, infrastructure, moderation, support, and ongoing backstory and knowledge maintenance—not just the subscription. Enterprise data and service commitments need to be checked separately against the written offer.

## Editorial Assessment

Convai is recommended for teams building an interactive character as part of a game, simulation, or immersive web experience and already able to handle engine or API work. It creates value when there is a clear character brief, a bounded scene, testable actions, and an owner for content and operations. A narrower alternative is usually better for a factual FAQ, a tightly controlled support flow, or a dialogue system that must run under stronger self-managed control. The decision test is concrete: does Convai improve interaction in a small scene without the cost, privacy exposure, and maintenance burden outweighing the experience gain?

## Alternatives

- [Dialogflow](/en/tools/dialogflow/): Better suited to structured customer-service and voice flows with intents, webhooks, and explicit conversation control rather than scene-based character behaviour.
- [Botpress](/en/tools/botpress/): A practical option for visual AI-agent workflows, knowledge sources, and integrations in a cloud chatbot process.
- [Rasa](/en/tools/rasa/): The stronger direction when dialogue logic and operations should live more fully in code and under the team’s control.
- [Character AI](/en/tools/character-ai/): Closer to accessible character conversations and role-play; its control model is different from building a production scene you own.
- [Unity](/en/tools/unity/): The broader engine foundation when world building, animation, physics, and platform deployment matter more than a hosted conversation service.

## FAQ

**Do I need programming skills to use Convai?**

The Playground is enough for creating a first character and running basic tests. Once a project needs a plugin, custom actions, API calls, authentication, or failure handling, the team needs development skills for the chosen runtime.

**Can Convai use our existing company knowledge?**

Yes. The documentation describes adding text to the Knowledge Bank and connecting it to characters. That does not guarantee accurate answers: sources still need cleanup, changes need ownership, and responses need testing against a defined set of questions.

**Is Convai automatically privacy compliant for a public application?**

No. The Privacy Policy describes processing and US servers, while legality depends on the deployment, data, and legal basis. The operating organization remains responsible for minimization, review, and contractual checks.

**How do I put a Convai character into a game?**

Convai documents plugins for Unity and Unreal plus web integrations. The team must also configure and test the avatar, animations, actions, scene objects, and—where navigation is involved—a suitable navigation mesh.

**When is a Convai pilot ready for production?**

Not when one demo conversation looks good. Look for repeatable tests showing acceptable latency and cost, grounded knowledge, allowed actions, defined fallbacks, and named content ownership. Expand the audience only after those criteria hold for a bounded scene.
