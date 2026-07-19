---
slug: "langfuse"
title: "Langfuse"
category: "AI Infrastructure"
price_model: "Freemium"
tags: [llmops, observability, evaluation, prompts, open-source]
official_url: "https://langfuse.com/"
tier: D
generated_at: 2026-07-19
popularity: 0
description: "Open-Source-Plattform für Tracing, Evaluation, Prompt-Management und Metriken von LLM-Anwendungen, die nur mit sauberer Instrumentierung und Daten-Governance belastbare Aussagen liefert."
updated_at: 2026-07-19
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
---

# Langfuse

Langfuse ist eine Open-Source-Plattform für Observability und Evaluation von LLM-Anwendungen. Sie erfasst Traces, Spans beziehungsweise Generationsschritte, Sessions, Kosten- und Latenzdaten und verbindet diese mit Prompt-Versionen, Datasets und Scores. Damit können Teams untersuchen, warum ein Assistent langsam, teuer oder fachlich unzuverlässig war. Langfuse orchestriert die Anwendung jedoch nicht und beweist keine Qualität ohne passende Instrumentierung, Testdaten und Bewertungskriterien.

## Für wen eignet sich Langfuse?

Das Werkzeug passt zu Produkt-, ML- und Plattformteams, die LLM-Funktionen bereits entwickeln oder betreiben und deren Verhalten über einzelne Logzeilen hinaus verstehen müssen. Besonders nützlich ist es, wenn mehrere Modelle, Prompt-Versionen oder Agentenschritte verglichen werden und Fehler bis zu einem konkreten Nutzerfall oder Release zurückverfolgt werden sollen.

Für einen frühen Prototyp mit wenigen internen Tests kann einfache strukturierte Protokollierung genügen. Langfuse wird wertvoll, sobald ein Team wiederholbare Experimente, Feedback, Kostenbeobachtung und Produktionsdiagnose in einem gemeinsamen System braucht. Eine klare Taxonomie für Trace-Namen, Umgebungen und Versionen sollte vor breiter Instrumentierung stehen.

## Welche Komponenten greifen ineinander?

SDKs, native Integrationen, OpenTelemetry oder die öffentliche API senden Beobachtungen aus der Anwendung. Traces bilden einen vollständigen Vorgang ab; untergeordnete Schritte zeigen Modellaufrufe, Retrieval oder Tool-Nutzung. Sessions und Nutzerkennungen gruppieren zusammengehörige Interaktionen. Metriken können Qualität, Kosten, Latenz und Volumen über Versionen, Modelle und andere Dimensionen vergleichen.

Prompt Management versioniert und veröffentlicht Prompts, während Datasets und Experimente reproduzierbare Tests unterstützen. Scores können aus Nutzerfeedback, Regeln, externen Evaluationspipelines, menschlicher Bewertung oder LLM-as-a-judge stammen. Diese Quellen sind nicht austauschbar: Ein Modellrichter ist skalierbar, kann aber eigene Verzerrungen und Kosten einbringen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/langfuse-editorial.webp" alt="Observability-Ansicht mit verbundenen LLM-Traces, Prompt-Versionen, Bewertungswerten, Kosten und Latenz" loading="lazy" decoding="async" />
</figure>

## Wie gelingt die Einführung?

Zuerst definiert das Team drei bis fünf Diagnosefragen, etwa welche Prompt-Version die höchste belegte Lösungsrate bei vertretbarer Latenz erreicht. Danach wird ein einziger kritischer Pfad instrumentiert. Trace- und Span-Namen, Release, Umgebung und Fehlerstatus erhalten feste Konventionen; sensible Inhalte werden vor dem Versand maskiert oder gar nicht erst erfasst.

Im nächsten Schritt entsteht ein kleines Dataset aus realistischen, freigegebenen Fällen. Baseline und Kandidat laufen gegen dieselben Beispiele und erhalten nachvollziehbare Scores. Erst wenn Dashboard und Drill-down eine konkrete Fehlersuche ermöglichen, wird die Instrumentierung auf weitere Funktionen ausgedehnt. Für den Produktionsstart gehören Datenaufbewahrung, Sampling, Alarmierung und Verantwortliche in den Betriebsplan.

## Integration, Self-Hosting und Betrieb

Langfuse Cloud übernimmt den Plattformbetrieb. Die Kernfunktionen können unter MIT-Lizenz selbst gehostet werden; offizielle Vorlagen decken unter anderem lokale, Kubernetes- und Cloud-Setups ab. Self-Hosting bedeutet dennoch, die beteiligten Daten- und Speicherdienste, Skalierung, Backups, Upgrades und Verfügbarkeit selbst zu verantworten. Enterprise-Ausgaben ergänzen kommerzielle Verwaltungs-, Sicherheits- und Supportfunktionen.

Instrumentierung darf die Hauptanwendung nicht unnötig blockieren. Pufferung, Timeouts und kontrolliertes Sampling begrenzen den Einfluss bei einem Observability-Ausfall. Vor SDK- oder Server-Upgrades sind Schema, Ingestion, Dashboards und Export in einer Testumgebung zu prüfen. Ein Restore-Test ist ebenso wichtig wie das bloße Vorhandensein eines Backups.

## Evaluation und Entscheidungsqualität

