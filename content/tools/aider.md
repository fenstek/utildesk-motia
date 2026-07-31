---
slug: aider
title: Aider
editorial_reviewed: true
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-31
editorial_status: manual_polished
editorial_batch: 2026-07-31-story-card-refresh-20
category: Entwickler-Tools
price_model: Je nach Plan
description: Terminal-first Coding-Agent für repository-bewusste Änderungen, Refactoring, Tests und Git-basiertes Review mit frei wählbaren Modellen.
tags: [ai, coding, cli, developer]
official_url: "https://aider.chat/"
popularity: 77
tier: A
lastReviewed: 2026-07-31
updated_at: 2026-07-31
mentionedIn: ["ai-launch-und-distribution-die-neue-tool-schicht-fur-den-erfolg-nach-dem-build", "browser-agenten-im-praxistest-wo-automation-hilft-und-wo-sie-gefahrlich-wird", "e2a-open-source-email-gateway-for-ai-agents-so-gelingt-der-einsatz-in-der-praxis", "ist-deine-website-bereit-fur-ki-agenten-so-gelingt-der-einsatz-in-der-praxis", "ki-orchestrierung-die-neue-workflow-ebene-in-der-softwareentwicklung", "multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein", "pandaprobe-was-das-tool-im-alltag-wirklich-taugt", "wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax", "wispr-flow-im-vergleich-welche-diktier-app-passt-wirklich-zu-deinem-workflow"]
---
# Aider

## Kurzurteil

Ein Entwickler sitzt im Terminal vor einem Bug, der nur bei einer leeren Konfigurationsdatei auftritt. Er kennt den ungefähren Ort, aber nicht alle Abhängigkeiten. Aider liest nicht einfach das gesamte Repository ungefiltert in einen Prompt. Seine Repository Map verdichtet wichtige Dateien, Klassen und Funktionssignaturen, während der Entwickler die unmittelbar betroffenen Dateien in den Arbeitskontext holt. Nach der Änderung zeigt `/diff`, was passiert ist; ein Test läuft; bei einer falschen Abzweigung kann `/undo` den letzten Aider-Schritt zurücknehmen.

Genau hier liegt der Reiz: Aider fühlt sich weniger wie ein fremdes Chatfenster und mehr wie Pair Programming in Git an. Wir **empfehlen** es für terminalstarke Entwickler, die kleine, kontrollierbare Änderungen bevorzugen und ihr Modell selbst wählen wollen. Wer mit Git, Shell und Diffs nichts anfangen kann, wird mit einem guten IDE-Agenten wahrscheinlich schneller produktiv.

## Was Aider auszeichnet

Aider ist ein Open-Source-Coding-Werkzeug für die Kommandozeile. Es arbeitet direkt in einem Git-Repository, kann mehrere Modellanbieter verwenden und Änderungen an echten Dateien vornehmen. Die Repository Map liefert dem Modell einen kompakten Überblick über zentrale Symbole und Beziehungen, ohne jede Datei vollständig in den Kontext zu legen. Ihr Umfang passt sich an Gespräch und Tokenbudget an.

Git ist nicht nur eine Exportfunktion, sondern Teil des Sicherheitsnetzes. Standardmäßig kann Aider eigene Änderungen mit beschreibenden Commits sichern. Es geht vorsichtig mit bereits veränderten Dateien um; Funktionen wie `/diff`, `/undo`, `/commit` und `/git` machen die Arbeit nachvollziehbar. Auto-Commits lassen sich abschalten, doch dann muss der Nutzer die Trennung seiner Änderungen selbst sauber organisieren.

## Ein realistischer Terminal-Ablauf

Vor dem Start legt der Entwickler einen neuen Branch an und stellt sicher, dass die bestehende Testsuite grün ist. Er beschreibt nicht „repariere die Konfiguration“, sondern nennt den reproduzierbaren Fehler, das erwartete Verhalten und die Grenze: keine Änderung am öffentlichen Format. Zunächst soll Aider die Ursache erklären und die betroffenen Stellen nennen.

Erst nach dieser kurzen Analyse werden die relevanten Dateien hinzugefügt. Aider schreibt einen fehlschlagenden Test und danach den kleinsten Fix. Der Entwickler liest den Diff, führt den gezielten Test und anschließend die angrenzende Suite aus. Wenn Aider nebenbei eine unnötige Umbenennung eingebaut hat, wird nicht der ganze Vorschlag weggeworfen: Die Änderung wird präzise korrigiert oder zurückgenommen.

