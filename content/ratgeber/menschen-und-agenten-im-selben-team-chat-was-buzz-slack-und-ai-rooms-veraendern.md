---
slug: "menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern"
title: "Um zwei Uhr nachts antwortet der Agent – aber wer gab ihm die Rechte"
date: 2026-07-27
updated: 2026-07-28
category: "Einordnung"
eyebrow: "Team AI"
excerpt: "Buzz setzt Menschen und Agenten in denselben Arbeitsraum. Die entscheidende Grenze verläuft jedoch nicht beim Chat, sondern zwischen sichtbarer Aktion und tatsächlich erteilter Handlungsbefugnis."
readTime: 6
coverImage: /images/ratgeber/menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern-cover.webp
secondaryImage: /images/ratgeber/menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern-workflow.webp
tags:
  - "AI Agents"
  - "Collaboration"
  - "Teamwork"
  - "Open Source"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein Agent im Team-Chat ist kein besserer Bot, sondern ein Teilnehmer mit Kontext, Rechten und einer sichtbaren Verantwortungskette."
  - "Buzz setzt auf einen offenen, selbst hostbaren Raum; Slack bringt Agenten in einen reifen Enterprise-Workflow mit Admin- und App-Regeln."
  - "AI Rooms funktionieren erst dann, wenn Menschen sehen können, wer etwas ausgelöst, geprüft und freigegeben hat."
relatedTools:
  - title: "Slack"
    href: "/tools/slack/"
  - title: "Google Chat"
    href: "/tools/google-chat/"
  - title: "Microsoft Teams"
    href: "/tools/microsoft-teams/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "ChatGPT"
    href: "/tools/chatgpt/"
  - title: "GitHub Codespaces"
    href: "/tools/github-codespaces/"
decisionTools:
  - title: "Slack"
    href: "/tools/slack/"
    note: "die pragmatische Wahl, wenn Agenten in bestehende Kanäle, Freigaben und Enterprise-Integrationen passen sollen"
    score: "8.5"
    kind: "recommend"
  - title: "Google Chat"
    href: "/tools/google-chat/"
    note: "sinnvoll, wenn Teamräume, Dateien und Berechtigungen bereits im Google-Workspace liegen"
    score: "8.0"
    kind: "caution"
  - title: "Microsoft Teams"
    href: "/tools/microsoft-teams/"
    note: "stark im Microsoft-Umfeld, aber Agenten brauchen klare App-, Daten- und Freigabegrenzen"
    score: "8.1"
    kind: "caution"
decisionAvoid:
  - "jeden Agenten automatisch in jeden Kanal einzuladen"
  - "Chat-Historie, Tool-Rechte und Produktionsfreigaben als dasselbe Vertrauensniveau zu behandeln"
  - "einen offenen Agentenraum mit einem unbeaufsichtigten Automationskonto zu verwechseln"
decisionNote: "Der wichtigste Architekturentscheid ist nicht die Chat-Marke. Es ist die Frage, welche Aktionen ein Agent im Raum auslösen darf, wie seine Quellen sichtbar werden und wer vor einem schreibenden Schritt stoppt."
---
Es ist zwei Uhr nachts, derselbe Fehler taucht wieder auf und niemand erinnert sich an die Lösung. Im Zukunftsbild des Open-Source-Projekts Buzz reicht eine Frage im Projekt-Channel: Ein Agent durchsucht sechs Monate Verlauf, holt frühere Ursachen und Reparaturen hervor und bietet an, die damals beteiligte Person zu alarmieren. Buzz beschreibt hier keinen nachgewiesenen Kundenfall, sondern eine Produktvision. Trotzdem trifft die Szene einen wunden Punkt moderner KI-Arbeit: Das Wissen wäre vorhanden, nur liegt es verstreut in Chats, Git, CI und privaten Assistentenfenstern.

Block baut Buzz deshalb nicht als weiteren Bot im Seitenpanel. Menschen und Agenten sollen dieselben Räume benutzen. Die entscheidende Frage lautet damit nicht mehr: „Wie gut antwortet der Bot?“ Sie lautet: Was ändert sich, wenn der Agent dort sitzt, wo die Arbeit entschieden wird – und dort nicht nur schreibt, sondern Repositories öffnet, Patches sendet, Workflows startet und andere Agenten hinzuholt?