Langfuse kann Scores speichern und vergleichen, aber das Team muss definieren, was „gut“ bedeutet. Für eine Supportantwort können Quellenbezug, fachliche Korrektheit, Eskalationsverhalten und Antwortzeit zählen; für einen Agenten zusätzlich korrekte Toolwahl, Parameter und unerwünschte Seiteneffekte. Ein einzelner Gesamtscore verdeckt häufig wichtige Zielkonflikte.

LLM-as-a-judge sollte gegen menschlich bewertete Beispiele kalibriert und regelmäßig überprüft werden. Online-Metriken zeigen reale Nutzung, während Offline-Datasets kontrollierte Regressionen ermöglichen. Entscheidungen werden belastbar, wenn beide Perspektiven zusammenkommen und ein Release bei kritischen Rückschritten blockiert werden kann.

## Sicherheit, Datenschutz und Governance

Traces können Prompts, Antworten, Dokumentauszüge, Nutzerkennungen und Toolparameter enthalten. Deshalb sollten Datenminimierung, Maskierung, Mandantentrennung, Rollen und Aufbewahrung vor der Instrumentierung feststehen. Client- und serverseitige Maskierung sowie feinere Zugriffs- und Auditfunktionen hängen von Deployment und Edition ab und müssen gegen die aktuelle Funktionsmatrix geprüft werden.

Produktions- und Testprojekte sollten getrennt sein. Schlüssel werden mit minimalen Rechten verwaltet und regelmäßig rotiert. Bei Self-Hosting gehören Netzwerkgrenzen, Verschlüsselung, Backup-Zugriff und Löschprozesse zum eigenen Verantwortungsbereich; bei Cloud-Nutzung sind Region, Auftragsverarbeitung und Unterauftragnehmer zu prüfen.

## Kosten und Auswahlkriterien

Langfuse Cloud besitzt einen kostenlosen Einstieg und nutzungsabhängige beziehungsweise teambezogene Bezahlstufen. Kosten wachsen vor allem mit aufgenommenen Beobachtungen, Speicherung, Aufbewahrung und Zusatzfunktionen. Evaluationen mit externen Modellen verursachen außerdem Modellkosten, die nicht Teil der Observability-Rechnung sein müssen.

Die Open-Source-Kernplattform kann ohne Langfuse-Abonnement selbst gehostet werden, doch Datenbanken, Compute, Betrieb und Bereitschaft bleiben kostenpflichtig. Vor der Wahl sollte ein Team das erwartete Trace-Volumen, die gewünschte Detailtiefe, Retention, Zahl der Nutzer und Sicherheitsanforderungen messen. Sampling kann Kosten senken, darf aber seltene kritische Fehler nicht unsichtbar machen.

## Redaktionelle Einschätzung

Wir empfehlen Langfuse Teams, die LLM-Anwendungen produktiv verantworten und Evaluation, Prompt-Versionen sowie Traces in einen wiederholbaren Verbesserungsprozess bringen wollen. Es liefert Wert, wenn Instrumentierung und Entscheidungskriterien bewusst entworfen werden und aus Erkenntnissen konkrete Release- oder Produktmaßnahmen folgen.

Für allgemeines Infrastrukturmonitoring ohne LLM-spezifische Analysen ist eine klassische Observability-Suite meist breiter. Ein sehr kleiner Prototyp benötigt möglicherweise noch keine eigene Plattform. Langfuse sollte nicht eingeführt werden, um fehlende Testfälle oder unklare Qualitätsziele mit einem Dashboard zu kaschieren.

## Alternativen

- [Elastic Observability](/tools/elastic-observability/): Deckt Logs, Metriken, Traces und Suche über die gesamte Anwendungslandschaft breiter ab, benötigt für LLM-Evaluation aber eigene Modelle und Workflows.
- [Dynatrace](/tools/dynatrace/): Passt zu Enterprise-APM und automatisierter Ursachenanalyse, wenn der Schwerpunkt auf dem Gesamtsystem statt auf Prompt- und Dataset-Arbeit liegt.
- [Splunk Observability](/tools/splunk-observability/): Ist eine Alternative für zentrale Telemetrie und Betriebsüberwachung, wenn LLM-spezifisches Prompt-Management separat gelöst wird.

## FAQ

**Muss eine Anwendung Prompts und Antworten vollständig an Langfuse senden?**

Nein. Das Team bestimmt die Instrumentierung und kann Inhalte reduzieren, maskieren oder auslassen. Für Diagnose und Evaluation muss jedoch klar sein, welche Aussage mit den verbleibenden Metadaten noch möglich ist.

**Ersetzt Langfuse ein allgemeines APM-System?**

In der Regel nicht vollständig. Langfuse konzentriert sich auf LLM-Traces, Prompts und Evaluation; Infrastrukturmetriken, Hostzustand und klassische Anwendungsfehler bleiben häufig in einer breiteren Observability-Plattform.

**Ist LLM-as-a-judge eine verlässliche Qualitätsmessung?**

Nur als kalibrierter Teil eines Systems. Kriterien, Modell und Prompt des Richters müssen gegen menschliche Bewertungen geprüft werden, und kritische Fälle benötigen weiterhin fachliche Kontrolle.

**Wann lohnt sich Self-Hosting?**

Wenn Datenkontrolle, Netzwerkanbindung oder individuelle Betriebsanforderungen den zusätzlichen Infrastrukturaufwand rechtfertigen. Die Entscheidung sollte Skalierung, Backups, Upgrades, Support und Sicherheitsfunktionen einbeziehen.
