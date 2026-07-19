---
slug: swe-agent
title: SWE-agent
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: Entwickler-Tools
price_model: Open Source
tags: [ai, coding-agent, research, developer-tools]
official_url: "https://github.com/SWE-agent/SWE-agent"
description: "Open-Source-Forschungsagent für reproduzierbare Repository-Aufgaben und SWE-bench-Experimente; inzwischen durch mini-SWE-agent abgelöst und nur noch im Wartungsmodus."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# SWE-agent

SWE-agent ist ein quelloffenes Forschungsframework, das Sprachmodelle mit Werkzeugen und einer isolierbaren Repository-Umgebung verbindet, um Issues zu untersuchen und Patches zu erzeugen. Es eignet sich für reproduzierbare Experimente und spezialisierte Agenten-Workflows, ist aber keine aktuelle Standardempfehlung für neue Installationen: Die Maintainer haben mini-SWE-agent als Nachfolger benannt und SWE-agent in den Maintenance-only-Modus versetzt.

## Was ist SWE-agent und für wen?

Das Projekt entstand im Umfeld von Princeton und Stanford und ist eng mit SWE-bench verbunden. Forschende können damit Agentenverhalten, Modelle, Prompts, Toolsets und Umgebungen vergleichen. Engineering-Teams können einzelne Issues oder kontrollierte Batches ausführen, wenn sie bereit sind, Konfiguration, Container, Modellzugang und Auswertung selbst zu betreiben.

SWE-agent nimmt eine Problemstellung und ein Repository entgegen, lässt das Modell innerhalb einer Werkzeugschleife analysieren und bearbeiten und erzeugt am Ende einen Patch samt detaillierter Trajektorie. Das Ergebnis ist ein Kandidat, keine automatisch gültige Fehlerbehebung.

## Welche Komponenten bilden den Agentenlauf?

Der CLI-Einstieg initialisiert eine Umgebung über SWE-ReX und einen konfigurierbaren Agenten. Die Umgebung kann einen lokalen Docker-Container oder ein entferntes Deployment starten. In der Shell stehen Tool-Bundles für Dateiansicht, Suche, Bearbeitung und Bash zur Verfügung. Eine YAML-Konfiguration definiert Modell, Prompts, Parser, Werkzeuge, History-Verarbeitung und Umgebungsaufbau.

<figure class="tool-editorial-figure">
  <img src="/images/tools/swe-agent-editorial.webp" alt="Isoliertes Repository-Labor mit Issue, Agentenaktionen, Teststation und einem separat geprüften Patch" loading="lazy" decoding="async" />
</figure>

Die Historie aus Modellantworten, Aktionen und Beobachtungen wird verarbeitet und wieder als Kontext genutzt. Damit lässt sich ein Lauf nachvollziehen, zugleich wachsen Kontextverbrauch und Datenmenge mit jeder Iteration.

## Praktischer Workflow für einen kontrollierten Lauf

1. Ein Issue mit reproduzierbarem Fehler, Zielverhalten und ausführbarem Test wählen; große Produktanforderungen zuerst zerlegen.
2. Repository und Abhängigkeiten in einem unveränderlichen Containerimage vorbereiten. Nur notwendige Netzwerk- und Secret-Zugriffe freigeben.
3. Modell und YAML-Konfiguration versionieren, Kosten- und Schrittgrenzen definieren und einen einzelnen Lauf starten.
4. Trajektorie, Log, Konfiguration und Patch gemeinsam prüfen. Der Agent darf Tests nicht einfach entfernen oder eine Reproduktion durch eine Scheinlösung ersetzen.
5. Den Patch außerhalb des Agentencontainers auf sauberem Checkout bauen und testen. Erst nach menschlichem Review darf daraus ein normaler Pull Request werden.

Batchläufe sollten erst beginnen, wenn ein einzelner Fall reproduzierbar funktioniert. Sonst multiplizieren sie Setupfehler, Kosten und schwer vergleichbare Ergebnisse.

## Betrieb, Konfiguration und Outputs

Der Befehl `sweagent run` bearbeitet einen Fall, `run-batch` mehrere Instanzen. Das Trajektorienverzeichnis enthält JSON-basierte `.traj`-Dateien, die verwendete Konfiguration und Logs; Batchläufe ergänzen zusammengeführte Vorhersagen und Exit-Status. Inspektoren für Terminal und Browser helfen beim Vergleich der Schritte.

Wichtig ist die Trennung von Ausführung und Bewertung. `run-batch` führt keine vollständige SWE-bench-Evaluation aus; diese ist ein eigener Schritt. Reproduzierbarkeit verlangt neben dem Patch das Containerimage, die exakte Modellbezeichnung, Konfiguration und alle Setupbefehle. Da das Projekt nur noch gewartet wird, sollten neue Anpassungen gegen mini-SWE-agent geprüft werden, bevor weitere eigene Tool-Bundles entstehen.

## Qualität, Evaluation und Entscheidungsgrenzen

