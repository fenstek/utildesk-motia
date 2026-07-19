---
slug: google-adk
title: Google Agent Development Kit
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: "AI Infrastructure"
price_model: "Open Source"
tags: [ai-agents, framework, evaluation, orchestration]
official_url: "https://google.github.io/adk-docs/"
description: "Google Agent Development Kit ist ein code-first Open-Source-Framework zum Bauen, Evaluieren und Bereitstellen von Agenten; Modelle, Infrastruktur und sichere Tool-Rechte bleiben eigene Entscheidungen."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# Google Agent Development Kit

Google Agent Development Kit, kurz ADK, ist ein code-first Open-Source-Framework zum Bauen, Testen, Evaluieren und Bereitstellen von AI-Agenten. Es bietet Agenten, Tools, Sessions, Memory, Workflows, Laufzeit und Observability als Programmierbausteine. ADK ist für Gemini optimiert, aber nicht darauf beschränkt. Die wichtigste Grenze: Es ist kein fertiger Agentendienst. Teams bleiben für Anwendungscode, Modellvertrag, Identitäten, Datenhaltung, Schutzregeln und Produktionsbetrieb verantwortlich.

## Für wen eignet sich Google ADK?

ADK passt zu Software- und Plattformteams, die Agenten wie reguläre Anwendungen entwickeln wollen: mit Repository, Abhängigkeiten, Tests, CI/CD und kontrolliertem Deployment. Es unterstützt mehrere Programmiersprachen, darunter Python, TypeScript, Go, Java und Kotlin. Besonders sinnvoll ist es, wenn Tool-Aufrufe, mehrstufige Abläufe und Sitzungszustand explizit modelliert werden müssen.

Wer primär einen visuellen No-Code-Builder oder einen sofort nutzbaren Business-Assistenten sucht, bekommt mit ADK zu viel Infrastrukturarbeit. Auch „Google“ im Namen bedeutet nicht, dass ein Agent automatisch sicher, korrekt oder kostenlos auf Google Cloud läuft.

## Welche Komponenten bilden einen Agenten?

Ein LLM-Agent kombiniert Modell, Instruktion und Tools. Deterministische Sequential-, Loop- und Parallel-Workflows sowie graphbasierte Routen strukturieren Abläufe; spezialisierte Agenten können zusammenarbeiten. Sessions und State halten den Gesprächskontext, Memory kann Wissen über Sitzungen hinweg verfügbar machen. Function Tools, OpenAPI-Tools und MCP-Toolsets verbinden externe Systeme. Runner und Event Loop führen den Agenten aus; Logging, Metriken und Traces machen Schritte sichtbar.

<figure class="tool-editorial-figure">
  <img src="/images/tools/google-adk-editorial.webp" alt="Illustration zu Google ADK: Codebausteine für Agent, Tools, Zustand und Evaluation führen durch kontrollierte Prüfschleifen in eine Laufzeit" loading="lazy" decoding="async" />
</figure>

Diese Modularität ist nützlich, verlangt aber Architekturentscheidungen. Ein Session Store ist nicht automatisch ein langfristiges Memory, ein Tool-Schema keine Berechtigung und ein Trace keine fachliche Freigabe.

## Praktischer Entwicklungs-Workflow

1. Einen engen Agentenauftrag, verbotene Aktionen und überprüfbare Erfolgskriterien festlegen.
2. Mit einem Agenten und wenigen read-only Tools beginnen; Modell, Prompt und Schemas versionieren.
3. Sessions und State nur für benötigte Daten entwerfen und Lösch- sowie Ablaufregeln definieren.
4. Erwartete Tool-Trajektorien und Antworten als Evalset erfassen; Fehler, Mehrdeutigkeit und Prompt Injection ergänzen.
5. Schreibende oder irreversible Tools mit minimalen Rechten, Idempotenz und expliziter Bestätigung schützen.
6. Traces, Metriken, Budgets, Timeouts und Abbruchverhalten in einer Testumgebung beobachten.
7. Danach containerisiert bereitstellen, eine begrenzte Nutzergruppe freigeben und Rückfallweg dokumentieren.

## Deployment, Integration und Betrieb

ADK-Agenten können in Agent Runtime auf Googles Agent Platform, Cloud Run, GKE oder anderer containerfähiger Infrastruktur laufen. Die Wahl bestimmt Skalierung, Netzwerk, Identitäten, Datenregion, Support und Kosten. Eine lokale Web-Oberfläche und CLI helfen in der Entwicklung; sie ersetzen kein gehärtetes Endnutzer-Frontend und keine produktive Authentifizierungsschicht.

MCP-Server lassen sich als Tools anbinden, und ADK-Tools können umgekehrt über einen MCP-Server bereitgestellt werden. Remote-Verbindungen brauchen Authentifizierungsheader, eingeschränkte Netzpfade und Tool-Filter. Für stdio-Server im Container müssen Runtime und Abhängigkeiten gemeinsam paketiert werden. Updates sollten mit gesperrten Versionen, Release Notes und reproduzierbaren Images erfolgen.

## Qualität, Evaluation und Grenzen

