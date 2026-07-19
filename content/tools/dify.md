---
slug: "dify"
title: "Dify"
category: "AI Infrastructure"
price_model: "Freemium"
tags: [llmops, workflow, rag, agents, self-hosted]
official_url: "https://dify.ai/"
tier: D
generated_at: 2026-07-19
popularity: 0
description: "Plattform für Entwicklung und Betrieb von LLM-Anwendungen mit visuellen Workflows, Wissensbasen, Modellanbindung und APIs, deren Qualität und Governance das Team selbst verantwortet."
updated_at: 2026-07-19
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
---

# Dify

Dify ist eine Plattform zum Entwerfen, Testen und Bereitstellen von LLM-Anwendungen. Sie verbindet visuelle Workflows, Modellanbieter, Wissensbasen, Tools, Protokolle und APIs in einer gemeinsamen Betriebsoberfläche. Dadurch können Produkt- und Entwicklungsteams einen Assistenten oder dokumentengestützten Prozess schneller von der Idee in eine Anwendung überführen. Die Plattform ersetzt jedoch weder fachliche Produktlogik noch Evaluation, Datenschutzkonzept und zuverlässigen Betrieb.

## Für wen eignet sich Dify?

Dify passt zu Teams, die mehrere LLM-Bausteine koordinieren müssen, aber nicht jede Verwaltungsoberfläche und API selbst entwickeln wollen. Typische Nutzer sind interne AI-Plattformteams, Produktentwickler und Fachbereiche mit technischer Unterstützung. Sie profitieren besonders, wenn Prompts, Wissensquellen und Modellzugriffe zentral verwaltet und als Web-Anwendung oder API bereitgestellt werden sollen.

Für einen einzelnen, gut abgegrenzten Modellaufruf kann ein kleines SDK einfacher sein. Dify lohnt sich eher, sobald ein Ablauf mehrere Schritte, Retrieval, Teamfreigaben, Laufzeitbeobachtung oder wiederholte Änderungen benötigt. Low Code bedeutet dabei nicht No Ops: Ein produktiver Dienst braucht weiterhin Verantwortliche für Daten, Modelle und Störungen.

## Welche Komponenten greifen ineinander?

Im Studio entstehen Anwendungen und Workflows aus verbundenen Nodes. Modellprovider liefern Chat-, Embedding- oder andere Modellfunktionen; Wissensbasen nehmen Dokumente auf, indexieren sie und stellen Treffer für Retrieval-Augmented Generation bereit. Tools und Plugins binden externe Aktionen ein. Über veröffentlichte Oberflächen und APIs erreicht die Anwendung ihre Nutzer oder ein bestehendes Produkt.

Logs, Annotationen und Testläufe helfen bei der Verbesserung, sind aber kein automatischer Qualitätsnachweis. Trigger können Abläufe durch Ereignisse, Zeitpläne oder Webhooks starten, abhängig von Edition und Tarif. Jede zusätzliche Verbindung erweitert den Fehler- und Berechtigungsraum und sollte deshalb einen Eigentümer haben.

<figure class="tool-editorial-figure">
  <img src="/images/tools/dify-editorial.webp" alt="Visueller Dify-Workflow zwischen Nutzereingabe, Wissensabruf, Sprachmodell, Werkzeug und API-Ausgabe" loading="lazy" decoding="async" />
</figure>

## Wie wird ein Dify-Workflow eingeführt?

Am Anfang steht ein enger Anwendungsfall mit messbarer Zielgröße, etwa der Anteil korrekt belegter Antworten auf freigegebene Dokumente. Danach wählt das Team Modellprovider und Datenquelle, baut den kleinsten funktionierenden Workflow und legt Fehlerpfade für leere Treffer, Timeouts und unerlaubte Aktionen fest. Erst dann folgen zusätzliche Tools, Verzweigungen oder Agents.

Vor der Veröffentlichung braucht es eine repräsentative Testmenge mit erwarteten Antworten und Ablehnungen. Eine Staging-Anwendung sollte getrennte Schlüssel und Daten verwenden. Für den Rollout werden Version, Verantwortliche, Rate Limits, Budget, Eskalation und Abschaltweg dokumentiert. Änderungen an Prompt, Retrieval oder Modell gelten als Produktänderung und durchlaufen erneut die Evaluation.

## Integration, Self-Hosting und Betrieb

Dify Cloud reduziert den Aufwand für die Plattform selbst. Self-Hosting gibt mehr Infrastrukturkontrolle, verlagert aber Datenbank, Queue, Storage, Upgrades, Backups, Monitoring und Verfügbarkeit zum Betreiber. Die Community-Ausgabe steht unter der Dify Open Source License; Nutzungs- und Markenbedingungen sollten vor kommerziellem oder eingebettetem Einsatz geprüft werden. Enterprise-Angebote ergänzen Betriebs-, Governance- und Supportfunktionen.

APIs sollten hinter einer eigenen Anwendungsschicht liegen, wenn Authentifizierung, Mandantentrennung oder fachliche Autorisierung wichtig sind. Provider-Schlüssel gehören in eine Secret-Verwaltung und nicht in Workflow-Beschreibungen. Bei Updates müssen Datenmigrationen, Plugin-Kompatibilität und ein getesteter Rollback berücksichtigt werden.

## Qualität, Evaluation und Beobachtbarkeit

