---
slug: amazon-bedrock-agentcore-browser
title: Amazon Bedrock AgentCore Browser
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: AI Infrastructure
price_model: Nutzungsbasiert
tags: [aws, browser-automation, ai-agents, infrastructure]
official_url: "https://aws.amazon.com/bedrock/agentcore/"
description: "Verwaltete, isolierte Browser-Laufzeit für KI-Agenten mit Sitzungssteuerung, Live-Ansicht, Aufzeichnung und AWS-Berechtigungsmodell."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# Amazon Bedrock AgentCore Browser

Amazon Bedrock AgentCore Browser stellt KI-Agenten eine verwaltete, isolierte Browser-Laufzeit bereit, damit sie Webseiten navigieren, Formulare ausfüllen und Informationen erfassen können. Der Dienst nimmt Teams den Betrieb eigener Browser-Container ab, löst aber nicht die fachliche Unsicherheit von Web-Automation: Zielseiten, Berechtigungen, Bestätigungen und Fehlerpfade müssen weiterhin ausdrücklich kontrolliert werden.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-bedrock-agentcore-browser-editorial.webp" alt="Isolierte Cloud-Browsersitzung mit Agentensteuerung, Live-Ansicht und kontrolliertem Netzwerkzugang" loading="lazy" decoding="async" />
</figure>

## Was ist AgentCore Browser und für wen ist es gedacht?

Der Dienst gehört zur Amazon-Bedrock-AgentCore-Plattform, kann aber als Browser-Werkzeug in eine eigene Agentenarchitektur eingebunden werden. Er passt zu AWS-Teams, die Browserinteraktionen in einer separat ausgeführten Umgebung benötigen und IAM, CloudWatch, CloudTrail, S3 sowie bestehende Betriebsprozesse nutzen möchten. Typische Fälle sind portalbasierte Recherche, das Ausfüllen nicht per API erreichbarer Masken und beaufsichtigte Backoffice-Abläufe.

Für stabile Systeme mit dokumentierter API ist eine direkte API-Integration meist schneller, günstiger und robuster. AgentCore Browser sollte deshalb nicht zum Standardweg für jede Integration werden, sondern die Lücke schließen, in der eine Weboberfläche tatsächlich der verfügbare Zugriffskanal ist.

## Welche Komponenten bilden eine Browsersitzung?

AWS bietet einen verwalteten Browser für den schnellen Einstieg und konfigurierbare eigene Browser-Ressourcen. Eine Anwendung startet eine isolierte Sitzung und erhält Endpunkte für Automation und Live View. Über die WebSocket-basierte Automation lässt sich der Browser per Chrome DevTools Protocol ansprechen; Playwright und Agentenframeworks können darauf aufsetzen. Eine zusätzliche InvokeBrowser-Schnittstelle steuert Maus, Tastatur und Screenshots auf Betriebssystemebene, wenn CDP etwa einen nativen Dialog nicht erreicht.

Sitzungen haben ein konfigurierbares Zeitlimit. Benutzerdefinierte Browser können Rollen, Netzwerkeinstellungen und eine Aufzeichnung in S3 erhalten. Live View erlaubt einem Menschen, den Lauf zu beobachten und bei Bedarf direkt einzugreifen. CloudWatch-Metriken, CloudTrail-Ereignisse und Session Replay ergänzen die technische Spur, ersetzen aber keine fachliche Ergebnisprotokollierung.

## Wie führt man einen Browser-Agenten kontrolliert ein?

Wählen Sie zunächst einen reversiblen Ablauf auf einer klar abgegrenzten Website. Definieren Sie Startzustand, erlaubte Domains, erwartete Seiten, Abbruchbedingungen und das strukturierte Ergebnis. Erstellen Sie eine Browser-Ressource mit minimaler IAM-Rolle und entscheiden Sie bewusst zwischen öffentlichem Netzwerk, VPC-Anbindung oder eigenem Proxy. Zugangsdaten gehören in einen verwalteten Secret-Prozess, nicht in Prompt oder Sitzungsprotokoll.

Testen Sie Navigation und Extraktion zuerst ohne schreibende Aktion. Danach können Sie einen einzelnen Formularschritt ergänzen, während Absenden, Kauf oder Veröffentlichung eine menschliche Bestätigung verlangt. Die Agentenanwendung sollte jede Sitzung mit einer fachlichen Task-ID verknüpfen, Zeitouts behandeln und bei unerwarteten Domains, Captchas oder Layouts sicher stoppen.

## Wie funktioniert die Integration im Betrieb?

Die Anwendung startet und beendet Sitzungen über AgentCore-APIs und streamt Automationsbefehle über den bereitgestellten Endpunkt. Für Standard-DOM-Aktionen bietet sich Playwright an; OS-Aktionen sind eine gezielte Ergänzung, keine universelle Ersatzsteuerung. Wer konstante Ausgangs-IP-Adressen benötigt, kann den Verkehr über einen eigenen Proxy leiten. Zugang zum Proxy und zu S3-Aufzeichnungen muss über getrennte, minimal berechtigte Rollen erfolgen.

Im Betrieb sind Sitzungslebensdauer, Parallelität, Fehlerquote, aktive CPU- und Speichernutzung sowie Zielseitenänderungen relevant. Ein Cleanup-Prozess beendet verwaiste Sitzungen. Aufzeichnungen erhalten eine begrenzte Retention, und Live View wird nur Rollen zugänglich gemacht, die auch die darin sichtbaren Daten sehen dürfen.

## Wie prüft man Zuverlässigkeit und Ergebnisqualität?