Der Ablauf bleibt bewusst handwerklich. Aider spart Such-, Tipp- und Umsetzungszeit, aber der Entwickler sieht weiterhin Branch, Dateien, Diff, Tests und Commit. Für viele Teams ist genau diese Sichtbarkeit wertvoller als maximale Autonomie.

## Für wen ist Aider geeignet?

- Entwickler, die ohnehin viel im Terminal und mit Git arbeiten
- Maintainer, die KI-Änderungen als kleine, überprüfbare Diffs behandeln wollen
- Teams, die verschiedene Modelle oder Anbieter ausprobieren möchten
- Entwickler in großen Repositories, die einen kompakten Überblick über relevante Symbole benötigen
- Open-Source- und Einzelprojekte, in denen ein schlanker CLI-Workflow besser passt als ein neuer Editor

Aider ist weniger geeignet für Nutzer ohne sicheren Git-Workflow oder für Aufgaben, bei denen niemand Tests ausführen und fachliche Auswirkungen beurteilen kann.

<figure class="tool-editorial-figure">
  <img src="/images/tools/aider-editorial.webp" alt="Illustration zu Aider: Pair-Programming im Terminal mit Aufgabenboard und Code-Kontext" loading="lazy" decoding="async" />
</figure>

## Typische Einsatzszenarien

- **Begrenzte Bugfixes:** Ursache untersuchen, reproduzierenden Test ergänzen und einen kleinen Fix erstellen.
- **Refactoring:** Eine klar definierte Schnittstelle über mehrere Dateien ändern und die Folgen im Diff prüfen.
- **Tests und Dokumentation:** Fehlende Tests, Typen, Kommentare oder Migrationshinweise ergänzen.
- **Repository-Erkundung:** Über die Repository Map Beziehungen zwischen wichtigen Symbolen verstehen.
- **Modellvergleich:** Dasselbe Workflow-Muster mit unterschiedlichen Modellen und Kostenprofilen erproben.
- **Pair Programming:** Fragen, Planung und Codeänderung im gleichen Terminal-Kontext halten.

## Stärken

- Terminal-first und eng mit einem normalen Git-Workflow verbunden
- Repository Map liefert nützlichen Gesamtzusammenhang bei kontrolliertem Kontext
- Modell- und Anbieterwahl verhindert eine harte Bindung an eine einzige Plattform
- Diffs, Commits und Undo-Funktionen machen Änderungen gut überprüfbar
- Open-Source-Werkzeug mit umfangreicher Konfiguration

## Grenzen und Risiken

- Qualität und Kosten hängen stark vom gewählten Modell und vom bereitgestellten Kontext ab
- Standardmäßige Auto-Commits sind hilfreich, können aber Teams mit anderer Commit-Politik überraschen
- Ein großer oder unklarer Auftrag erzeugt auch im Terminal große, schwer prüfbare Änderungen
- Befehle, Tests und generierter Code können Nebenwirkungen haben; Shell-Ausführung braucht Aufmerksamkeit
- Ohne Git- und CLI-Erfahrung ist die Lernkurve höher als bei einer integrierten Editoroberfläche

## Workflow-Fit

Aider passt gut zwischen Issue und Pull Request. Der beste Auftrag enthält Fehlerbild, Ziel, Nicht-Ziele und einen Testbefehl. Zuerst verstehen, dann Dateien auswählen, danach ändern: Diese Reihenfolge begrenzt Kontext und verhindert, dass ein Agent unnötig durch das Repository wandert.

Teams sollten entscheiden, ob Auto-Commits erwünscht sind, ob Hooks mit `--git-commit-verify` laufen müssen und welche Modelle für welchen Code zugelassen sind. Ein zweiwöchiger Pilot sollte akzeptierte Änderungen, Review-Zeit, Modellkosten und zurückgenommene Vorschläge messen.

## Datenschutz & Betrieb

Welche Daten das Repository verlassen, hängt vom gewählten Modellanbieter und der Konfiguration ab. Quellcode, Logs, Geheimnisse und Testdaten sollten vorab klassifiziert werden. `.aiderignore`, ein begrenzter Dateikontext und providerbezogene Richtlinien helfen, ersetzen aber keine bewusste Freigabe.

