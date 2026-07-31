---
description: "Microsoft-Automation für Cloud-Flows, Desktop-RPA, Genehmigungen und kontrollierte Übergaben zwischen Microsoft 365 und Power Platform."
slug: "microsoft-power-automate"
title: "Microsoft Power Automate"
updated_at: "2026-07-31"
editorial_reviewed: true
editorial_verdict: recommend
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: "2026-07-31"
editorial_status: "manual_polished"
editorial_batch: "2026-07-31-story-card-refresh-20"
category: "AI Agents"
price_model: "Freemium"
tags: ["automation"]
official_url: "https://www.microsoft.com/power-platform/products/power-automate"
created_at: "2026-02-13"
popularity: 0
tier: "A"
lastReviewed: "2026-07-31"
mentionedIn: ["ki-tools-eu-datenverarbeitung-kleine-unternehmen", "make-vs-n8n-vs-zapier-rechnungsautomatisierung", "rechnungen-automatisch-aus-e-mails-auslesen-tools-workflows"]
---
# Microsoft Power Automate

## Kurzurteil

Eine Einkaufsanfrage landet in einer SharePoint-Liste. Unter 1.000 Euro darf die Teamleitung entscheiden, darüber muss Finance prüfen; nach drei Tagen ohne Antwort braucht es eine Eskalation. Power Automate kann aus dieser Regel einen Cloud-Flow machen, Genehmigungen per Mail oder App ausspielen und das Ergebnis mit Metadaten zurückschreiben. Der Unterschied zwischen guter und schlechter Automation zeigt sich am vierten Tag: Hat der Flow einen Timeout-Pfad oder wartet er still bis zum maximalen Laufzeitende?

Power Automate ist besonders überzeugend, wenn Microsoft 365, SharePoint, Teams, Dataverse und Entra bereits die Arbeitsumgebung bilden. Wir **empfehlen** es für kontrollierte Microsoft-nahe Prozesse mit klarer Administration. Außerhalb dieses Ökosystems oder bei sehr entwicklerzentrierten API-Flows sind andere Werkzeuge oft schlanker.

## Was Power Automate heute ist

Power Automate gehört zur Microsoft Power Platform und umfasst Cloud-Flows für Dienste und Ereignisse sowie Desktop-Flows für RPA. Trigger, Connectoren, Bedingungen, Schleifen und Genehmigungen lassen sich visuell kombinieren. Premium-Connectoren, Umgebungen, Dataverse und Governance-Funktionen hängen von Lizenz und Tenant-Konfiguration ab.

Run History zeigt Eingaben, Ausgaben und Fehler einzelner Aktionen. „Configure run after“ legt fest, was nach Erfolg, Fehler, Überspringen oder Timeout passiert. Scopes können einen Try/Catch-ähnlichen Aufbau bilden; Retry-Regeln helfen bei vorübergehenden Störungen. Diese Funktionen sind kein Zusatz für Perfektionisten, sondern die Grundlage produktiver Flows.

## Ein realistischer Genehmigungsablauf

Beim Anlegen der Einkaufsanfrage prüft der Flow Pflichtfelder, Währung und Kostenstelle. Der Betrag wird als Zahl behandelt, nicht als formatierten Text. Danach bestimmt eine Bedingung den Genehmiger. Die Approval-Aktion enthält Antrag, Betrag, Link zum Original und ein Ablaufdatum.

Eine Zustimmung aktualisiert Status, Zeitpunkt und Entscheider in SharePoint. Eine Ablehnung fordert einen Kommentar und benachrichtigt den Antragsteller. Nach Timeout greift ein eigener Pfad: Er eskaliert oder beendet den Lauf kontrolliert, statt unendlich auf eine Antwort zu hoffen.

Die Hauptaktionen liegen in einem Try-Scope. Ein Catch-Scope protokolliert Flow-ID und Fehlermeldung und informiert den Besitzer. Transiente Connectorfehler dürfen mit begrenztem Backoff wiederholt werden; fachliche Fehler wie eine ungültige Kostenstelle nicht. So bleibt die Genehmigung nachvollziehbar und reparierbar.

