---
slug: bruno
title: Bruno
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Entwickler-Tools"
price_model: Open Source
tags: [api, developer-tools, testing, open-source]
official_url: "https://www.usebruno.com/"
description: "Bruno ist ein lokaler, Git-orientierter API-Client für Requests, Tests und reproduzierbare CLI-Läufe mit Textdateien statt verpflichtender Cloud-Synchronisierung."
popularity: 0
tier: "D"
generated_at: "2026-05-17"
updated_at: 2026-07-14
---
# Bruno

Bruno ist ein API-Client für Entwicklerteams, die Requests, Tests und Umgebungen als Dateien in einem Repository verwalten möchten. Collections liegen lokal auf dem Dateisystem und werden in Brunos textbasiertem Bru-Format gespeichert; über die CLI lassen sie sich im Terminal oder in CI ausführen. Das ist bewusst kein cloudzentriertes Team-Postfach: Zusammenarbeit, Review und Zugriffskontrolle bleiben Aufgaben von Git, Secret-Management und dem eigenen Build-System.

<figure class="tool-editorial-figure">
  <img src="/images/tools/bruno-editorial.webp" alt="Dunkles API-Testlabor mit Proben, Ventilen und Kabeln" loading="lazy" decoding="async" />
</figure>

## Was Bruno leistet

Bruno bündelt HTTP- und API-Arbeit in Collections: Requests, Ordner, Variablen, Authentifizierung, Tests und Skripte bleiben neben dem Projektcode nachvollziehbar. Die offizielle Produktseite nennt unter anderem HTTP, REST, GraphQL und gRPC. Der relevante Vorteil ist die Nähe zum Entwicklungsprozess: Ein Request kann als reproduzierbare Datei reviewed, geändert und mit demselben Collection-Stand erneut ausgeführt werden.

## Bausteine im Arbeitsprozess

Eine Collection bildet typischerweise einen Dienst oder einen fachlichen Ablauf ab. Umgebungen halten etwa Base-URL und nicht-sensitive Konfiguration; Variablen können auf Collection-, Ordner-, Request- oder Laufzeitebene liegen. Der CLI-Lauf `bru run` kann eine ganze Collection, Ordner oder einzelne Requests ausführen, Tests-only-Läufe filtern und Daten aus CSV- oder JSON-Dateien verwenden. Für Skripte ist der Safe Mode der CLI der Standard; Dateisystem- oder externe npm-Zugriffe müssen bewusst über den Developer Mode erlaubt werden.

## Praktischer Einstieg

Lege zuerst eine kleine Collection in einem separaten Repository an und importiere nur einen echten, nicht kritischen Ablauf. Definiere eine lokale Umgebung, markiere Smoke-Tests und prüfe Erfolg nicht nur anhand eines HTTP-Statuscodes, sondern auch anhand von Schema, Pflichtfeldern und erwarteten Fehlerantworten. Danach kommt ein zweiter Lauf für Staging hinzu. Erst wenn Variablen, Authentifizierung, Testdaten und Aufräumschritte verständlich sind, gehört die Collection in einen breiteren Team-Workflow.

## Git, CLI und Betrieb

Im Open-Source-Umfang werden Git-Operationen per Terminal oder einem Git-Client erledigt; die kostenpflichtigen Editionen ergänzen laut Preisseite unter anderem tiefere Git-Integration und Teamfunktionen. Für CI installierst du `@usebruno/cli` oder verwendest das offizielle Docker-Image und lässt `bru run` mit einem festgelegten Environment laufen. Reports, Tags, Bail-on-failure und parallele Ausführung helfen, den Lauf in eine Pipeline einzuordnen. Plane trotzdem Node-/Docker-Version, Runner-Netzwerk, Testdaten und die Aufbewahrung von Reports als eigene Betriebsentscheidungen ein.

## Qualität und Grenzen

Bruno macht einen Request reproduzierbar, ersetzt aber weder API-Vertrag noch Monitoring oder Lasttest-Strategie. Miss den Nutzen an wenigen Kriterien: Sind Fehler in CI verständlich, bleibt die Collection nach einem API-Change wartbar, und kann ein anderes Teammitglied den Lauf ohne lokale Sonderkonfiguration wiederholen? Für hohe Last, zentrale Testfallverwaltung, browserbasierte End-to-End-Szenarien oder stark delegierte Freigaben kann ein spezialisierter Dienst besser passen. Prüfe vor der Einführung außerdem Importqualität und Unterschiede zwischen GUI- und CLI-Lauf.

## Datenschutz, Sicherheit und Governance

