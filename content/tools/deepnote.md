---
slug: deepnote
title: Deepnote
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "AI Infrastructure"
price_model: Freemium
tags: [notebooks, data-science, collaboration]
official_url: "https://deepnote.com/"
popularity: 0
tier: "D"
generated_at: "2026-05-11"
updated_at: 2026-07-14
description: "Deepnote verbindet kollaborative SQL- und Python-Notebooks mit verwalteten Umgebungen, Datenintegrationen und reproduzierbaren Ausführungen für Analytics-Teams."
---
# Deepnote

Deepnote ist eine cloudbasierte Arbeitsumgebung für kollaborative Datenanalyse: Ein Team organisiert mehrere Notebooks in Projekten, verbindet Datenquellen und führt SQL- oder Python-Blöcke in einer verwalteten Umgebung aus. Das ist besonders interessant, wenn Exploration, Review und ein wiederholbarer Bericht im selben Arbeitskontext bleiben sollen. Es ersetzt aber weder ein Warehouse noch ein belastbares Produktionsorchestrierungssystem; Datenverantwortung, Modellprüfung und Freigabe bleiben beim Team.

<figure class="tool-editorial-figure">
  <img src="/images/tools/deepnote-editorial.webp" alt="Analystinnen prüfen in einer Notebook-Arbeitsumgebung Daten, Diagramme und Ausführungsergebnisse" loading="lazy" decoding="async" />
</figure>

## Was Deepnote im Arbeitsprozess leistet

Ein Deepnote-Projekt bündelt Notebooks, Dateien, Umgebungsdefinition, Datenintegrationen und gemeinsame Einstellungen. Notebooks bestehen aus Code-, SQL-, Text-, Chart- und Input-Blöcken. Dadurch kann eine Person eine Frage untersuchen, während eine andere Query, Annahmen oder Visualisierung kommentiert. Für EDA, Ad-hoc-Analysen, wiederkehrende Kennzahlen und interaktive Data Apps ist das ein nachvollziehbarer Ablauf; für große Datenmengen sollte die Berechnung möglichst im Warehouse stattfinden und nicht in eine Notebook-Datei kopiert werden.

## Komponenten und Datenzugriff

Teams können unter anderem PostgreSQL, MySQL, BigQuery, Snowflake, Redshift, ClickHouse, MongoDB, S3, Google Cloud Storage, Google Drive und GitHub anbinden. Deepnote beschreibt diese Integrationen als gemeinsam nutzbare Workspace-Verbindungen und verschlüsselt die zugehörigen Zugangsdaten. Das ist bequem, erhöht aber den Governance-Bedarf: Eine Integration, die an mehrere Projekte gekoppelt ist, kann bei Änderungen mehrere Abläufe beeinflussen. Für einen Pilot sollte deshalb eine dedizierte Verbindung mit minimalen Rechten verwendet werden.

## Ein sinnvoller Pilot-Workflow

1. Definiere eine konkrete Frage, Datenquelle, verantwortliche Person und ein Akzeptanzkriterium.
2. Erstelle ein Projekt mit README-Notebook, klaren Abhängigkeiten und getrennten Notebooks für Exploration, Prüfung und Ergebnis.
3. Verbinde eine schreibgeschützte Datenquelle, prüfe Stichprobe, Aktualität, Nullwerte und Datentypen und dokumentiere die Query.
4. Führe die Analyse mit SQL und Python aus, speichere wichtige Zwischenergebnisse nicht nur als Screenshot und lasse eine zweite Person Annahmen und Ausreißer prüfen.
5. Entscheide erst danach, ob ein Dashboard, eine geplante Ausführung, ein Git-Export oder eine andere Plattform nötig ist.

## Reproduzierbarkeit und Übergabe