Ein Lauf ist nicht erfolgreich, nur weil er einen Diff ausgibt. Reproduziert der Ausgangstest den Fehler? Behebt der Patch diesen Test und bestehen unveränderte Regressionstests? Sind neue Tests sinnvoll und hat der Agent keine Sicherheits- oder Lizenzgrenze übergangen? Für Forschung kommen Erfolgsquote, Token- und Laufzeitkosten, Varianz über Wiederholungen und Vergleichbarkeit der Umgebung hinzu.

Benchmarkwerte lassen sich nicht ohne Weiteres auf interne Repositories übertragen. Andere Sprachen, Buildsysteme, private Abhängigkeiten und unvollständige Issues verändern die Aufgabe. Für produktive Nutzung ist ein kleiner eigener Evaluationssatz aussagekräftiger als eine fremde Rangliste.

## Sicherheit, Datenschutz und Governance

Container reduzieren den Zugriff auf den Host, sind aber nur so sicher wie Mounts, Netzwerk, Laufzeit und bereitgestellte Rechte. Agenten können Bash ausführen; unbekannte Repositories und Issue-Inhalte sind daher als potenziell feindlich zu behandeln. Tokens für GitHub oder Modellanbieter sollten kurzlebig, minimal berechtigt und ausschließlich als Secrets beziehungsweise Umgebungsvariablen eingebunden werden.

Trajektorien können Prompts, Modellantworten, Dateiinhalte und Kommandoausgaben enthalten. Sie dürfen nicht unbesehen veröffentlicht oder als Benchmarkartefakt geteilt werden. Aufbewahrung, Zugriff und Löschung der Logs müssen genauso geregelt sein wie beim Quellcode. Das Framework steht unter MIT-Lizenz; Repository-Abhängigkeiten, Modelle und erzeugte Patches können andere Bedingungen haben.

## Kosten und Betriebsaufwand

SWE-agent selbst ist Open Source. Bezahlt werden Modellaufrufe, Container- oder Remote-Compute, Artefaktspeicher und die menschliche Prüfung. Batchläufe und Wiederholungen können die Modellkosten schnell vervielfachen, insbesondere wenn lange Trajektorien immer wieder in den Kontext eingehen.

Teams sollten ein hartes Budget pro Instanz, Timeouts und Abbruchgründe festlegen. Wartung eigener Images, Tool-Bundles und Modelladapter bleibt ein interner Kostenblock. Für neue Projekte kann mini-SWE-agent aufgrund des kleineren Frameworks weniger Betriebsballast verursachen.

## Redaktionelle Einschätzung

SWE-agent empfehlen wir Forschenden und erfahrenen Agenten-Teams, die bestehende Experimente reproduzieren, historische Konfigurationen pflegen oder die detaillierte ACI-Architektur untersuchen wollen. Wert entsteht, wenn Trajektorien, Container und Evaluation bewusst Teil des Versuchsdesigns sind.

Für einen neuen produktiven Coding-Agenten ist der von den Maintainers empfohlene Nachfolger oder eine aktiv betriebene Plattform meist sinnvoller. Kleine Entwicklerteams ohne eigene Evaluation und Container-Governance sollten keinen Maintenance-only-Forschungsstack zum Kern ihres Lieferprozesses machen.

## Alternativen

- [OpenHands](/tools/openhands/): Aktivere Open-Source-Plattform für agentische Entwicklungsaufgaben mit breiterem Produkt- und Integrationsfokus.
- [Devin](/tools/devin/): Verwalteter Cloud-Agent für Teams, die Infrastruktur, Sitzungen und Support nicht selbst aus Forschungsbausteinen zusammensetzen wollen.
- [Aider](/tools/aider/): Schlankere Terminalalternative für dialoggeführte Git-Änderungen ohne vollständigen Benchmark- und Trajektorienapparat.
- [Cline](/tools/cline/): IDE-naher Open-Source-Agent mit sichtbaren Toolaktionen für interaktive Entwicklungsarbeit.

## FAQ

**Ist SWE-agent noch aktiv weiterentwickelt?**

Es befindet sich laut offizieller Dokumentation im Maintenance-only-Modus. Die Maintainer konzentrieren sich auf mini-SWE-agent und empfehlen diesen Nachfolger für neue Einsätze.

**Erzeugt ein Lauf automatisch einen fertigen Pull Request?**

Der Kernoutput ist ein Patch mit Trajektorie und Logs. Ob daraus ein Pull Request wird, sollte ein separater kontrollierter Prozess nach Tests, Diff-Prüfung und Berechtigungsprüfung entscheiden.

**Reicht Docker als Sicherheitsmaßnahme?**

Nein. Mounts, Netzwerk, Containerprivilegien, Secrets und Host-Laufzeit bestimmen die tatsächliche Isolation. Nutze kurzlebige Umgebungen, minimale Rechte und behandle Repository sowie Issue-Text als nicht vertrauenswürdig.

**Kann man SWE-bench-Ergebnisse auf das eigene Team übertragen?**

Nur sehr begrenzt. Interne Repositories unterscheiden sich bei Sprache, Abhängigkeiten, Tests und Aufgabenqualität. Ein eigener kleiner Evaluationssatz mit Kosten-, Qualitäts- und Varianzmessung ist die bessere Entscheidungsgrundlage.
