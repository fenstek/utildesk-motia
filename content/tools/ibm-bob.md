---
slug: ibm-bob
title: IBM Bob
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: Entwickler-Tools
price_model: Freemium
tags: [ibm, coding-agent, software-development, modernization]
official_url: "https://bob.ibm.com/"
description: "Agentischer Entwicklungspartner für Codeanalyse, Änderungen, Shell-Aufgaben und Modernisierung mit Modi, Skills, MCP und kontrollierbaren Werkzeugfreigaben."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# IBM Bob

IBM Bob ist ein KI-gestützter Entwicklungspartner für Arbeit an realen Codebasen: Er kann Code erklären und ändern, Befehle ausführen, Dokumentation erstellen und mit spezialisierten Agenten oder Skills arbeiten. Bob verbindet IDE und Shell, bleibt aber ein Werkzeug mit weitreichendem Workspace-Zugriff. Ergebnisse, Befehle und externe Integrationen benötigen deshalb denselben Review- und Sicherheitsprozess wie menschliche Änderungen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/ibm-bob-editorial.webp" alt="Entwicklungsarbeitsplatz mit IBM-Bob-Agent, Codeprüfung, Shell-Aufgabe und freizugebender Änderung" loading="lazy" decoding="async" />
</figure>

## Was ist IBM Bob und für wen eignet es sich?

Bob richtet sich an Entwickler und größere Engineering-Organisationen, die mehr als Autovervollständigung suchen. Der Schwerpunkt liegt auf Aufgaben über den Software Development Lifecycle: vorhandenen Code verstehen, Änderungen planen, Implementierungen erzeugen, Tests und Dokumentation ergänzen oder Modernisierungsvorhaben vorbereiten. IBM positioniert zusätzlich spezialisierte Pakete für Java, IBM i und IBM Z.

Besonders plausibel ist Bob in heterogenen Unternehmenscodebasen, wenn IDE-Arbeit, Terminalschritte und organisationsspezifisches Wissen zusammenkommen. Für eine kleine, klar begrenzte Codefrage genügt oft ein schlankerer Assistent. Bob ersetzt weder Architekturverantwortung noch Code Review, Security Scans oder fachliche Abnahme.

## Wie greifen Modi, Tools, Skills und Subagents zusammen?

Die Modi trennen unterschiedliche Arbeitsabsichten. Ask dient Erklärungen, Plan strukturiert eine Änderung vor der Umsetzung, und Agent kann Dateien bearbeiten sowie Entwicklungsaufgaben ausführen. Bob verfügt über Lese- und Schreibwerkzeuge, Symbol- und Codesuche, Kommandoausführung und vordefinierte Workflows. Skills laden kuratierte Anweisungen für bestimmte Domänen; MCP verbindet lokale oder entfernte Werkzeuge und Dienste.

Für größere Aufgaben kann Bob fokussierte Subagents mit eigenem Kontext starten. Laut Dokumentation bestätigt der Benutzer jeden Start. Ein Subagent liefert eine Zusammenfassung an den Hauptkontext zurück; sein isoliertes Kontextfenster ist kein isoliertes Dateisystem oder Sicherheits-Sandbox. Bob Shell bringt Agentenfunktionen in interaktive Terminal- und Automationsabläufe, wodurch der mögliche Wirkungsradius zusätzlich wächst.

## Wie sieht ein vernünftiger Arbeitsablauf aus?

Beginnen Sie mit einem sauberen Branch und definieren Sie Erfolgskriterien, erlaubte Pfade und Prüfkommandos. Eine neue Codebasis wird zunächst im Ask- oder Plan-Modus erkundet. Die Aufgabe sollte betroffene Komponenten, Nicht-Ziele, gewünschtes Verhalten und vorhandene Tests nennen. Erst nach Prüfung des Plans erhält der Agent eine kleine, rücknehmbare Implementierung.

Danach werden Diff, ausgeführte Befehle und Testergebnisse einzeln geprüft. Lassen Sie Bob keine nicht verstandenen Fehler durch breite Konfigurationsänderungen umgehen. Für Migrationen empfiehlt sich ein repräsentativer Teil der Anwendung mit messbarer Verhaltensparität, bevor ein Premium-Workflow auf weitere Module ausgedehnt wird. Commit, Pull Request und Deployment bleiben getrennte Freigabestufen.

## Wie integriert man Bob in Team und Pipeline?

Im Editor arbeitet Bob direkt mit dem geöffneten Workspace. Bob Shell überträgt ähnliche Fähigkeiten ins Terminal und kann in Skripten oder CI-Abläufen eingesetzt werden. MCP-Server erweitern den Zugriff auf externe APIs, Datenquellen oder Unternehmenswerkzeuge. Enterprise-Funktionen umfassen zentrale Teamverwaltung, Rollen, Zuteilung von Nutzungskontingenten und Analysen über Bobalytics.

Jede Integration benötigt einen Owner und eine nachvollziehbare Berechtigung. API-Schlüssel für Automationsabläufe sollten individuell verwaltet und regelmäßig rotiert werden. Bei MCP muss klar sein, welcher Benutzer oder Lauf eine Aktion ausgelöst hat. Versionsupdates von Bob, Skills und angebundenen Servern gehören in die Abhängigkeitskontrolle, weil sie Verhalten und Toolumfang verändern können.

## Wie misst man die Qualität der Ergebnisse?