## Für wen ist Power Automate geeignet?

- Microsoft-365-Organisationen mit SharePoint, Teams, Outlook und Dataverse
- Fachbereiche, die Genehmigungen und Datenübergaben visuell abbilden
- IT-Teams, die Connectoren, Umgebungen und DLP-Richtlinien zentral steuern
- Unternehmen, die Cloud-Automation und Desktop-RPA verbinden
- Prozesse, bei denen Identität und Rollen aus dem Microsoft-Tenant genutzt werden sollen

Weniger geeignet ist Power Automate, wenn eine leichte Einzelautomation außerhalb der Microsoft-Welt genügt oder ein Team lieber codebasierte, gut versionierbare Integrationen baut.

<figure class="tool-editorial-figure">
  <img src="/images/tools/microsoft-power-automate-editorial.webp" alt="Illustration zu Microsoft Power Automate: redaktionelle Workflow-Szene zu Microsoft Power Automate mit toolbezogenen Arbeitsobjekten" loading="lazy" decoding="async" />
</figure>

## Typische Einsatzszenarien

- **Genehmigungen:** Einkäufe, Urlaub, Inhalte oder Verträge mit Antwort und Eskalation steuern.
- **SharePoint und Dataverse:** Datensätze validieren, weitergeben und Status synchronisieren.
- **Teams und Outlook:** Benachrichtigungen, Aufgaben und strukturierte Folgeprozesse auslösen.
- **Dokumentprozesse:** Dateien ablegen, Metadaten ergänzen und Prüfungen anstoßen.
- **Desktop-RPA:** Anwendungen ohne passende API über beaufsichtigte Desktop-Flows bedienen.
- **Fehlerbetrieb:** Run History, Scopes, Retry und Alerts für produktive Abläufe nutzen.

## Stärken

- Tiefe Einbettung in Microsoft 365, Power Platform und Tenant-Identitäten
- Genehmigungen sind als eigener, nachvollziehbarer Prozessbaustein vorhanden
- Cloud- und Desktop-Automation lassen sich in einem Portfolio verbinden
- Umgebungen, DLP und zentrale Administration unterstützen Enterprise-Governance
- Run History und Fehlerpfade machen Probleme analysierbar

## Grenzen und Risiken

- Lizenzlogik und Premium-Connectoren können komplex und teuer werden
- Persönliche Verbindungen brechen bei Rollenwechsel oder Passwortproblemen
- Große visuelle Flows werden ohne Scopes, Namensregeln und Child Flows schwer wartbar
- Ein erfolgreicher Lauf kann durch falsche Bedingungen trotzdem fachlich falsch sein
- Approval-, Webhook- und andere Warteaktionen brauchen explizite Timeouts

## Workflow-Fit

Beginnen Sie mit einem Prozess, dessen Regeln bereits schriftlich existieren. Testen Sie gültige Fälle, fehlende Felder, Ablehnung, Timeout, abgelaufene Verbindung und einen temporären Connectorfehler. Erst wenn jeder Pfad einen sichtbaren Endzustand hat, wird der Flow produktiv.

Ein Flow braucht Besitzer und Stellvertreter. Verbindungen sollten möglichst über geeignete Serviceidentitäten laufen; Änderungen gehören in eine Solution und durch geregelte Umgebungen, wenn der Prozess geschäftskritisch ist.

## Datenschutz & Governance

DLP-Richtlinien können verhindern, dass geschäftliche und nicht geschäftliche Connectoren unkontrolliert Daten austauschen. Berechtigungen auf SharePoint, Dataverse und Zielsystemen bleiben trotzdem entscheidend. Ein Flow erbt keine magische Fachberechtigung, sondern arbeitet mit den jeweiligen Connections.

Run History kann Nutzdaten enthalten. Aufbewahrung, Zugriff und Supportprozesse müssen zum Schutzbedarf passen. Bei Desktop-Flows kommen Zugangsdaten, lokale Sitzungen und der Zustand des Zielrechners hinzu.