Ein Testkorpus sollte normale Seiten, verzögerte Inhalte, Login-Ablauf, modale Dialoge, Pagination, leere Ergebnisse und bewusst veränderte Selektoren enthalten. Bewertet werden nicht nur Task-Erfolg, sondern korrekte Datenerfassung, Zahl unnötiger Aktionen, Wiederanlauf nach Timeout und sichere Abbrüche. Für transaktionale Abläufe braucht jeder Schritt eine idempotente Prüfung, damit ein Retry keine doppelte Buchung oder Nachricht erzeugt.

Screenshots und Replay helfen bei der Diagnose, sind aber kein automatischer Wahrheitsbeleg. Vergleichen Sie extrahierte Werte mit einer bekannten Referenz und testen Sie die Agentenentscheidung separat von der Browsermechanik. Ein Produktionskandidat benötigt außerdem Lasttests mit realistischer Parallelität und ein Budget für Websites, die ihren Aufbau ohne Vorankündigung ändern.

## Welche Sicherheits- und Datenschutzgrenzen sind wichtig?

Die Container-Isolation trennt Webaktivität vom eigenen Host, verhindert aber nicht, dass ein Agent auf einer erlaubten Seite falschen Anweisungen folgt. Seiteninhalt ist untrusted input. Domain-Allowlisting, Egress-Regeln, minimale IAM-Rollen, getrennte Identitäten und ein Verbot irreversibler Aktionen ohne Freigabe begrenzen den Schaden. Sitzungs-Cookies und gespeicherte Profile sind Zugangsdaten und benötigen entsprechende Schutz- und Löschregeln.

Live View, Screenshots und Replay können personenbezogene oder vertrauliche Inhalte enthalten. Vor der Aktivierung sind Zweck, Speicherort, S3-Verschlüsselung, Retention und Zugriffsprotokollierung festzulegen. CloudTrail dokumentiert API-Aufrufe, nicht automatisch die fachliche Rechtmäßigkeit der vom Agenten vorgenommenen Handlung.

## Wie setzen sich die Kosten zusammen?

AgentCore Browser wird nach aktiver CPU- und Speichernutzung innerhalb der Sitzung abgerechnet. Leerlauf und I/O-Verhalten beeinflussen die Rechnung; genaue Preise hängen von Region und aktueller AWS-Preisliste ab. Zusätzlich können Kosten für das verwendete Sprachmodell, AgentCore Runtime oder Gateway, Datenübertragung, Proxy-Infrastruktur, S3-Aufzeichnungen sowie CloudWatch-Logs und -Metriken entstehen.

Messen Sie deshalb Kosten pro erfolgreich abgeschlossenem Vorgang statt nur pro Sitzung. Kurze Timeouts, kontrollierte Parallelität, frühe Abbrüche und direkte APIs für stabile Teilaufgaben reduzieren Verbrauch. Ein eigener Browsercluster kann bei sehr gleichmäßiger hoher Last wirtschaftlicher sein, verursacht dafür aber Patch-, Skalierungs- und Sicherheitsarbeit.

## Redaktionelle Einschätzung

Amazon Bedrock AgentCore Browser ist eine passende Wahl für AWS-orientierte Plattformteams, die agentische Webinteraktionen isolieren, beobachten und in ihr IAM-Modell integrieren müssen. Der größte Wert entsteht bei wechselnden, nicht per API erreichbaren Oberflächen mit klarer menschlicher Aufsicht. Für einfache Scrapes, lokale Tests oder gut dokumentierte APIs sind Playwright, Puppeteer oder eine direkte Integration schlanker und transparenter.

## Alternativen

- [Browserbase](/tools/browserbase/): Spezialisierte Cloud-Browser-Plattform für Automation, wenn eine AWS-native AgentCore-Umgebung nicht erforderlich ist.
- [Playwright](/tools/playwright/): Open-Source-Framework mit direkter Browserkontrolle für Teams, die Laufzeit und Skalierung selbst betreiben.
- [Puppeteer](/tools/puppeteer/): Schlankere JavaScript-Automation für Chromium-nahe Aufgaben ohne verwaltete Agentenplattform.
- [AWS Bedrock](/tools/aws-bedrock/): Breitere AWS-Modell- und Agentenplattform, wenn der Browser nur ein Teil einer umfassenden KI-Architektur ist.

## FAQ

**Ist AgentCore Browser nur mit Amazon-Bedrock-Modellen nutzbar?**

AgentCore ist auf Framework- und Modellflexibilität ausgelegt. Die Browser-Laufzeit wird über APIs angebunden; Modell, Agentenframework und Orchestrierung werden separat gewählt.

**Kann ein Mensch eine laufende Sitzung beobachten?**

Ja. Live View stellt einen Echtzeitblick auf die Browsersitzung bereit und erlaubt auch direkte Interaktion. Der Zugang sollte wegen möglicher vertraulicher Inhalte rollenbasiert begrenzt werden.

**Warum gibt es CDP- und OS-Aktionen?**

CDP eignet sich für DOM-basierte Navigation und Formulare. OS-Aktionen erreichen zusätzlich native Dialoge, Kontextmenüs, Tastenkürzel und vollständige Desktop-Screenshots.

**Ersetzt die Isolation eine Sicherheitsprüfung?**

Nein. Sie trennt die Browsersitzung vom eigenen System, aber Zielseiten können untrusted Inhalte liefern. Berechtigungen, Egress, Bestätigungen und Datenaufbewahrung bleiben Aufgabe des Betreibers.
