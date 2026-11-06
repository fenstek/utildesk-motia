---
slug: amazon-bedrock-agentcore-browser
title: Amazon Bedrock AgentCore Browser
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-11-06
editorial_status: "manual_polished"
editorial_batch: "2026-11-06-full-tool-card-editorial"
editorial_verdict: caution
editorial_verdict_headline: "Mit Vorbehalt: zuerst einen lesenden Ablauf prüfen"
editorial_verdict_text: "Die dokumentierten Isolations-, Live-View- und IAM-Funktionen passen, wenn ein Portal keinen geeigneten API-Zugang bietet. Beginnen Sie mit einem begrenzten Leseablauf und prüfen Sie Rechte, Netzwerk, Ergebnisqualität und Kosten im Zielkonto."
editorial_trust_label: "Quellen geprüft · 06.11.2026"
category: AI Infrastructure
price_model: Nutzungsbasiert
tags: [aws, browser-automation, ai-agents, infrastructure]
official_url: "https://aws.amazon.com/bedrock/agentcore/"
description: "Isolierte Browser-Laufzeit für Agenten mit Sitzungssteuerung, Live-Ansicht, optionaler Aufzeichnung und konfigurierbaren AWS-Berechtigungen und Netzwerken."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-11-06
---
# Amazon Bedrock AgentCore Browser

Amazon Bedrock AgentCore Browser stellt KI-Agenten eine verwaltete, isolierte Browser-Laufzeit bereit, damit sie Webseiten navigieren, Formulare ausfüllen und Informationen erfassen können. Der Dienst nimmt Teams den Betrieb eigener Browser-Container ab, löst aber nicht die fachliche Unsicherheit von Web-Automation: Zielseiten, Berechtigungen, Bestätigungen und Fehlerpfade müssen weiterhin ausdrücklich kontrolliert werden.

<figure class="tool-editorial-figure">
  <video autoplay muted loop playsinline loading="lazy" preload="none" width="1280" height="720" poster="/images/tools/amazon-bedrock-agentcore-browser-editorial.webp" aria-label="Browserfenster blenden in einer isolierten Cloud-Browserszene rund um einen Kompass sanft ein und aus.">
    <source src="/videos/tools/amazon-bedrock-agentcore-browser-motion-9c2b06a7c60e4ccb.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
    <img src="/images/tools/amazon-bedrock-agentcore-browser-editorial.webp" width="1280" height="720" alt="Isolierte Cloud-Browsersitzung mit Agentensteuerung, Live-Ansicht und kontrolliertem Netzwerkzugang" loading="lazy" decoding="async" />
  </video>
</figure>

## Was ist AgentCore Browser und für wen ist es gedacht?

Amazon Bedrock AgentCore Browser führt Webschritte eines Agenten in einer isolierten Cloud-Browsersitzung aus. Er ist für AWS-Teams interessant, wenn ein Portal keinen geeigneten API-Zugang bietet und die Sitzung in bestehende Berechtigungs- und Betriebsabläufe passen soll. Der Browser führt Interaktionen aus; er bestätigt weder selbst die fachliche Richtigkeit eines Werts noch macht er eine Folgeaktion sicher.

Bei einer stabilen, dokumentierten API sollte zuerst geprüft werden, ob sie den benötigten Vorgang abdeckt. Browser-Automation ist sinnvoll, wenn tatsächlich die Weboberfläche der Zugang ist, etwa für eine begrenzte Recherche oder ein beaufsichtigtes Backoffice-Verfahren.

## Welche Komponenten bilden eine Browsersitzung?

Für den Einstieg stellt AWS einen verwalteten Browser bereit; eigene Browser-Ressourcen erlauben unter anderem eigene IAM-Rollen, Netzwerkeinstellungen und Sitzungsaufzeichnung. Die Anwendung startet eine Sitzung mit Zeitlimit. Die Sitzungen sind isoliert; Live View zeigt den laufenden Browser und lässt einen berechtigten Menschen bei Bedarf eingreifen. Aufzeichnung ist für benutzerdefinierte Browser verfügbar und wird im eigenen S3-Bucket gespeichert. [AWS beschreibt verwaltete und benutzerdefinierte Browser, Live View und Recording in der Browser-Dokumentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-tool.html).

