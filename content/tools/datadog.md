---
slug: datadog
title: Datadog
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: AI Infrastructure
price_model: "Subscription, usage-based"
tags: [data, workflow]
official_url: "https://www.datadoghq.com/"
description: "SaaS-Plattform für Infrastruktur-, APM-, Log-, Trace- und Security-Observability mit nutzungsabhängiger Abrechnung und hohem Governance-Bedarf."
popularity: 0
tier: C
generated_at: 2026-05-15
updated_at: 2026-07-14
---
# Datadog

Datadog ist eine cloudbasierte Observability- und Security-Plattform für Teams, die Infrastruktur, Anwendungen, Logs und verteilte Traces in einem Betriebsprozess zusammenführen wollen. Der zentrale Nutzen liegt nicht in einem einzelnen Dashboard, sondern in der Korrelation von Signalen während einer Störung. Die SaaS-Grenze bleibt wichtig: Daten werden an Datadog übertragen, und Kosten entstehen je nach Produkt, Datenvolumen, Retention und überwachten Einheiten.

## Für wen ist Datadog geeignet?

Datadog passt zu DevOps-, SRE-, Plattform- und Security-Teams, die mehrere Services, Cloud-Konten oder hybride Umgebungen betreiben und eine gemeinsame Sicht auf ihre Laufzeit brauchen. Besonders sinnvoll ist die Plattform, wenn ein Team bereits Verantwortliche für Services benennen kann und nicht nur gelegentlich Logs durchsuchen möchte. Ein kleines Projekt mit einem Server und wenig Betriebsrisiko braucht dagegen oft keine breite Suite.

## Welche Bausteine gehören in den Betrieb?

Der Datadog Agent sammelt auf unterstützten Hosts und Workloads Telemetrie; Anwendungen lassen sich zusätzlich instrumentieren. Infrastructure Monitoring liefert Host-, Container- und Systemsignale, APM verfolgt Requests über Services, und Log Management verarbeitet Ereignisse. Dashboards, Monitors, Service-Ansichten und Incident-Workflows machen daraus eine Betriebsschicht. Je nach Bedarf kommen Network Monitoring, Synthetic Monitoring, Real User Monitoring oder Security-Produkte hinzu. Diese Module sind keine automatische Komplettlösung: Jedes zusätzliche Signal braucht einen Zweck, eine Aufbewahrungsentscheidung und einen Owner.

<figure class="tool-editorial-figure">
  <img src="/images/tools/datadog-editorial.webp" alt="Abstraktes Observability-Stadtmodell mit miteinander verbundenen Telemetrie-Spuren" loading="lazy" decoding="async" />
</figure>

## Ein praktikabler Einführungs-Workflow

Beginne mit einem Service, einem klaren Störungsbild und wenigen Fragen: Ist er erreichbar, wie lange dauern Requests, und wo entstehen Fehler? Installiere den Agent nach dem offiziellen Setup, instrumentiere einen repräsentativen Request-Pfad und prüfe zuerst die Datenqualität. Danach definierst du Monitors mit Schwellen oder Anomalie-Logik, verknüpfst sie mit einem Bereitschafts- oder Incident-Prozess und dokumentierst die verantwortliche Person. Erst wenn die Signale in einer echten Störung helfen, werden weitere Services und Logquellen aufgenommen.

Im Alltag sollte eine Meldung auf eine Untersuchung führen: Monitor öffnen, betroffenen Service und Trace eingrenzen, Logs mit passendem Zeitfenster korrelieren, Änderung oder Abhängigkeit prüfen und die Ursache im Incident festhalten. Nach dem Ereignis werden nur solche Dashboards und Alerts behalten, die eine Entscheidung unterstützen. Sonst wächst die Oberfläche schneller als die Diagnosefähigkeit.

## Integration und laufende Pflege

Datadog kann Daten aus Cloud-Diensten, Hosts, Containern und Anwendungen aufnehmen und mit Team- und Incident-Werkzeugen verbinden. Für eigene Services sind automatische oder manuelle Instrumentierung und passende Tags entscheidend; inkonsistente Service-Namen machen Korrelationen unzuverlässig. Plane außerdem Agent-Upgrades, Berechtigungsreviews, Monitor-Rotation und Export- oder Archivierungswege ein. OpenTelemetry kann bei der Instrumentierung eine Rolle spielen, ersetzt aber nicht die Entscheidung, welche Daten in Datadog gespeichert und indexiert werden.

## Qualitätssicherung und Entscheidungsprüfung

Bewerte die Einführung anhand echter Betriebsfragen: Wie schnell findet das Team den betroffenen Service? Wie viele Alerts sind actionable? Werden Logs und Traces ausreichend vollständig korreliert? Für einen Pilot genügen ein kritischer Pfad, ein vorher definierter Fehlerfall und eine kurze Review nach mehreren Betriebszyklen. Prüfe außerdem, ob hohe Kardinalität, Debug-Logs oder zu großzügige Trace-Aufnahme die Suche verlangsamen oder das Budget belasten. Ein grünes Dashboard ist kein Beweis für eine gesunde Anwendung, wenn die Instrumentierung Lücken hat.

