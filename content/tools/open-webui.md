---
slug: open-webui
title: Open WebUI
editorial_reviewed: true
editorial_verdict: caution
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-31
editorial_status: manual_polished
editorial_batch: 2026-07-31-story-card-refresh-20
category: AI Chatbots
price_model: Open Source
description: Self-hosted AI workspace for local and API-connected models, scoped knowledge, roles, tools, and governed team access.
tags: ["assistant", "chatbot"]
official_url: "https://openwebui.com"
popularity: 82
tier: C
generated_at: 2026-05-16
updated_at: 2026-07-31
---
# Open WebUI

## Kurzurteil

Ein internes Support-Team soll technische Handbücher durchsuchen. Allgemeine Fragen dürfen an ein starkes Cloud-Modell gehen, vertrauliche Produktnotizen nur an ein lokales Modell. Open WebUI kann beide Zugänge unter einer gemeinsamen Oberfläche anbieten, pro Gruppe Knowledge Bases freigeben und Websuche oder Code Interpreter gezielt aktivieren. Der gefährlichste Schalter ist dabei nicht das Modell: Wer Workspace Tools erstellen darf, erhält praktisch die Möglichkeit, Python-Code mit den Rechten des Backends auszuführen.

Open WebUI ist deshalb mehr als eine hübsche Oberfläche für lokale Modelle. Es kann ein selbst betriebener KI-Arbeitsplatz für Teams werden. Wir **empfehlen** es für Organisationen mit technischem Betreiber, klaren Datenzonen und bewusstem Berechtigungsmodell. Ohne Admin, Updates und Backups ist Self-Hosting keine Datenschutzstrategie, sondern nur zusätzlicher Betrieb.

## Was Open WebUI heute ist

Open WebUI ist eine Open-Source-Weboberfläche für lokale und API-kompatible Modelle. Nutzer können Chats, Modelle, Prompts, Knowledge Bases und je nach Freigabe weitere Funktionen verwenden. Rollen- und Gruppenrechte steuern, welche Arbeitsbereiche und Features zugänglich sind.

Knowledge speichert Dokumente und Sammlungen für Retrieval. Ein Modell kann auf angehängte Wissensbestände begrenzt werden; Zugriff auf das Modell allein umgeht nicht die Rechte der zugrunde liegenden Dateien. Für neue Erweiterungen setzt das Projekt auf Tools und Functions. Ältere Pipelines gelten in der aktuellen Dokumentation als Legacy und sollten nicht die Basis eines neuen Deployments sein.

## Ein realistischer Team-Rollout

Der Pilot startet mit einem nicht vertraulichen Handbuchbestand und zwei Gruppen. Support darf die freigegebene Knowledge Base lesen, aber keine Modelle, Prompts oder Tools importieren. Administratoren konfigurieren ein lokales Modell für interne Dokumentfragen und einen getrennten Cloud-Zugang für allgemeine Formulierungsarbeit.

Das Team testet konkrete Fragen mit erwarteten Quellen. Antworten müssen relevante Passagen nennen und dürfen bei fehlendem Beleg nicht improvisieren. Danach werden Rechtefälle geprüft: Kann ein Nutzer eine nicht freigegebene Knowledge Base finden? Bleiben Cloud- und lokale Datenwege getrennt? Was steht im Backup?

Tools werden zunächst vollständig deaktiviert. Später erhält nur eine kleine Admin-Gruppe Zugriff auf geprüfte Erweiterungen. Community-Code wird wie Servercode behandelt: Revision prüfen, in einer Testinstanz ausführen und Netzwerk- sowie Dateirechte begrenzen.

## Für wen ist Open WebUI geeignet?

- Teams, die lokale und mehrere externe Modelle in einer Oberfläche bündeln
- Organisationen mit eigener Infrastruktur und technischem Betriebsverantwortlichen
- Interne Wissensassistenten mit gruppenbasierten Dokumentrechten
- Entwickler und Power User, die Modelle, Prompts und Funktionen kontrolliert testen
- Umgebungen, die Datenwege und Anbieterwahl nicht vollständig einem SaaS-Chat überlassen wollen

Weniger geeignet ist Open WebUI für Teams, die keinen Dienst patchen, überwachen, sichern und bei Sicherheitsupdates kurzfristig warten können.

<figure class="tool-editorial-figure">
  <img src="/images/tools/open-webui-editorial.webp" alt="Illustration zu Open WebUI: ein geschütztes Berghaus ordnet lokale Modellkapseln und private Datenwege" loading="lazy" decoding="async" />
</figure>

## Typische Einsatzszenarien

- **Lokaler Modellchat:** Modelle auf eigener Hardware über eine zugängliche Oberfläche nutzen.
- **Multi-Provider-Arbeitsplatz:** Lokale und API-basierte Modelle nach Aufgabe auswählen.
- **Interne Knowledge Bases:** Dokumente für semantische und genaue Suche bereitstellen.
- **Teamzugang:** Gruppen, Features und Freigaben zentral steuern.
- **Geprüfte Tools:** Modelle kontrolliert um interne Funktionen erweitern.
- **Modellvergleich:** Dasselbe Testset über mehrere Modelle und Konfigurationen prüfen.

## Stärken