## Wie sieht ein sicherer Leseablauf aus?

Ein begrenztes Beispiel ist das Nachschlagen eines Vorgangs in einem Kundenportal. Die Eingabe besteht aus einer Vorgangs-ID und einem separaten Portal-Konto mit Leserechten. Die Anwendung startet eine Sitzung mit kurzem, zum Ablauf passendem Zeitlimit und lässt nur die benötigten Browser- und AWS-Ressourcen zu. Über die erlaubte Portal-Domain liest Playwright Status und Datum aus und gibt diese Werte zusammen mit Quell-URL und Abrufzeit strukturiert zurück.

Die Automatisierung klickt nicht auf „Senden“, „Freigeben“ oder ähnliche Schaltflächen. Ein Mensch vergleicht die Felder im Live View oder auf der Quellseite und bestätigt den Datensatz; unklare oder fehlende Werte bleiben als ungeprüft markiert. Bei einer unerwarteten Domain, abgelaufener Anmeldung, CAPTCHA oder geänderter Seite stoppt der Ablauf, statt weitere Klicks zu raten. Danach beendet die Anwendung die Sitzung ausdrücklich; AWS dokumentiert sowohl manuelles Stoppen als auch das Ende über den konfigurierten Timeout ([Sitzungsgrundlagen](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-resource-session-management.html), [Sitzungen verwalten](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-managing-sessions.html)).

## Was übernimmt der Browser gegenüber Modell und Orchestrator?

Die Browser-Ressource stellt die Ausführungsumgebung und die Verbindungen für eine Sitzung bereit. Das Modell interpretiert die Aufgabe und kann nächste Schritte vorschlagen. Die Agentenanwendung beziehungsweise der Orchestrator entscheidet, wann der Browser aufgerufen wird, welche Domains erlaubt sind, welches Ergebnisformat gilt und wo eine menschliche Freigabe nötig ist. Keine dieser Komponenten macht aus einer plausiblen Extraktion automatisch einen geprüften Geschäftsvorgang.

Für DOM-Navigation, Formulare und Auslesen lässt sich der WebSocket-Endpunkt über das Chrome DevTools Protocol (CDP) mit Playwright ansprechen. `InvokeBrowser` ergänzt Maus-, Tastatur- und Screenshot-Aktionen auf Betriebssystemebene, etwa für native Dialoge, die nicht im DOM liegen. Das ist eine andere Steuerungsebene, keine Zusage höherer Agentenzuverlässigkeit ([AWS zu CDP und OS-Aktionen](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-invoke.html)).