Eine brauchbare Evaluation trennt Retrieval, Modellantwort und Tool-Ausführung. Für Wissensanwendungen misst das Team Trefferqualität, Quellenbezug, unbeantwortbare Fragen und Aktualität. Bei Aktionen kommen korrekte Parameter, Berechtigungen, Seiteneffekte und Wiederholbarkeit hinzu. Kosten und Latenz werden pro Workflow-Schritt betrachtet, nicht nur als Monatswert.

Produktionslogs können Fehler sichtbar machen, enthalten aber möglicherweise Prompts, Dokumentauszüge oder personenbezogene Daten. Sinnvoll sind gezielte Stichproben, Nutzerfeedback und eine feste Regression-Suite. Eine gute Demo mit wenigen Beispielen reicht nicht, weil veränderte Dokumente und Modelle das Verhalten später verschieben können.

## Sicherheit, Datenschutz und Governance

Vor dem Import ist festzulegen, welche Dokumente in eine Wissensbasis dürfen, wer sie aktualisiert und wann alte Versionen gelöscht werden. Modellprovider, Embedding-Dienst, Plugins und Self-Hosting-Infrastruktur können jeweils Datenempfänger sein. Verträge, Region, Aufbewahrung und Logging müssen deshalb entlang des tatsächlichen Datenflusses bewertet werden.

Tools mit Schreibzugriff benötigen minimale Berechtigungen, Bestätigung für riskante Aktionen und Schutz gegen Prompt Injection. Workspace-Rollen ersetzen keine Autorisierung im Zielsystem. Für sensible Abläufe sind getrennte Service-Identitäten, Netzwerkgrenzen, Auditierbarkeit und ein Not-Aus wichtiger als maximale Agentenautonomie.

## Kosten und Auswahlkriterien

Dify Cloud bietet einen begrenzten Einstieg und kostenpflichtige Teamstufen; Enterprise und private Bereitstellung werden gesondert angeboten. Zusätzlich entstehen Modell-, Embedding-, Storage- und gegebenenfalls Toolkosten. Wer eigene Provider-Schlüssel nutzt, verschiebt Modellverbrauch nicht in das Dify-Abonnement, sondern erhält eine zweite Kostenlinie.

Self-Hosting vermeidet keine Gesamtkosten: Infrastruktur, Upgrades, Bereitschaft und Sicherheitsarbeit müssen eingerechnet werden. Ein belastbarer Vergleich nutzt reale Dokumentmengen, Nachrichtenvolumen, Teamgröße und Spitzenlast. Relevant ist der Preis pro zuverlässig erledigtem Fall, nicht der nominell günstigste Plan.

## Redaktionelle Einschätzung

Wir empfehlen Dify Teams, die LLM-Anwendungen wiederholt bauen und dabei eine gemeinsame Oberfläche für Workflow, Wissen, Modellzugriff und Betrieb brauchen. Wert entsteht, wenn klare Produktverantwortung und eine echte Evaluation vorhanden sind und Dify die Plattformarbeit reduziert.

Für einen kleinen Codepfad, maximale Framework-Freiheit oder hochspezialisierte Orchestrierung ist ein Entwickler-Framework oft schlanker. Teams ohne Ressourcen für Datenpflege und Produktionsbetrieb sollten nicht erwarten, dass die visuelle Oberfläche diese Arbeit übernimmt.

## Alternativen

- [Botpress](/tools/botpress/): Eignet sich stärker für dialogorientierte Bots mit geführtem Conversation-Building und passenden Kanal-Integrationen.
- [LangChain](/tools/langchain/): Gibt Entwicklungsteams mehr Code- und Komponentenfreiheit, verlangt dafür eine eigene Betriebs- und Verwaltungsoberfläche.
- [LangGraph](/tools/langgraph/): Passt zu zustandsbehafteten, kontrollierten Agentenabläufen, wenn Orchestrierungslogik direkt im Code liegen soll.
- [n8n](/tools/n8n/): Ist sinnvoller, wenn allgemeine Geschäftsautomation und zahlreiche SaaS-Verbindungen wichtiger sind als eine spezialisierte LLM-App-Plattform.

## FAQ

**Kann Dify ohne eigenen Code produktiv eingesetzt werden?**

Einfache Anwendungen lassen sich visuell aufbauen. Authentifizierung, fachliche Regeln, Tests, Monitoring und Integration in bestehende Systeme erfordern in einer belastbaren Produktion jedoch häufig zusätzliche Entwicklungsarbeit.

**Ist Self-Hosting automatisch datenschutzfreundlicher?**

Nein. Es gibt mehr Kontrolle über die Plattformdaten, doch externe Modellprovider, Plugins, Backups und Logs können weiterhin Daten verarbeiten. Entscheidend ist der vollständige Datenfluss samt Verträgen und Löschregeln.

**Wie verhindert ein Team falsche RAG-Antworten?**

Mit kuratierten Dokumenten, geeigneter Segmentierung, Retrieval-Tests, Quellenanzeige, definierten Ablehnungen und einer Regression-Suite. Dify stellt Bausteine bereit, garantiert aber nicht die fachliche Richtigkeit.

**Welche Kosten fallen zusätzlich zum Dify-Plan an?**

Je nach Aufbau insbesondere Modell- und Embedding-Aufrufe, Storage, externe Tools sowie beim Self-Hosting Infrastruktur und Betrieb. Diese Positionen sollten pro Workflow und Nutzungsszenario gemessen werden.