Ein Vergleich sollte reale Aufgaben mit vorhandenen Tests verwenden: Bug reproduzieren und beheben, eine kleine API erweitern, Legacy-Logik dokumentieren oder eine Framework-Migration an einem Modul durchführen. Bewerten Sie funktionale Korrektheit, Testabdeckung, unnötige Diff-Größe, Sicherheitsregressionen und Review-Zeit. Ein erfolgreich ausgeführter Befehl sagt nichts darüber aus, ob die Änderung fachlich richtig ist.

Bei Modernisierung zählen außerdem Build-Reproduzierbarkeit, Verhalten vor und nach der Änderung, Abhängigkeitsrisiken und Wartbarkeit durch das Team. Bobalytics kann Nutzung und Beiträge sichtbar machen, doch Produktivität darf nicht allein aus erzeugten Zeilen oder Agentensitzungen abgeleitet werden. Der wichtigste Indikator bleibt akzeptierte, getestete Software mit weniger Nacharbeit.

## Welche Sicherheits- und Datenschutzgrenzen gelten?

Die offizielle Sicherheitsanleitung empfiehlt `.bobignore`, um Dateien im Workspace auszuschließen. Diese Datei ist jedoch keine systemweite Sandbox und schützt nichts außerhalb der Bob-Werkzeuge. Secrets gehören zusätzlich in einen Secret Manager und in `.gitignore`; sie dürfen nicht in Prompts oder zugänglichen Beispieldateien stehen. Breite Auto-Approve-Regeln für Dateiänderungen, Kommandos und MCP erhöhen das Risiko deutlich.

Externe MCP-Server benötigen Authentifizierung, Verschlüsselung, minimale Rechte und Audit-Logs. Unbekannte Repositories, Build-Skripte und Dokumentation können manipulative Anweisungen enthalten. Deshalb sollten sensible Projekte getrennte Workspaces, begrenzte Tokens und eine menschliche Prüfung jedes Hochrisikoschritts erhalten. Vor Unternehmenseinsatz sind außerdem Datenverarbeitung, Retention und Modellbedingungen vertraglich zu klären.

## Wie entstehen Kosten und Betriebsaufwand?

Bob bietet Probe- und kostenpflichtige Nutzung; Pläne und Kontingente arbeiten mit sogenannten Bobcoins. Enterprise-Kunden erhalten zentrale Verwaltung und Support, während spezialisierte Modernisierungspakete separat bepreist sein können. Die aktuelle Pricing-Seite weist darauf hin, dass Preise nach Land variieren und Steuern beziehungsweise Verfügbarkeit zu beachten sind.

Zum Gesamtaufwand gehören Onboarding, Review-Zeit, Premium-Pakete, externe MCP-Dienste, CI-Ressourcen und mögliche Nacharbeit. Prüfen Sie nicht nur Verbrauch pro Benutzer, sondern Kosten pro akzeptierter Änderung. Kontingentlimits, getrennte Pilotgruppen und ein klarer Abbruchpunkt verhindern, dass eine breite Einführung vor einem belastbaren Nutzenbeleg erfolgt.

## Redaktionelle Einschätzung

IBM Bob empfiehlt sich für Unternehmen mit großen oder älteren Codebasen, die agentische IDE- und Shell-Arbeit mit Modernisierungswissen und zentraler Steuerung verbinden möchten. Der Nutzen ist am größten, wenn das Team Tests, Review-Verantwortung und sichere Toolgrenzen bereits beherrscht. Für einzelne Entwickler mit modernen, überschaubaren Projekten oder für strikt isolierte Codeanalyse kann ein fokussierterer Assistent einfacher und günstiger sein.

## Alternativen

- [GitHub Copilot](/tools/github-copilot/): Breiter etablierter Assistent für IDE und GitHub, wenn plattformspezifische Modernisierungspakete weniger wichtig sind.
- [OpenAI Codex](/tools/openai-codex/): Geeignet für delegierte Repository-Aufgaben und Cloud- oder lokale Coding-Workflows ohne IBM-Schwerpunkt.
- [Cursor](/tools/cursor/): KI-zentrierter Codeeditor für interaktive Entwicklungsarbeit mit geringerem Enterprise-Modernisierungsfokus.
- [Microsoft Agent Framework](/tools/microsoft-agent-framework/): Open-Source-Grundlage für Teams, die eine eigene Agentenlaufzeit statt eines fertigen Coding-Produkts bauen wollen.

## FAQ

**Kann IBM Bob Dateien ändern und Befehle ausführen?**

Ja. Bob besitzt Werkzeuge zum Lesen und Schreiben von Dateien sowie zur Kommandoausführung. Parameter werden zur Prüfung angezeigt, sofern Auto-Approve die Bestätigung nicht überspringt.

**Was unterscheidet Ask, Plan und Agent?**

Ask beantwortet Fragen zur Codebasis, Plan entwirft die Vorgehensweise, und Agent führt Änderungen aus. Die Trennung hilft, Analyse und Implementierung bewusst nacheinander freizugeben.

**Sind Subagents automatisch sicher isoliert?**

Nein. Sie haben einen getrennten Kontext und benötigen eine Startfreigabe, stellen aber keine System-Sandbox dar. Ihre Tools und Ergebnisse müssen weiterhin geprüft werden.

**Schützt `.bobignore` alle geheimen Daten?**

Nein. Die Datei begrenzt Bob-Werkzeuge innerhalb des aktuellen Workspace. Sie ersetzt weder Systemisolation noch Secret Management, minimale Tokens und sichere MCP-Konfiguration.