Die API kennt `PUBLIC` und `VPC` als Netzwerkmodi. Ein eigener Proxy wird separat als Sitzungskonfiguration angegeben und ist kein dritter Modus. Diese Browser-Proxy-Einstellung ersetzt keine Netzwerkdurchsetzung: Für privaten Zugriff und kontrollierten Egress kann VPC nötig sein. Benötigt eine VPC-Sitzung außerdem Zugriff auf öffentliche Portale, muss das Routing einschließlich NAT passen; ein öffentliches Subnetz allein stellt laut AWS keinen Internetzugang bereit ([Netzwerkmodi](https://docs.aws.amazon.com/bedrock-agentcore-control/latest/APIReference/API_BrowserNetworkConfiguration.html), [VPC-Zugang](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-vpc.html), [Browser-Proxys](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-proxies.html)).

## Wie prüft man Zuverlässigkeit und Ergebnisqualität?

Ein Testkorpus sollte normale Seiten, verzögertes Laden, abgelaufene Anmeldung, Dialoge, Pagination, leere Ergebnisse und geänderte Selektoren abdecken. Verglichen werden die extrahierten Felder mit bekannten Referenzwerten; zusätzlich zählen sichere Abbrüche und unnötige Aktionen. Für einen Schreibablauf braucht jeder Schritt eine eigene Prüfung gegen Doppelaktionen, und eine irreversible Übermittlung sollte bis zur ausdrücklichen menschlichen Bestätigung gesperrt bleiben.

Screenshots und Replay helfen bei der Fehlersuche, sind aber kein Wahrheitsbeleg. Prüfen Sie die Browsermechanik getrennt von der Entscheidung des Modells und beobachten Sie Zielseitenänderungen, Timeouts und Wiederholungen. Ein Agent kann auch mit funktionierendem Browser falsche Schlüsse ziehen.

## Welche Sicherheits- und Datenschutzgrenzen sind wichtig?

Die Isolation trennt die Browsersitzung vom eigenen Host, aber nicht den Agenten von irreführenden Anweisungen auf einer erlaubten Website. Behandeln Sie Seiteninhalt als nicht vertrauenswürdige Eingabe. Begrenzen Sie IAM auf die nötigen Browseraktionen und Ressourcen, verwenden Sie eine separate Portalidentität mit den passenden Leserechten und definieren Sie erlaubte Domains sowie Egress-Regeln. Zugangsdaten gehören in einen dafür vorgesehenen Secret-Prozess, nicht in den Prompt.

Browserprofile können Cookies und `localStorage` über Sitzungen hinweg erhalten. Änderungen werden erst mit einem ausdrücklichen Speichervorgang gesichert; Sitzungen mit demselben Profil bleiben voneinander unabhängig, und abgelaufene Website-Cookies werden nicht durch das Profil wieder gültig. IAM steuert den Zugriff auf Profile. Behandeln Sie sie deshalb wie Zugangsdaten und speichern Sie nur, was der Ablauf benötigt ([AWS zu Browserprofilen](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-profiles.html)).

Live View, Screenshots und Aufzeichnungen können vertrauliche Portalinhalte zeigen. Legen Sie vor dem Einschalten Zweck, Rollen, S3-Zugriff und Aufbewahrungsdauer fest. CloudTrail protokolliert API-Aufrufe, nicht die fachliche Richtigkeit oder Rechtmäßigkeit eines Ergebnisses.

## Wie setzen sich die Kosten zusammen?

AWS berechnet Browser-CPU nach tatsächlicher Nutzung und Speicher nach dem belegten Spitzenwert, jeweils in Sekundenintervallen über die Sitzung. Während einer I/O-Wartezeit kann die CPU-Abrechnung bei fehlender Hintergrundaktivität auf null fallen; Speicher und andere Ressourcen werden dadurch nicht pauschal kostenlos. Die [aktuelle AWS-Preisseite](https://aws.amazon.com/bedrock/agentcore/pricing/) nennt außerdem S3-Speicher für Profile und Netzwerkübertragung als mögliche Posten.

Je nach Aufbau kommen Modell, AgentCore Runtime oder Gateway, CloudWatch, Aufzeichnungen, Datenverkehr sowie eigene Proxy- oder NAT-Infrastruktur hinzu. Region, Konto und Konfiguration bestimmen den tatsächlichen Betrag; ein verlässlicher lokaler Rechnungsbetrag lässt sich ohne diese Angaben nicht versprechen. Beenden Sie Sitzungen, messen Sie Kosten pro geprüfter Aufgabe und kalkulieren Sie die zusätzlichen AWS-Ressourcen separat.

## Redaktionelle Einschätzung

**Redaktionelles Verdikt: Mit Vorbehalt.** AgentCore Browser passt zu AWS-Teams, deren Portal keinen geeigneten API-Zugang bietet und die isolierte Sitzungen, IAM, Netzwerkregeln und menschliche Prüfung selbst einrichten können. Beginnen Sie lesend und geben Sie Schreibaktionen erst nach einer nachvollziehbaren Prüfung frei. Für stabile API-Zugänge ist die direkte Schnittstelle der passendere Weg; für selbst betriebene Browser-Skripte kommt Playwright infrage, für einen gehosteten Browser außerhalb dieser AWS-Integration Browserbase.

## Alternativen

- [Browserbase](/tools/browserbase/): Gehostete Browser-Infrastruktur für Teams, die Browser-Sitzungen außerhalb ihrer AgentCore-Umgebung betreiben möchten.
- [Playwright](/tools/playwright/): Codegesteuerte Browser-Automation, wenn das Team Laufzeit und Betrieb selbst kontrollieren will.
- [Puppeteer](/tools/puppeteer/): JavaScript-Steuerung für Chromium-Aufgaben, wenn kein AgentCore-Sitzungsdienst benötigt wird.
- [Browser Use](/tools/browser-use/): Python-Bibliothek für Browser-Agenten, wenn das Team Agentenlogik und Browserbetrieb im eigenen Stack zusammensetzen möchte.

## FAQ

**Was macht der Browser selbst, und was bleibt beim Modell oder Orchestrator?**

Der Browser führt Navigation und Interaktionen in der Sitzung aus. Das Modell interpretiert die Aufgabe; die Agentenanwendung setzt Regeln, wählt Aufrufe, prüft das strukturierte Ergebnis und fordert bei Bedarf eine Freigabe an. Eine erfolgreiche Browseraktion ist noch kein Nachweis für ein richtiges Ergebnis.

**Lässt sich AgentCore Browser ohne Bedrock-Modell oder Agent-Framework mit Playwright nutzen?**

Ja. AWS dokumentiert die direkte Nutzung von AgentCore Browser mit Playwright ohne Agent-Framework oder Large Language Model (LLM); Playwright steuert dabei die Browsersitzung programmatisch. Das bezieht sich auf direkte Browser-Automation und sagt nicht aus, dass Agentenabläufe generell ohne Modell auskommen ([AWS-Playwright-Kurzanleitung](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-quickstart-playwright.html), [AgentCore-FAQs](https://aws.amazon.com/bedrock/agentcore/faqs/)).

**Kann ein Mensch eine laufende Sitzung beobachten?**

Ja. Live View zeigt die Sitzung in Echtzeit und ermöglicht direkte Interaktion. Beschränken Sie den Zugriff auf Rollen, die auch die dort sichtbaren Daten sehen dürfen.

**Warum gibt es CDP- und OS-Aktionen?**

CDP steuert DOM-basierte Navigation und Formulare. OS-Aktionen erreichen zusätzlich native Dialoge, Tastenkürzel oder den gesamten Bildschirm. Sie sind eine Ergänzung für Fälle, die der Browser-DOM nicht abdeckt.

**Ersetzt die Isolation eine Sicherheitsprüfung?**

Nein. Sie grenzt die Sitzung vom Host ab, verhindert aber nicht, dass Inhalte einer erlaubten Website den Agenten fehlleiten. IAM, Domain- und Egress-Regeln, menschliche Freigaben und Datenaufbewahrung bleiben nötig.

**Wie bleiben Anmeldedaten über mehrere Sitzungen erhalten?**

Ein Browserprofil kann Cookies und `localStorage` speichern. Das geschieht nur nach einem ausdrücklichen Speichervorgang; neue Sitzungen laden den gespeicherten Stand unabhängig, und Website-Cookies können ablaufen. Schützen Sie Profile deshalb per IAM.

**Ist ein Proxy ein eigener Netzwerkmodus?**

Nein. AgentCore Browser kennt `PUBLIC` und `VPC`; Proxy-Einstellungen werden separat an der Sitzung konfiguriert. Für Internetzugriff aus einer VPC kann NAT erforderlich sein, während der Browser-Proxy allein keine Netzwerkebene absichert.

**Ist die Browser-Sitzung in Wartezeiten kostenlos?**

Nicht pauschal. AWS rechnet CPU und Speicher nach der aktuellen Nutzungslogik ab; bei I/O-Wartezeit kann nur die CPU-Nutzung entfallen, während Speicher und weitere Dienste Kosten verursachen können. Prüfen Sie die Preise für Ihre Region und Ihr Konto.