Agenten sind probabilistisch; klassische Unit Tests reichen nicht. ADK-Evaluation kann sowohl die finale Antwort als auch die Tool-Trajektorie gegen erwartete Schritte prüfen. Evalsets bilden einzelne oder mehrteilige Gespräche ab, Kriterien reichen von exakter Tool-Reihenfolge und Antwortähnlichkeit bis zu rubric-, groundedness- und safety-basierten Bewertungen. Conformance-Tests können aufgezeichnete Interaktionen als Regressionsbasis verwenden.

Ein hoher Durchschnittswert darf kritische Fehler nicht verdecken. Miss zusätzlich unerlaubte Aktionen, fehlende Quellen, Abbruchrate, p95-Latenz, Token- und Tool-Kosten sowie menschliche Korrekturen. LLM-as-judge-Ergebnisse benötigen Stichproben und klare Rubrics, weil auch der Bewerter ein Modell ist.

## Sicherheit, Datenschutz und Governance

Die ADK-Sicherheitsdokumentation nennt direkte und indirekte Prompt Injection, Datenabfluss, schädliche Aktionen und unsichere Codeausführung als konkrete Risiken. Jede Tool-Identität bekommt minimale Rechte; für Nutzeridentitäten muss geprüft werden, ob und wie deren Berechtigung weitergegeben wird. Schreibaktionen benötigen Bestätigung oder eine gleichwertige Policy, Dateipfade und MCP-Tools werden gefiltert, modellgenerierter Code läuft in einer hermetischen Sandbox ohne unnötiges Netzwerk.

Prompts, Sessions, Memory, Artefakte und Traces können vertrauliche Daten enthalten. Speicherort, Aufbewahrung, Löschung, Mandantentrennung und Provider-Übertragung gehören ins Datenmodell. Modellinhalt wird vor HTML-Anzeige escaped. Zentrale Plugins können Guardrails anwenden, ersetzen aber weder Threat Model noch fachliche Autorisierung.

## Kosten und Auswahlkriterien

Die Framework-Repositories stehen unter Apache-2.0-Lizenz. Kosten entstehen dennoch durch Modelle, Such- und Tool-APIs, Datenbanken, Memory, Artefaktspeicher, Observability, Evaluation und gewählte Laufzeit. Cloud Run, GKE und ein verwalteter Agent Runtime haben unterschiedliche Abrechnungs- und Betriebsmodelle. Verglichen wird deshalb der Preis pro erfolgreichem, überprüftem Vorgang bei realistischer Last.

## Redaktionelle Einschätzung

Wir empfehlen Google ADK für Entwicklungsteams, die eine codebasierte Agentenarchitektur mit eingebautem Evaluations- und Deploymentpfad suchen und Security Engineering selbst beherrschen. Es liefert Wert, wenn Agentenzustand, Tool-Rechte und Regressionstests als Softwaredesign behandelt werden.

Für einen schnellen visuellen Fachbereichs-Prototyp oder ein kleines Chat-Feature ohne komplexe Aktionen ist ADK häufig mehr Framework als nötig. Ein engerer SDK-Aufruf oder visueller Builder kann dort günstiger und verständlicher sein.

## Alternativen

- [LangGraph](/tools/langgraph/): Zustandsorientierte Graphen und Übergänge für Teams, die kontrollierte Agentenabläufe im LangChain-Ökosystem bauen.
- [LangChain](/tools/langchain/): Breiter Integrationsbaukasten für Modelle, Retrieval und Tools mit weniger Vorgaben für die Gesamtarchitektur.
- [AutoGen](/tools/autogen/): Rollen- und gesprächsorientierte Multi-Agent-Entwicklung, besonders für Experimente und Research-Prototypen.
- [n8n](/tools/n8n/): Visuelle Geschäftsautomation mit vielen Konnektoren, wenn deterministische Integrationsschritte wichtiger als ein Agentenframework sind.

## FAQ

**Ist Google ADK auf Gemini beschränkt?**

Nein. Das Framework ist für Gemini optimiert, unterstützt laut offizieller Dokumentation aber auch andere Modellwege und Integrationen. Verfügbarkeit und Funktionsumfang müssen je Sprache und Provider geprüft werden.

**Ist ADK selbst ein gehosteter Agentendienst?**

Nein. ADK stellt Entwicklungs- und Laufzeitbausteine bereit. Hosting erfolgt beispielsweise über Agent Runtime, Cloud Run, GKE oder eine eigene containerfähige Plattform und wird separat betrieben sowie abgerechnet.

**Wie testet man einen nicht-deterministischen Agenten?**

Mit einem kuratierten Evalset, das finale Antwort, Tool-Auswahl und Trajektorie bewertet, ergänzt um Sicherheits-, Fehler- und Lastfälle. Kritische Ergebnisse brauchen harte Regeln und menschliche Stichproben statt nur eines Durchschnittsscores.

**Schützt ein Tool-Confirmation-Dialog jede Aktion?**

Nein. Bestätigung ist eine wichtige Schranke, aber Tool-Identität, minimale Rechte, Eingabevalidierung, Idempotenz, Netzwerkgrenzen und Audit Logs bleiben notwendig. Automatisch erlaubte read-only Tools müssen ebenfalls gegen Datenabfluss geprüft werden.
