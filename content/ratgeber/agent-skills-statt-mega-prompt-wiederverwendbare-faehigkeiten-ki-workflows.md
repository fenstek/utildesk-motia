---
slug: "agent-skills-statt-mega-prompt-wiederverwendbare-faehigkeiten-ki-workflows"
title: "Agent Skills statt Mega-Prompt: Wie wiederverwendbare Fähigkeiten KI-Workflows verändern"
date: 2026-08-02
updated: 2026-08-02
category: "Workflow"
eyebrow: "Agenten-Handwerk"
excerpt: "Ein langer Prompt kann Regeln erklären. Ein guter Agent Skill macht aus ihnen einen Ablauf mit Beweisen, Stopps und einem klaren Besitzer."
readTime: 10
releaseOrder: 50
coverImage: /images/ratgeber/agent-skills-statt-mega-prompt-workflow-cover-editorial-v1.png
secondaryImage: /images/ratgeber/agent-skills-statt-mega-prompt-gates-editorial-v1.png
tags:
  - "KI-Agenten"
  - "Agent Skills"
  - "Softwareentwicklung"
  - "Workflows"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein Skill ist kein Aufsatz über Best Practices, sondern ein begrenzter Ablauf mit Eingang, Prüfpunkten und Exit-Kriterium."
  - "Router, progressive Offenlegung und unabhängige Verifikation halten Skills nützlich, wenn ein Projekt mehr als eine Fähigkeit braucht."
  - "Die Investition verschiebt sich: Weniger Prompt-Basteln, mehr Pflege von Besitzern, Versionen, Tests und Verfallsdaten."
decisionNote: "Agent Skills lohnen sich dort, wo ein Team denselben Ablauf wiederholt und das Ergebnis beweisen kann."
relatedTools:
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "Cursor"
    href: "/tools/cursor/"
  - title: "Hermes Agent"
    href: "/tools/hermes-agent/"
  - title: "IBM Bob"
    href: "/tools/ibm-bob/"
  - title: "LangGraph"
    href: "/tools/langgraph/"
---

Montag, 9:12 Uhr. Ein Coding-Agent meldet im Pull Request: „Feature fertig, Tests grün.“ Der Diff sieht plausibel aus. Was fehlt, ist nicht noch ein Absatz im Prompt, sondern die Antwort auf eine unangenehme Frage: Welcher Test beweist, dass der Agent die richtige Datei geändert, den kritischen Pfad ausgeführt und den alten Zustand nicht beschädigt hat?

Genau an dieser unsichtbaren Stelle beginnt die Idee der **Agent Skills**. Sie sollen nicht noch mehr Wissen in ein Modell kippen. Sie sollen eine wiederkehrende Arbeit so beschreiben, dass ein Agent sie in der richtigen Reihenfolge ausführt, an den richtigen Stellen innehält und am Ende Belege ablegt. Der Unterschied zu einem Mega-Prompt ist nicht die Dateiendung. Es ist die Verpflichtung auf einen überprüfbaren Prozess.

## Der unsichtbare Teil der Aufgabe

Ein Mega-Prompt ist zunächst bequem: Standards, Beispiele, Ausnahmen und Teamregeln stehen an einer Stelle. Mit jedem neuen Projekt wächst er jedoch weiter. Der Agent bekommt zwar mehr Kontext, aber nicht automatisch eine bessere Entscheidung darüber, was jetzt relevant ist. Ein Absatz über Code-Reviews kann die Review-Anforderung erklären; er kann aber nicht garantieren, dass vor dem Merge ein unabhängiger Check gelaufen ist.

Ein Skill beginnt deshalb mit einem **Trigger**: Woran erkennt der Agent, dass dieser Ablauf passt? Danach kommen Eingangsdaten, Schritte, Prüfpunkte und ein Ende, das nicht „ich bin fertig“ heißt, sondern etwa: „Testbericht liegt vor, Diff ist auf die erlaubten Pfade begrenzt, Review-Link wurde gespeichert.“ Der Skill beschreibt damit die Arbeit zwischen Absicht und Ergebnis.

Die praktische Konsequenz sieht unspektakulär aus. Ein Release-Skill kann verlangen, dass zuerst die Änderung lokal gebaut, dann die relevanten URLs geprüft und erst danach ein Commit erstellt wird. Ein Daten-Skill kann vor der Analyse die Quelle, den Zeitraum und die fehlenden Werte protokollieren. Die KI bleibt schnell; sie darf nur nicht mehr selbst definieren, was als Beweis gilt.