- Self-hosted Oberfläche mit großer Modellfreiheit
- Gruppen- und Feature-Rechte unterstützen getrennte Nutzerrollen
- Knowledge kann auf freigegebene Bestände und Modelle zugeschnitten werden
- Lokale und Cloud-Modelle lassen sich in einer Arbeitsumgebung kombinieren
- Aktive Open-Source-Entwicklung und umfangreiche Konfiguration

## Grenzen und Risiken

- Betreiber verantworten Updates, Backups, Verfügbarkeit und sichere Konfiguration
- Tools und Functions können beliebigen Python-Code mit Backend-Rechten ausführen
- Ein angebundenes Cloud-Modell macht den jeweiligen Datenweg nicht lokal
- RAG kann relevante Passagen verfehlen oder falsch zusammenfassen
- Schnelle Versionsentwicklung verlangt kontrollierte Upgrades und Migrationstests

## Workflow-Fit

Ein vernünftiger Start besteht aus einem Modell, einer Knowledge Base, einer Gruppe und einem klaren Fragenkatalog. Erst wenn Quellenqualität, Rechte und Betrieb funktionieren, kommen weitere Modelle oder Features hinzu. Default Permissions sollten restriktiv sein; zusätzliche Rechte werden gruppenweise vergeben.

Besonders wichtig ist die Trennung zwischen „Tool verwenden“ und „Tool erstellen“. Letzteres ist administrativer Codezugriff und gehört nicht an normale Nutzer.

## Datenschutz & Betrieb

Self-Hosting hält nur jene Daten lokal, die nicht an externe Modell-, Such-, OCR- oder andere Dienste weitergegeben werden. Jede Verbindung muss einzeln dokumentiert werden. Logs, Chatverläufe, Dokumente, Embeddings und Backups gehören in das Lösch- und Berechtigungskonzept.

Die Instanz braucht TLS, sichere Authentifizierung, minimale Container- und Dateirechte, Datenbank-Backups und einen Updatepfad. Öffentliche Erreichbarkeit sollte nicht der Standard eines internen Piloten sein.

## Preise & Kosten

Open WebUI ist Open Source. Kosten entstehen durch Hardware, Modellbetrieb, externe APIs, Speicher, Administration und Ausfallsicherheit. Ein lokales Modell kann API-Kosten senken, dafür aber GPU, Strom und Wartung erfordern.

**Zum Anbieter:** https://openwebui.com

## Alternativen

- [Jan AI](/tools/jan-ai/): Lokale Alternative für persönliche Modelltests und Einzelplatz-Workflows.
- [LM Studio](/tools/lm-studio/): Grafische lokale Modellverwaltung am Arbeitsplatz.
- [ChatGPT](/tools/chatgpt/): Gehostete allgemeine Arbeitsumgebung ohne eigenen Plattformbetrieb.
- [Hugging Face Spaces](/tools/hugging-face-spaces/): Für das Veröffentlichen und Teilen von Modell-Demos statt eines internen Chatdienstes.

## Redaktionelle Einschätzung

**Redaktionelles Verdikt: Mit Vorbehalt.**

Open WebUI ist eine starke Kontrollfläche, aber kein Sicherheitsprodukt aus der Schachtel. Seine größte Stärke, die Erweiterbarkeit, ist zugleich sein größtes Risiko. Ein kleiner, restriktiver Rollout mit sauber getrennten Datenwegen ist wesentlich überzeugender als eine Instanz, die sofort jedes Modell, jede Knowledge Base und jedes Community-Tool öffnet.

**Redaktioneller Verdict:** Empfohlen für selbst betriebene Team-Arbeitsplätze mit accountable Admin. Mit Vorbehalt für ungeprüfte Plugins, breite Tool-Rechte und die Annahme, Self-Hosting mache jede Verbindung automatisch privat.

## FAQ

**Kann Open WebUI vollständig lokal laufen?**

Ja, wenn Instanz, Modelle, Suche, Knowledge und alle Zusatzdienste lokal betrieben werden.

**Kann es Cloud-Modelle anbinden?**

Ja. Dann verlassen die entsprechenden Anfragen die lokale Umgebung gemäß dem jeweiligen Anbieter.

**Was ist Knowledge?**

Ein Bereich für Dokumente und Sammlungen, die Modelle über Retrieval durchsuchen können.

**Ersetzt RAG die Quellenprüfung?**

Nein. Retrieval kann Passagen finden, garantiert aber weder Vollständigkeit noch richtige Schlussfolgerungen.

**Wie funktionieren Rechte?**

Default- und Gruppenrechte steuern Arbeitsbereiche, Teilen, Chatfunktionen und Features. Dokumentzugriff bleibt zusätzlich relevant.

**Warum ist Tools Access gefährlich?**

Er erlaubt das Erstellen oder Importieren von Code, der mit Backend-Rechten läuft. Diese Berechtigung ist praktisch root-äquivalent.

**Sollte man Pipelines neu einsetzen?**

Nein. Die aktuelle Dokumentation bezeichnet Pipelines als Legacy und empfiehlt integrierte Pipe- oder Filter-Functions.

**Was braucht ein Team für den Betrieb?**

Einen verantwortlichen Admin, Authentifizierung, TLS, Backups, Monitoring, Update- und Wiederherstellungsplan.
