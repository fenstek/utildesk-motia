---
slug: prometheus
title: Prometheus
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-tool-quality-campaign-04
category: Entwickler-Tools
price_model: Open Source
tags: [monitoring, metrics, observability, developer-tools]
official_url: "https://prometheus.io/"
popularity: 0
tier: D
generated_at: 2026-05-13
---
# Prometheus

Prometheus ist ein Open-Source-System für Metriken und Monitoring, kein KI-Assistent und kein Workflow-Automatisierer. Es sammelt zeitbasierte Messwerte, speichert sie als Zeitreihen und erlaubt Abfragen sowie Alarme. Typische Signale sind Request-Rate, Fehlerrate, Latenz, Ressourcenverbrauch und Queue-Tiefe.

## Für wen ist Prometheus geeignet?

Prometheus passt zu Teams, die Dienste, Container oder Infrastruktur betreiben und aus technischen Signalen handlungsfähige Beobachtbarkeit machen wollen. Es funktioniert besonders gut mit einer Pull-basierten Exporter-Landschaft und ergänzt Visualisierung etwa über [Grafana](/tools/grafana/). Für Log-Suche oder verteilte Traces braucht es zusätzliche Systeme; Metriken allein erklären nicht jeden Vorfall.

<figure class="tool-editorial-figure">
  <img src="/images/tools/prometheus-editorial.webp" alt="Redaktionelle Illustration zum praktischen Einsatz von Prometheus" loading="lazy" decoding="async" />
</figure>

## Mit wenigen SLO-Signalen starten

Beginnen Sie mit der Nutzerperspektive: Verfügbarkeit, Fehlerrate und Latenz eines kritischen Ablaufs. Eine Dashboard-Wand voller CPU-Werte hilft wenig, wenn niemand weiß, ob Kunden betroffen sind. Definieren Sie für jeden Alarm Besitzer, Dringlichkeit, Runbook und eine konkrete Aktion.

## Labels und Cardinality

Labels machen Metriken filterbar, können aber Speicher und Abfragekosten explodieren lassen. IDs, E-Mail-Adressen, vollständige URLs oder zufällige Request-Werte gehören nicht als Label in Prometheus. Nutzen Sie wenige begrenzte Dimensionen wie Service, Endpoint-Klasse oder Statusfamilie und prüfen Sie neue Metriken im Review.

## Abfragen, Recording Rules und Alerting

PromQL erlaubt flexible Abfragen; häufige oder teure Berechnungen lassen sich als Recording Rules vorbereiten. Alerts sollten Symptome und Dauer abbilden, nicht jede kurzfristige Schwankung. Alertmanager-Routing, Deduplizierung und Inhibition verhindern, dass ein Ausfall zwanzig Seiten erzeugt. Testen Sie Regeln mit absichtlich erzeugten Fehlern.

## Betrieb und Aufbewahrung

Planen Sie Scrape-Intervalle, Aufbewahrungszeit, Speicher, Backups und Hochverfügbarkeit passend zur Last. Prometheus ist nicht als unbegrenztes Langzeitarchiv gedacht; für größere oder längere Aufbewahrung können Remote Storage oder kompatible Systeme nötig sein. Schützen Sie Metrik-Endpunkte, weil sie interne Namen, Kapazitäten oder Fehlerdetails verraten können.

## Alternativen zu Prometheus

- [Grafana](/tools/grafana/): Visualisierung und Alerting-Ergänzung, nicht Ersatz für die Metrikdatenquelle.
- [Datadog](/tools/datadog/): gehostete Observability-Plattform mit breiterem SaaS-Angebot.
- [New Relic](/tools/new-relic/): alternative APM- und Observability-Plattform.
- [Elastic Stack](/tools/elastic-stack/): wenn Logs und Suche stärker im Vordergrund stehen.

## Redaktionelle Einschätzung

Prometheus ist ein sehr guter Standard für technische Metriken, sofern das Team Cardinality, Alarmhygiene und Betriebsverantwortung ernst nimmt. Der beste erste Erfolg ist nicht ein schönes Dashboard, sondern ein Alarm, der selten feuert, den richtigen Menschen erreicht und eine klare Diagnose beschleunigt.

## FAQ

**Ersetzt Prometheus Log-Management?**

Nein. Metriken zeigen Trends und Symptome effizient; detailreiche Ereignisse und Fehlerursachen liegen meist in Logs oder Traces.

**Warum sind hoch-kardinale Labels problematisch?**

Jede einzigartige Labelkombination erzeugt eine eigene Zeitreihe. Unbegrenzte IDs oder URLs können Speicher und Abfragen sehr schnell überlasten.

**Was macht einen guten Alert aus?**

Er zeigt einen relevanten, anhaltenden Nutzer- oder Systemschaden, hat einen Verantwortlichen und ein kurzes Runbook. Reine Schwankungen sind besser im Dashboard aufgehoben.