## Ein Skill ist ein Ablauf, kein Lexikon

Ein nützlicher Referenzpunkt ist die von Addy Osmani beschriebene Organisation in Skills für Spezifikation, Planung, Build, Test, Review und Ship. Entscheidend ist nicht die Liste der Phasen, sondern die Trennung: Ein Router lädt nur den Ablauf, der zur aktuellen Arbeit passt; progressive Offenlegung verhindert, dass der Agent zwanzig Handbücher gleichzeitig im Kopf halten soll. In seinem Beispiel gehören auch Checkpoints, Exit-Kriterien und Gegenargumente gegen typische Abkürzungen zur Datei.

Das ist eine wichtige Grenze. Ein Skill darf kein zweites internes Wiki werden. Wenn er jede mögliche Ausnahme aufzählt, konkurriert er wieder mit dem Mega-Prompt. Die kleinste brauchbare Einheit enthält fünf Dinge:

1. **Wann?** Trigger und Ausschlusskriterien.
2. **Womit?** Erlaubte Eingaben, Werkzeuge und Dateien.
3. **Wie?** Eine kurze Reihenfolge mit einem sichtbaren Checkpoint.
4. **Woran erkennt man es?** Artefakt, Test, Screenshot oder Log als Beleg.
5. **Wann stoppen?** Fehlergrenze, Freigabe und Rückfallweg.

Alles Weitere gehört in eine verlinkte Referenz oder in einen eigenen Skill.

## Was die Beispiele tatsächlich zeigen

Beim Test-Driven Development wird der Unterschied besonders klar. SaturnCI beschreibt einen Skill, der den Agenten in eine SEF-Schleife zwingt: **Specify, Encode, Fulfill**. Erst wird die erwartete Regel formuliert, dann als Test festgehalten, erst danach entsteht der Code. Das ist keine Garantie für gute Tests. Es ist aber eine bessere Arbeitsanweisung als „schreib bitte robusten Code“, weil ein ausgelassener Schritt sichtbar wird.