Die technische Idee hinter Buzz ist ungewöhnlich konsequent. Nachrichten, Reaktionen, Workflow-Schritte, Review-Freigaben und Git-Ereignisse landen als signierte Events in einem Nostr-Relay. Ein Feature-Branch kann zu einem Raum werden: Der Patch erscheint, CI meldet sich, ein Agent prüft den ersten Stand und die Merge-Entscheidung bleibt neben den Belegen lesbar. Statt sieben Oberflächen nachträglich miteinander zu verkleben, setzt Buzz auf ein gemeinsames Ereignisprotokoll.

Das löst ein echtes Problem. Arbeit in privaten KI-Chats ist für Kollegen unsichtbar. Später sieht man vielleicht den fertigen Code oder die versendete Präsentation, aber nicht die Abzweigungen, verworfenen Vorschläge und Freigaben, die dorthin geführt haben. In Buzz besitzt der Agent einen eigenen Schlüssel, eigene Channel-Mitgliedschaften und eine eigene Audit-Spur. Seine Beiträge verschwinden nicht hinter dem Konto des Menschen, der ihn gestartet hat.

![Eine redaktionelle Collage zeigt Menschen und abstrakte Agenten-Symbole auf einem gemeinsamen Kommunikationspfad zwischen Archiv, Stadt und Repository](/images/ratgeber/menschen-und-agenten-im-selben-team-chat-was-buzz-slack-und-ai-rooms-veraendern-workflow.webp)

[Slack](/tools/slack/) bewegt sich aus der entgegengesetzten Richtung auf einen ähnlichen Punkt zu. Dort kommen Agenten als Apps in bestehende Gespräche und Channels und bleiben unter den App- und Administrationsregeln des Workspace. Buzz versucht dagegen, Chat, Agent, Workflow und Git von Anfang an auf dasselbe Protokoll zu setzen. Das eine Modell integriert Agenten in ein etabliertes Haus; das andere baut das Haus um sie herum neu.

Bis hierhin klingt die gemeinsame Oberfläche fast wie die Lösung. Dann kommt der Haken: Sichtbarkeit ist nicht dasselbe wie Handlungsbefugnis. Ein signiertes Event zeigt, welcher Schlüssel etwas getan hat. Es beweist aber weder, dass dieser Schlüssel die Aktion ausführen durfte, noch dass ein Mensch ihre Folgen verstanden hat. Ein sauber protokollierter Fehler bleibt ein Fehler.

Ausgerechnet bei den Workflow-Freigaben ist Buzz noch nicht am Ziel. Das Projekt führt Approval Gates selbst unter den Funktionen, die noch verbunden werden; die Infrastruktur ist vorhanden, die Integration aber nicht fertig. Diese Offenheit ist sympathisch. Sie markiert zugleich die Grenze zwischen einer starken Architekturidee und einem System, auf das man bereits eine verbindliche Freigabekette stützen könnte.

Für einen echten Einsatz braucht der gemeinsame Raum deshalb drei unterscheidbare Zustände. Der Agent darf etwas vorschlagen. Eine benannte Person oder Regel darf es freigeben. Erst danach darf eine getrennte Identität die Aktion ausführen. Im Verlauf müssen diese drei Schritte auch später noch auseinanderzuhalten sein. Ein Daumen-Emoji ist nur dann eine Freigabe, wenn vorher feststeht, für welche konkrete Aktion, Version und Reichweite es gilt.

Damit wird auch klar, was sich durch einen Agenten im Team-Chat wirklich ändert. Er kann Wissen aus der privaten Schublade holen, Arbeitsschritte sichtbar machen und Entscheidungen mit ihren Belegen verbinden. Das ist mehr als ein besserer Chatbot. Doch zum belastbaren Teammitglied wird er nicht dadurch, dass er im selben Channel schreiben darf. Er wird es erst, wenn der Raum seine Handlungen nicht nur erinnern, sondern im entscheidenden Moment auch begrenzen und stoppen kann.

## Quellen

- [Block Buzz auf GitHub](https://github.com/block/buzz)
- [Slack: Mit AI-Agenten arbeiten](https://slack.com/help/articles/33076000248851-Work-with-AI-agents-in-Slack)