Deepnote erstellt bei Notebook-Ausführungen unveränderliche Run Snapshots mit Inhalt, Output, Ausführungszeit, Auslöser und Status. Das hilft bei der Nachprüfung eines Ergebnisses und bei der Fehlersuche in geplanten Läufen. Die Projekt-History erlaubt außerdem, ältere Notebook-Stände anzusehen und wiederherzustellen. Diese Historie deckt laut Dokumentation jedoch nicht mehr automatisch alle übrigen Projektdateien ab. Für Code-Review, Backup und CI empfiehlt sich daher der Export nach GitHub oder GitLab; Deepnote unterstützt dort `.ipynb`-Exporte und kann Outputs bewusst ein- oder ausschließen.

## Betrieb, Automatisierung und Grenzen

Auf kostenpflichtigen Plänen lassen sich Notebooks nach Zeitplan ausführen und bei Erfolg oder Fehler per E-Mail oder Slack melden. Ein Projekt unterstützt dabei höchstens einen geplanten Notebook-Lauf. Für eine wiederkehrende Pipeline müssen Abhängigkeiten, Laufzeit, Schreibziele und Wiederanlauf separat geprüft werden; ein grüner Notebook-Lauf beweist nicht, dass ein nachgelagerter Datenbestand korrekt ist. Die API kann bestehende Notebooks programmgesteuert ausführen und steht laut Deepnote-Dokumentation auf Team und Enterprise zur Verfügung. Für komplexe DAGs, viele Abhängigkeiten oder streng getrennte Deployments ist ein dedizierter Orchestrator oft die sauberere Grenze.

## Qualitätssicherung und Entscheidungsmaßstab

Prüfe vor einer Einführung mindestens Datenfrische, Query-Plan, Stichproben gegen eine Referenz, Ausreißer, Laufzeit und Wiederholbarkeit. Ein zweiter Review sollte nicht nur den Code, sondern auch die Definition der Kennzahl und die Interpretation des Diagramms abnehmen. Für geplante Läufe gehören absichtliche Fehler, fehlende Daten und Berechtigungsentzug in einen Test. Erfolg bedeutet hier nicht „Notebook läuft“, sondern etwa: Die Kennzahl ist mit einer Referenz erklärbar, der Lauf hinterlässt einen prüfbaren Snapshot und eine andere Person kann den Ablauf ohne Zuruf wiederholen.

## Datenschutz, Sicherheit und Governance

Deepnote nennt SOC 2 Type II, Verschlüsselung ruhender Daten mit AES-256 und TLS 1.2 oder höher für den Transport. Workspace-Administratoren verwalten Zugriffe auf Projekte und Datenverbindungen; SSO ist laut Security-Dokumentation mit Google Workspace, Okta und OIDC-Anbietern möglich. Dennoch sollten sensible Rohdaten, Exporte und gecachte Query-Ergebnisse nach dem eigenen Schutzbedarf bewertet werden. Besonders bei Deepnote AI muss das Team wissen, dass Notebook-Inhalt und Metadaten an externe LLM-Anbieter verarbeitet werden können. Der Zugriff auf Block-Outputs ist separat steuerbar; Outputs können Zeilendaten enthalten. Für sensible Projekte kann ein Admin Deepnote AI abschalten. Prüfe zusätzlich Auftragsverarbeitung, Region, Löschung, Rollen, API-Schlüssel und die Freigabe öffentlicher Projekte mit der eigenen Rechts- und Sicherheitsfunktion.

## Preis und laufende Kosten

Es gibt Free, Team und Enterprise. Die offizielle Pricing-Seite nennt für Free bis zu drei Editors, fünf Projekte, begrenzte AI-Nutzung und einfache Maschinen; Team wird derzeit mit 39 US-Dollar pro Editor und Monat bei jährlicher Abrechnung angezeigt, Enterprise ist individuell. Bezahlt werden Editor- und Admin-Sitze, nicht Viewer-Sitze. In die Rechnung gehören außerdem zusätzliche Maschinen- und GPU-Zeit, AI-Nutzung, Speicher, Datenbankkosten, GitHub- oder Warehouse-Betrieb, Monitoring, Schulung und die Pflege der Analyse. Ein günstiger Pilot kann daher teuer werden, wenn er unkontrolliert sensible Daten kopiert oder eine unklare manuelle Routine zur „Pipeline“ erklärt.