Bruno ist laut Projektbeschreibung offline-only; die lokale Speicherung ist eine gute Grundlage für Datenminimierung, aber keine automatische Sicherheitsfreigabe. API-Schlüssel, JWTs und andere Geheimnisse gehören nicht in `.bru`-Dateien oder Git. Die Dokumentation empfiehlt eine `.env`-Datei, einen passenden `.gitignore`-Eintrag und eine `.env.sample` ohne Werte; in CI sollten Secrets aus dem Runner-Secret-Store kommen und über Variablen injiziert werden. Begrenze Testkonten, maskiere Reports, prüfe Log-Ausgaben und entscheide, wer Collections ändern oder produktionsnahe Endpunkte aufrufen darf. MIT-Lizenz, Paketquellen, Updates und interne Freigaben gehören in den üblichen Open-Source-Governance-Prozess.

## Kosten und laufender Aufwand

Das Open-Source-Angebot ist mit $0 ausgewiesen. Die offizielle Preisseite nennt außerdem Pro mit $6 pro Nutzer und Monat sowie Ultimate mit $11 pro Nutzer und Monat, jeweils bei jährlicher Abrechnung; dort werden zusätzliche Integrationen, Funktionen und Support nach Plan beschrieben. Preise und Leistungsumfang solltest du vor dem Einkauf erneut prüfen. Auch beim kostenlosen Kern entstehen Kosten durch CI-Minuten, Docker- oder Runner-Betrieb, Pflege der Collections, Secret-Management, Schulung und die Umstellung bestehender Postman-/Insomnia-Exporte. Rechne diese internen Aufwände gegen den Wert reproduzierbarer, repository-naher Tests.

## Redaktionelle Einschätzung

Bruno empfehlen wir Entwicklerteams mit Git-Kompetenz, die API-Collections neben dem Code versionieren und lokal oder in CI reproduzierbar prüfen wollen. Der Wert ist am größten, wenn ein klarer Repository-Eigentümer, sichere Testumgebungen und ein Review-Prozess vorhanden sind. Für Organisationen, die sofort zentrale Cloud-Zusammenarbeit, umfangreiche Rollenverwaltung oder ein fertiges Lasttest- und Monitoring-Produkt brauchen, ist eine engere Alternative wahrscheinlich die bessere Entscheidung. Der faire Pilot ist eine kleine Collection mit einem positiven und mehreren absichtlich fehlerhaften Fällen, einem CI-Lauf und einer dokumentierten Geheimnisstrategie.

## Alternativen

- [Postman](/tools/postman/): Breiteres Cloud- und Kollaborationsangebot für Teams, die zentrale Workspaces und viele Integrationen höher gewichten als lokale Dateien.
- [Insomnia](/tools/insomnia/): API-Client mit starkem Fokus auf Design, Requests und Entwicklerworkflow; sinnvoll, wenn OpenAPI-nahe Arbeit im Vordergrund steht.
- [Hoppscotch](/tools/hoppscotch/): Browserorientierter, schneller API-Client für spontane Requests und leichtgewichtige Zusammenarbeit.
- [SoapUI](/tools/soapui/): Geeigneter, wenn SOAP- und funktionale Service-Tests den Schwerpunkt bilden und ein etablierter Testfokus wichtiger ist als Brunos Dateimodell.

## FAQ

**Ist Bruno vollständig cloudfrei?**

Das Projekt beschreibt Bruno als offline-only und ohne geplante Cloud-Synchronisierung. Git-Server, CI, Docker Registry und andere von dir eingesetzte Dienste bleiben natürlich externe Systeme.

**Wie kommen Tests in die CI?**

Installiere die Bruno CLI im Runner oder nutze das offizielle CLI-Docker-Image. Starte die Collection mit dem passenden Environment, injiziere Secrets aus dem CI-Secret-Store und lasse den Job bei Request- oder Assertion-Fehlern abbrechen.

**Dürfen API-Schlüssel in einer Collection liegen?**

Nein, nicht als echte Werte in versionierten Dateien. Nutze `.env` lokal nur mit `.gitignore`, in CI den Secret-Store und kontrolliere zusätzlich Reports, Debug-Logs und Beispielantworten auf versehentliche Leaks.

**Welche Kosten entstehen neben dem Open-Source-Angebot?**

Das Kernangebot ist laut Preisseite kostenlos; bezahlte Pro- und Ultimate-Pläne richten sich an zusätzliche Teamfunktionen und Support. Unabhängig davon müssen Runner, Pflege, Schulung und sichere Testdaten budgetiert werden.

**Wann ist Bruno nicht die passende Wahl?**

Wenn du zentrale Cloud-Workspaces mit fein abgestuften Rollen, browserbasierte End-to-End-Tests oder ein spezialisiertes Lasttestprodukt sofort brauchst, sollte der Pilot gegen diese Anforderungen und passende Alternativen verglichen werden.
