---
slug: "menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern"
title: "At Two in the Morning, the Agent Answers—But Who Gave It Permission"
date: 2026-07-27
updated: 2026-07-28
category: "Analysis"
eyebrow: "Team AI"
excerpt: "Buzz puts humans and agents in the same workspace. The decisive boundary is not the chat interface, but the difference between a visible action and genuine authority to act."
readTime: 6
coverImage: /images/ratgeber/menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern-cover.webp
secondaryImage: /images/ratgeber/menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern-workflow.webp
tags:
  - "AI Agents"
  - "Collaboration"
  - "Teamwork"
  - "Open Source"
sidebarTitle: "Bottom line"
sidebarPoints:
  - "An agent in a team chat is not just a better bot. It is a participant with context, permissions, and a visible chain of responsibility."
  - "Buzz takes an open, self-hostable route; Slack brings agents into a mature enterprise workflow with admin and app controls."
  - "AI Rooms work only when people can see who triggered, reviewed, and approved an action."
relatedTools:
  - title: "Slack"
    href: "/en/tools/slack/"
  - title: "Google Chat"
    href: "/en/tools/google-chat/"
  - title: "Microsoft Teams"
    href: "/en/tools/microsoft-teams/"
  - title: "Claude"
    href: "/en/tools/claude/"
  - title: "ChatGPT"
    href: "/en/tools/chatgpt/"
  - title: "GitHub Codespaces"
    href: "/en/tools/github-codespaces/"
decisionTools:
  - title: "Slack"
    href: "/en/tools/slack/"
    note: "the pragmatic choice when agents need to fit existing channels, approvals, and enterprise integrations"
    score: "8.5"
    kind: "recommend"
  - title: "Google Chat"
    href: "/en/tools/google-chat/"
    note: "a natural fit when team spaces, files, and permissions already live in Google Workspace"
    score: "8.0"
    kind: "caution"
  - title: "Microsoft Teams"
    href: "/en/tools/microsoft-teams/"
    note: "strong in a Microsoft environment, but agent apps, data, and approvals still need explicit boundaries"
    score: "8.1"
    kind: "caution"
decisionAvoid:
  - "inviting every agent into every channel by default"
  - "treating chat history, tool permissions, and production approvals as the same trust level"
  - "confusing an open agent room with an unattended automation account"
decisionNote: "The key architecture decision is not the chat brand. It is which actions an agent may trigger, how its sources are exposed, and who stops a write operation before it happens."
---
It is two in the morning. The same failure has returned, and nobody remembers how it was fixed last time. In the future scenario presented by the open-source project Buzz, one question in the project channel is enough: an agent searches six months of history, retrieves the earlier cause and repair, and offers to alert the person involved. Buzz is describing a product vision, not a verified customer incident. Even so, the scene identifies a real weakness in modern AI work: the knowledge exists, but it is scattered across chats, Git, CI, and private assistant windows.

That is why Block is not building Buzz as another bot in a side panel. Humans and agents are meant to inhabit the same rooms. The decisive question is no longer, “How well does the bot answer?” It is this: what changes when the agent sits where work is decided, and can do more than write messages—opening repositories, sending patches, starting workflows, and calling in other agents?

The technical idea behind Buzz is unusually consistent. Messages, reactions, workflow steps, review approvals, and Git events are stored as signed events in a Nostr relay. A feature branch can become a room: the patch appears, CI reports back, an agent reviews the first version, and the merge decision remains readable beside the evidence. Rather than stitching seven interfaces together after the fact, Buzz starts with a shared event log.

That addresses a genuine problem. Work performed in private AI chats is invisible to colleagues. They may eventually see the completed code or the sent presentation, but not the branches, rejected suggestions, and approvals that produced it. In Buzz, an agent has its own key, its own channel memberships, and its own audit trail. Its contributions do not disappear behind the account of the person who started it.

![An editorial collage shows humans and abstract agent symbols sharing one communication path between an archive, a city, and a repository](/images/ratgeber/menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern-workflow.webp)

[Slack](/en/tools/slack/) is approaching a similar destination from the opposite direction. Agents arrive as apps inside existing conversations and channels and remain subject to the workspace's app and administration rules. Buzz instead tries to place chat, agent, workflow, and Git on the same protocol from the beginning. One model moves agents into an established house; the other rebuilds the house around them.

Up to this point, the shared surface almost sounds like the solution. Then comes the catch: visibility is not the same as authority. A signed event shows which key performed an action. It does not prove that the key was entitled to perform it, or that a person understood the consequences. A perfectly recorded mistake is still a mistake.

Buzz is not yet finished precisely where workflow approvals matter most. The project lists approval gates among the capabilities that are still being wired up: the infrastructure exists, but the integration is incomplete. That candour is welcome. It also marks the boundary between a strong architectural proposition and a system that can already carry a binding approval chain.

A production room therefore needs three visibly different states. The agent may propose an action. A named person or rule may approve it. Only then may a separate identity execute it. The history must preserve those distinctions. A thumbs-up emoji is an approval only when everyone already knows which action, version, and scope it authorises.

This reveals what an agent in a team chat can truly change. It can bring knowledge out of private drawers, make work visible, and keep decisions beside their evidence. That is more than a better chatbot. Yet an agent does not become a dependable teammate simply because it can write in the same channel. It becomes one only when the room can remember its actions—and, at the critical moment, limit or stop them.

## Sources

- [Block Buzz on GitHub](https://github.com/block/buzz)
- [Slack: Work with AI agents](https://slack.com/help/articles/33076000248851-Work-with-AI-agents-in-Slack)