## Redaktionelle Einschätzung

Deepnote ist empfehlenswert für Daten- und Analytics-Teams, die gemeinsam an nachvollziehbaren Notebooks arbeiten und schnell von einer Frage zu einer geprüften Analyse kommen wollen. Der Mehrwert ist real, wenn die Datenquelle, Rollen, Review-Punkte und Übergabe definiert sind und Run Snapshots oder Git-Exporte in den bestehenden Kontrollprozess passen. Für stark regulierte oder vollständig selbst betriebene Umgebungen, komplexe Produktionspipelines und Teams, die primär lokale Entwicklungsfreiheit brauchen, sind JupyterLab, Databricks oder ein Orchestrator die passendere Wahl. Unser Urteil: als kollaborative Analyse- und Prototyping-Schicht überzeugend, als alleinige Produktionsplattform zu eng.

## Alternativen

- [JupyterLab](/tools/jupyterlab/): Lokale und selbst betreibbare Notebook-Umgebung mit maximaler Kontrolle über Kernel, Dateien und Infrastruktur.
- [Google Colab](/tools/google-colab/): Schneller cloudbasierter Notebook-Einstieg, besonders für Einzelpersonen und leichte Experimente im Google-Ökosystem.
- [Databricks](/tools/databricks/): Breitere Lakehouse-Plattform für skalierbare Datenverarbeitung, Jobs, Governance und ML-Betrieb.
- [RStudio](/tools/rstudio/): R-zentrierte Entwicklungsumgebung, wenn statistische Arbeit und reproduzierbare R-Projekte im Mittelpunkt stehen.
- [Observable](/tools/observable/): Interaktive, weborientierte Datenvisualisierung, wenn die öffentliche oder eingebettete Darstellung wichtiger ist als ein allgemeines Python-Projekt.

## FAQ

**Ist Deepnote nur für Python geeignet?**

Nein. Die Notebook-Dokumentation beschreibt Code-, SQL-, Text-, Chart- und Input-Blöcke; Python und SQL sind die zentralen Wege. Andere Sprachen und Umgebungen können eingeschränkt sein und sollten mit dem konkreten Projekt geprüft werden.

**Kann Deepnote eine Produktionspipeline ersetzen?**

Nur für begrenzte, klar überwachte Abläufe. Zeitpläne, Snapshots und API-Ausführung helfen, aber ein Projekt hat höchstens einen geplanten Notebook-Lauf. Für komplexe Abhängigkeiten, Retries und getrennte Deployments braucht es meist zusätzliche Plattformen.

**Wie exportiert ein Team die Arbeit?**

Notebooks lassen sich als `.ipynb` exportieren. Team- und Enterprise-Workspaces können laut Dokumentation außerdem nach GitHub oder GitLab exportieren; dabei muss das Team bewusst entscheiden, ob Outputs mit potenziell sensiblen Daten eingeschlossen werden.

**Darf Deepnote AI auf vertrauliche Daten zugreifen?**

Das muss aktiv konfiguriert und organisatorisch freigegeben werden. Notebook-Inhalt und Metadaten können an Partner-LLM-Anbieter gehen; der Zugriff auf Block-Outputs lässt sich abschalten. Für sensible Projekte kann ein Workspace-Admin Deepnote AI deaktivieren.

**Wie sollte ein Team die Kosten testen?**

Starte mit einer begrenzten Analyse und erfasse Editors, Maschinen- und GPU-Nutzung, AI-Verbrauch, Speicher sowie externe Warehouse-Kosten. Vergleiche diese Summe mit der Zeit für Review, Wartung und Übergabe, nicht nur mit dem ersten Free-Experiment.