API-Schlüssel gehören in eine Secret-Verwaltung und nicht in die Chat-Historie oder Repository-Dateien. Bei lokal oder selbst gehostet betriebenen Modellen bleibt mehr Kontrolle im eigenen Umfeld, allerdings trägt das Team dann auch Betrieb, Modellqualität und Ressourcenbedarf.

## Preise & Kosten

Aider selbst ist Open Source. Die laufenden Kosten entstehen typischerweise durch den gewählten Modellzugang oder die eigene Infrastruktur. Ein preiswerter Modellaufruf ist nicht automatisch günstiger, wenn mehr Korrekturen nötig sind. Sinnvoll ist deshalb die Kennzahl „Kosten pro akzeptierter Änderung“ statt „Kosten pro Token“.

**Zum Anbieter:** https://aider.chat/

## Alternativen

- [OpenAI Codex](/tools/openai-codex/): Wenn Coding-Aufgaben als umfangreichere Agentenläufe über lokale und Cloud-Arbeitsflächen bearbeitet werden sollen.
- [GitHub Copilot](/tools/github-copilot/): Wenn IDE- und GitHub-Integration sowie zentrale Teamsteuerung Priorität haben.
- [Cline](/tools/cline/): Wenn ein offener Coding-Agent mit expliziten Tool-Freigaben im Editor gesucht wird.
- [OpenHands](/tools/openhands/): Wenn Repository-Aufgaben in einer stärker autonomen Software-Agenten-Umgebung laufen sollen.
- [Cursor](/tools/cursor/): Wenn ein KI-nativer Editor besser zum Team passt als ein Terminal-first-Workflow.

## Redaktionelle Einschätzung

Aider ist überzeugend, weil es die Kontrollflächen nicht versteckt. Repository-Kontext, Dateien, Diff, Tests und Commits bleiben sichtbar. Das macht das Werkzeug nicht fehlerfrei, aber gut anschlussfähig an vernünftiges Engineering. Der ideale Aider-Task ist klein genug, dass ein Mensch ihn vollständig versteht, und groß genug, dass die gesparte Such- und Schreibarbeit zählt.

**Redaktioneller Verdict:** Empfohlen für erfahrene Terminal- und Git-Nutzer, die Modellfreiheit und nachvollziehbare Änderungen schätzen. Mit Vorbehalt für unerfahrene Teams oder Repositories ohne Tests und klare Ownership.

## FAQ

**Was ist Aider genau?**

Ein Open-Source-Coding-Werkzeug für die Kommandozeile, das mit KI-Modellen an Dateien in einem Git-Repository arbeitet.

**Was ist die Repository Map?**

Eine kompakte Karte wichtiger Dateien, Klassen, Funktionen und Signaturen. Sie gibt dem Modell Überblick, ohne das gesamte Repository vollständig in jeden Prompt zu kopieren.

**Welche Modelle unterstützt Aider?**

Aider kann mit unterschiedlichen Modellanbietern und lokalen Angeboten arbeiten. Die aktuelle Kompatibilitätsliste steht in der offiziellen Dokumentation.

**Warum erstellt Aider Commits?**

Die Git-Integration macht Änderungen nachvollziehbar und erleichtert Rücknahme und Review. Auto-Commits können bei Bedarf deaktiviert werden.

**Was macht `/undo`?**

Der Befehl nimmt die letzte von Aider erzeugte Änderung zurück. Vor der Nutzung sollte trotzdem der aktuelle Diff geprüft werden.

**Ist Aider kostenlos?**

Die Software ist Open Source. Für genutzte Cloud-Modelle können API-Kosten anfallen; lokale Modelle verursachen eigene Infrastrukturkosten.

**Kann Aider in einem schmutzigen Repository arbeiten?**

Ja, es behandelt vorhandene nicht commitete Änderungen bewusst und kann sie standardmäßig separat sichern. Teams sollten dieses Verhalten vorab verstehen und konfigurieren.

**Ist Aider für große Repositories geeignet?**

Die Repository Map hilft bei großen Codebasen. Aufgaben sollten dennoch begrenzt und die unmittelbar relevanten Dateien bewusst gewählt werden.

**Ersetzt Aider Tests?**

Nein. Es kann Tests schreiben und ausführen helfen, aber das Team muss Abdeckung, Aussagekraft und Nebenwirkungen bewerten.

**Wann ist Aider keine gute Wahl?**

Wenn niemand Git sicher beherrscht, Tests fehlen oder große Änderungen ohne menschliches Review direkt übernommen werden sollen.