## Sicherheit, Datenschutz und Governance

Behandle Telemetrie als potenziell sensible Produktionsdaten: Logs und Traces können IDs, URLs, Payload-Fragmente oder personenbezogene Informationen enthalten. Vor dem Rollout gehören Scrubbing und Redaction, API- und Application-Keys, Rollen, SSO- und Zugriffskonzept, Aufbewahrung sowie regionale Anforderungen in die Prüfung. Definiere, wer Security-Signale sehen darf und wer Monitors oder Retention-Regeln ändern kann. Datadog bietet Sicherheits- und Governance-Funktionen, aber ihre Wirksamkeit hängt von Konfiguration, Datenklassifizierung und einem belastbaren Incident-Prozess ab.

## Preis und reale Betriebskosten

Datadog rechnet nicht einfach pauschal pro Team ab. Je nach Auswahl zählen unter anderem Infrastruktur-Hosts, APM-Hosts, ingestierte oder indexierte Logs, ingestierte oder indexierte Spans, Container, Geräte und weitere Produktmetriken. Annual, monatlich und On-Demand unterscheiden sich; die offizielle Preisliste ist deshalb vor jeder Entscheidung mit Region, Vertrag und erwarteter Nutzung zu prüfen. Rechne zusätzlich Agent- und Instrumentierungsarbeit, Datenbereinigung, Retention, Archive, Alert-Pflege und Bereitschaftszeit ein. Ein Pilot sollte seine Telemetrievolumina und die teuersten Quellen sichtbar machen, bevor weitere Module aktiviert werden.

## Redaktionelle Einschätzung

Datadog empfehle ich Teams mit mehreren produktiven Services, einer echten On-Call- oder Incident-Verantwortung und dem Willen, Telemetrie aktiv zu kuratieren. Wert entsteht, wenn Traces, Logs und Infrastrukturmetriken in einer konkreten Störung schneller zu einer belastbaren Entscheidung führen und dieser Effekt mit Zeit bis zur Diagnose oder Zahl der Fehlalarme messbar wird. Für ein einzelnes System, ein knappes Budget oder eine Organisation, die Daten nicht in einen externen SaaS-Dienst geben darf, ist eine schlankere oder selbst betriebene Lösung oft die bessere Wahl.

## Alternativen

- [New Relic](/tools/new-relic/): Breite SaaS-Observability mit ähnlichem APM- und Log-Fokus; sinnvoll, wenn die vorhandenen Teams bereits New-Relic-Erfahrung haben.
- [Dynatrace](/tools/dynatrace/): Stärker auf automatische Topologie- und Ursachenanalyse in großen Umgebungen ausgerichtet, mit eigener Kosten- und Komplexitätskurve.
- [Prometheus](/tools/prometheus/): Open-Source-Metrikmonitoring für Teams, die Kubernetes-nahe Metriken selbst betreiben und Logs/APM separat wählen wollen.
- [Grafana](/tools/grafana/): Flexible Visualisierung und Observability über verschiedene Datenquellen, passend zu einem bewusst modularen Stack.
- [Splunk](/tools/splunk/): Besonders relevant, wenn Loganalyse, Security und Compliance-Workflows gegenüber einer einheitlichen APM-Suite im Vordergrund stehen.

## FAQ

**Brauche ich für Datadog den Agent auf jedem System?**

Nicht jede Datenquelle wird gleich angebunden. Für Host- und viele Infrastrukturtelemetrien ist der Datadog Agent der typische Einstieg; APM kann zusätzlich über Bibliotheken oder andere unterstützte Wege instrumentiert werden. Prüfe pro Workload, welche Signale wirklich benötigt werden.

**Wie verhindere ich, dass Logs die Rechnung dominieren?**

Trenne Sammlung, Verarbeitung und Indexierung, entferne unnötige Felder und debug-lastige Quellen früh und definiere Retention nach Untersuchungswert. Beobachte ingestierte und indexierte Volumina getrennt und teste die Regeln mit realen Störungsfällen.

**Ist Datadog für personenbezogene Produktionsdaten geeignet?**

Das lässt sich nicht pauschal beantworten. Klassifiziere Logs und Traces, maskiere sensible Werte vor der Übertragung, prüfe Vertrag, Region, Rollen und Löschprozesse und lasse die konkrete Nutzung durch Datenschutz und Security freigeben.

**Wie sollte ein kleines Team mit Datadog starten?**

Mit einem kritischen Service, wenigen Monitoren und einem festgelegten Review-Termin. Misst, ob Diagnose und Eskalation tatsächlich besser werden; wenn nur mehr Meldungen und Kosten entstehen, sind Sampling, Datenumfang oder eine kleinere Alternative zu prüfen.