Auch außerhalb von Code funktioniert das Muster. Das Open-Source-Projekt [text-to-cad](https://github.com/earthtojake/text-to-cad) bündelt domänenspezifische Abläufe für textbasierte CAD-Aufgaben. Ein Agent, der eine Geometrie erzeugen soll, braucht eben andere Eingaben und Prüfungen als ein Agent, der eine API-Änderung vorbereitet. Die Fähigkeit wird dadurch kleiner, nicht größer: Material, Geometrie und Exportregeln gehören in den CAD-Skill, nicht in den globalen Assistenten.

Für den Alltag eines Teams sind [OpenAI Codex](/tools/openai-codex/) und [Claude](/tools/claude/) deshalb interessante Gegenstücke. Sie können dieselbe Markdown-Idee aufnehmen, aber Werkzeuge, Freigaben und Laufzeit unterscheiden sich. Ein Skill sollte die gemeinsame Absicht festhalten und die tool-spezifischen Schritte klar abgrenzen. [Cursor](/tools/cursor/) zeigt in seiner Produktbeschreibung, wie Regeln, Skills, Plugins und MCP-Werkzeuge in einer Entwicklungsumgebung zusammenkommen. Mehr Anschlussmöglichkeiten bedeuten dabei nicht weniger Governance, sondern mehr Stellen, an denen ein Owner prüfen muss, was geladen werden darf.

![Editoriale Illustration: ein heller Papier-Workflow über drei klaren Prüftoren, ohne Text, Logos oder Wasserzeichen](/images/ratgeber/agent-skills-statt-mega-prompt-gates-editorial-v1.png)

## Der Haken: Auswahl ist Teil des Systems

Je mehr Skills ein Team sammelt, desto wichtiger wird die Auswahl. Ein falsch geladener Skill ist kein neutraler Ratschlag. Er kann unnötige Tools freischalten, einen Test für die falsche Umgebung verlangen oder den Agenten mit widersprüchlichen Regeln füttern. [Hermes Agent](/tools/hermes-agent/) macht den Zusammenhang von Memory, Skills und Integrationen sichtbar: Wiederverwendung ist stark, aber schlechte Regeln können sich ebenso dauerhaft einschleifen wie gute.

Die Forschung liefert hier einen nützlichen, aber begrenzten Hinweis. Das Paper *SkillCorpus* berichtet über 821.000 gecrawlte Skill-Kandidaten, die auf 96.401 Einträge reduziert und in 16 Klassen geordnet wurden. In den dort beschriebenen Benchmarks lag der größte gemeldete Zugewinn bei 7,5 Prozentpunkten. Das ist ein Ergebnis dieser Sammlung und dieser Aufgaben, kein Gütesiegel für jeden Skill und kein Versprechen, dass mehr Dateien automatisch bessere Agenten ergeben.

Auch ein Evaluations-Repository wie [agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval) beantwortet zunächst nur die richtige Frage: Wird der Output mit Skill messbar besser als ohne? Vorher-Nachher-Vergleiche müssen dieselbe Aufgabe, dieselben Eingaben und ein festes Urteilskriterium verwenden. Ein Judge-Modell allein ist kein unabhängiger Beweis, wenn niemand die Bewertungsrubrik kontrolliert.

## Die kleinste brauchbare Skill-Datei

Für ein Team würde ich nicht mit einer Bibliothek aus fünfzig Fähigkeiten starten. Nimm einen wiederkehrenden Ablauf, bei dem heute regelmäßig derselbe Fehler passiert. Schreibe den Skill so, dass ein anderer Mensch ihn in zehn Minuten prüfen kann:

- **Owner und Version:** Wer aktualisiert ihn, wann läuft die Version aus?
- **Eingang:** Welche Dateien, Konten und Annahmen sind erlaubt?
- **Aktionen:** Welche Werkzeuge dürfen benutzt werden, welche nicht?
- **Beleg:** Welche Datei, URL, Testausgabe oder Freigabe muss entstehen?
- **Stopp:** Was passiert bei fehlenden Daten, Abweichungen oder einem roten Check?

Danach kommt ein kleiner Gegenversuch: dieselbe Aufgabe einmal mit und einmal ohne Skill. Nicht die Länge des Textes zählt, sondern weniger vergessene Schritte, weniger Nacharbeit und ein Ergebnis, das ein Mensch schneller abnehmen kann. Wenn kein Unterschied sichtbar ist, wird der Skill gekürzt oder entfernt.

[IBM Bob](/tools/ibm-bob/) und [LangGraph](/tools/langgraph/) stehen dabei für zwei verschiedene Ebenen: Der eine bringt Skills in eine Entwicklungsumgebung, der andere macht Zustände, Checkpoints und menschliche Freigaben in einem Workflow explizit. Beides kann sinnvoll sein. Keines ersetzt die Entscheidung, welcher Nachweis für die eigene Aufgabe tatsächlich zählt.

## Die Regel für den nächsten Lauf

Agent Skills sind der Ausweg aus dem Mega-Prompt nur dann, wenn sie Arbeit in überprüfbare Zustände übersetzen. Sie machen aus „sei gründlich“ kein magisches Versprechen, sondern eine Reihe kleiner Fragen: Welche Eingabe ist gültig? Welcher Schritt ist abgeschlossen? Welcher Beleg fehlt? Wer darf fortsetzen?

Das verändert auch die Rolle des Teams. Prompt-Basteln wird kürzer, dafür werden Skill-Reviews, Versionspflege und Auslaufdaten zu normaler Engineering-Arbeit. Der beste Skill ist nicht der längste und nicht der cleverste. Es ist der, den ein Kollege versteht, ein Agent ausführen kann und ein Test jederzeit widerlegen darf.

### Quellen und weiterführende Lektüre

- [Addy Osmani: Agent Skills](https://addyosmani.com/blog/agent-skills/) — Workflow-Phasen, Router, progressive Offenlegung und Verifikation.
- [SkillCorpus, arXiv:2607.15557](https://arxiv.org/abs/2607.15557) — publizierte Korpus- und Benchmark-Auswertung; Zahlen oben sind als Studienergebnis eingeordnet.
- [SaturnCI: My agent skill for test-driven development](https://www.saturnci.com/my-agent-skill-for-test-driven-development.html) — SEF-Schleife und TDD-Erfahrungsbericht.
- [text-to-cad](https://github.com/earthtojake/text-to-cad) — konkretes Beispiel für eine domänenspezifische Fähigkeit.
- [agent-skills-eval](https://github.com/darkrishabh/agent-skills-eval) — Beispiel für Vorher-Nachher-Evaluationen von Skills.