## Preise & Kosten

Power Automate ist teilweise in Microsoft-Angeboten enthalten; Premium-Connectoren, Prozess- und Desktop-Szenarien können zusätzliche Lizenzen erfordern. Aktuelle Bedingungen sollten für den konkreten Connector und Ausführungsmodus geprüft werden. Administration, Support und RPA-Infrastruktur gehören in die Gesamtkosten.

**Zum Anbieter:** https://www.microsoft.com/power-platform/products/power-automate

## Alternativen

- [Zapier](/tools/zapier/): Für schnelle SaaS-Automationen mit geringerem Tenant- und Governance-Aufwand.
- [n8n](/tools/n8n/): Für entwicklernahe API-Flows und optionales Self-Hosting.
- [Make](/tools/make-ehemals-integromat/): Für detaillierte visuelle Datenflüsse und Mapping.
- [UiPath](/tools/uipath/): Für umfangreiche Enterprise-RPA- und Desktop-Automation.
- [Workato](/tools/workato/): Für zentral verwaltete Enterprise-Integration über viele Plattformen.

## Redaktionelle Einschätzung

**Redaktionelles Verdikt: Empfehlen.**

Power Automate ist kein bloßer „Wenn-dann“-Baukasten, sondern kann ein belastbarer Teil der Microsoft-Betriebslandschaft sein. Der Nutzen wächst mit vorhandener Microsoft-Integration; die Komplexität wächst mit Lizenz, Identitäten und Governance. Der gute Flow ist nicht der längste, sondern derjenige, dessen Fehler-, Ablehnungs- und Timeout-Pfade jeder Verantwortliche versteht.

**Redaktioneller Verdict:** Empfohlen für Microsoft-zentrierte Genehmigungen und Automationen mit klarer IT-Governance. Mit Vorbehalt für ungepflegte persönliche Connections und Prozesse ohne Fehlerbetrieb.

## FAQ

**Was ist ein Cloud-Flow?**

Ein durch Ereignis, Zeitplan oder manuellen Start ausgelöster Ablauf zwischen Cloud-Diensten.

**Was ist ein Desktop-Flow?**

Eine RPA-Automation, die Interaktionen auf einem Windows-Rechner oder in Desktop-Anwendungen ausführt.

**Kann Power Automate Genehmigungen abbilden?**

Ja. Approval-Aktionen erfassen Antworten und Metadaten und können weitere Pfade auslösen.

**Warum braucht eine Genehmigung ein Timeout?**

Ohne Ablauf und Timeout-Pfad kann ein Flow lange warten und endet ohne klare Eskalation.

**Wie werden Fehler behandelt?**

Mit Run-after-Regeln, Scopes, Retry-Policies, Protokollierung und Benachrichtigung.

**Was sind Premium-Connectoren?**

Connectoren oder Funktionen, die eine zusätzliche Power-Automate-Lizenz erfordern können.

**Kann ein Flow auf persönliche Konten angewiesen sein?**

Ja, aber das ist für produktive Prozesse riskant. Geeignete Serviceidentitäten und geregelte Ownership sind stabiler.

**Ist Power Automate nur für Microsoft-Dienste?**

Nein, es gibt viele Drittanbieter-Connectoren. Der größte Integrationsvorteil liegt dennoch im Microsoft-Ökosystem.

**Wie teste ich einen Flow?**

Mit normalen Fällen sowie fehlenden Daten, Ablehnung, Timeout, Berechtigungsfehlern und temporären Ausfällen.

**Was ist DLP?**

Data Loss Prevention-Richtlinien steuern, welche Connector-Gruppen Daten miteinander austauschen dürfen.

**Wann ist eine Alternative besser?**

Bei leichtem SaaS-Setup, codezentrierter Integration, Self-Hosting oder besonders umfangreicher RPA können Zapier, n8n oder UiPath besser passen.
