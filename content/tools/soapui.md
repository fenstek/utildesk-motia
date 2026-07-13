---
slug: soapui
title: SoapUI
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-soapui-full-tool-card-editorial"
category: "AI Coding"
price_model: Freemium
tags: [api-testing, test-automation, developer-tools]
official_url: "https://smartbear.com/product/ready-api/api-functional-testing/"
description: "Open-Source-Werkzeug für wiederholbare SOAP- und REST-API-Tests mit Assertions, Testfällen, Mock-Services und einem Kommandozeilen-Runner."
popularity: 0
tier: "D"
generated_at: "2026-05-17"
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# SoapUI

SoapUI ist ein desktopbasiertes Open-Source-Werkzeug für funktionale Tests von SOAP-, REST- und HTTP-Schnittstellen. Es passt zu Teams, die aus einem WSDL- oder API-Vertrag reproduzierbare Testfälle, Assertions und Mock-Antworten bauen wollen. Für einen einzelnen schnellen Request ist ein schlanker Client meist angenehmer; der eigentliche Wert von SoapUI beginnt dort, wo ein Ablauf wiederholt, geprüft und später im Build ausgeführt werden soll.

## Für wen ist SoapUI geeignet?

SoapUI richtet sich an QA-Teams, Backend-Entwickler und Integrationsteams mit vielen Service-Grenzen. Besonders nachvollziehbar ist der Einsatz bei SOAP-Verträgen, XML-Nachrichten, Authentifizierungsketten und Regressionstests für ältere oder heterogene Systeme. Wer nur JSON-Endpunkte erkunden oder Requests mit dem Team teilen möchte, findet in moderneren API-Clients häufig einen kürzeren Weg. SoapUI verlangt dagegen etwas Bereitschaft, Projekte, TestSuites, TestCases und Testdaten sauber zu strukturieren.

<figure class="tool-editorial-figure">
  <img src="/images/tools/soapui-editorial.webp" alt="Illustration zu SoapUI: API-Rohrlabor mit Testdruck und Antwortventilen" loading="lazy" decoding="async" />
</figure>

## Was steckt im Testprojekt?

Ein SoapUI-Projekt bündelt Services, TestSuites, TestCases und einzelne TestSteps. Requests werden mit Assertions versehen, etwa für HTTP-Status, XML-Schema, SOAP Faults, XPath- oder JSON-Inhalte. Properties und Property Expansions helfen, Hostnamen, IDs und Zugangsdaten zwischen Schritten und Umgebungen zu trennen. Für datengetriebene Abläufe können Testdaten aus Dateien oder Datenquellen in Schleifen durch einen TestCase geführt werden. Groovy-Skripte erweitern diesen Ablauf, sollten aber nur dort eingesetzt werden, wo deklarative TestSteps nicht ausreichen.

## Praktischer Workflow

Ein belastbarer Einstieg ist ein kleiner Vertragstest statt einer großen Sammlung von Klicks:

- WSDL, OpenAPI-nahe Beschreibung oder einen bekannten Endpoint importieren und einen realistischen Happy Path auswählen.
- Pro Request mindestens eine fachliche Assertion ergänzen; ein grüner HTTP-Status allein beweist noch keine korrekte Antwort.
- Fehlerfälle, abgelaufene Tokens, leere Felder und unerwartete SOAP Faults als eigene TestCases festhalten.
- Umgebungswerte und Testdaten aus dem Projektcode herausziehen und gegen eine ungefährliche Staging-Instanz laufen lassen.
- Den TestRunner lokal und danach im CI mit demselben Projektfile ausführen; Fehlermeldungen, Reports und Testdaten gehören in die Nachvollziehbarkeit des Builds.

## Mocks und Integration

MockServices simulieren REST- oder SOAP-Antworten, bevor die echte Implementierung verfügbar ist. Ein WSDL kann als Ausgangspunkt dienen; Responses lassen sich statisch, in Sequenzen oder per Script auswählen. Das ist praktisch, wenn ein Client parallel zum Server entwickelt wird oder ein seltener Fehler reproduziert werden muss. Die Grenze ist wichtig: Ein Mock kennt weder die vollständige Netzwerktopologie noch die tatsächlichen Daten, Timeouts und Nebenwirkungen des Live-Systems. Er ersetzt deshalb keinen Vertragstest gegen eine realistisch betriebenen Staging-Service.

SoapUI bringt einen Kommandozeilen-Runner mit. Damit können TestSuites oder einzelne TestCases aus einem Build-Job gestartet werden; Maven-, Jenkins- oder andere CI-Aufrufe sind dann eine Frage der Teamumgebung, nicht einer magischen SoapUI-Garantie. Vor der Integration sollte der Exit-Code bei Fehlern, die Ausgabe der Reports und das Verhalten bei nicht erreichbaren Services bewusst geprüft werden.

## Qualität und Grenzen

Die wichtigste Qualitätskontrolle ist die Trennung von Transport-, Schema- und Fachassertions. Ein Test, der nur prüft, ob XML parsebar ist, findet keinen falschen Kontostand. Umgekehrt führt eine überpräzise Assertion auf volatile IDs zu unnötigem Rauschen. Für jeden TestCase sollte feststehen, welche Regression er verhindert, welche Testdaten er braucht und wie ein Fehler reproduziert wird. Lasttests und Security-Checks sind keine automatische Freigabe: Sie benötigen ein abgesprochenes Zielsystem, ein Lastprofil und eine Auswertung durch verantwortliche Personen. Für umfangreiche Parallelisierung, zentrale Ausführung oder erweiterte kommerzielle Funktionen ist ReadyAPI die getrennte Produktentscheidung, nicht einfach die gleiche kostenlose Installation.

## Datenschutz und Betrieb

API-Projekte enthalten schnell Bearer-Tokens, Basic-Auth-Daten, Kundennummern oder komplette XML-Payloads. Solche Werte gehören nicht in Git, Screenshots oder gemeinsam exportierte Projektdateien. Nutze synthetische Daten, begrenze Berechtigungen auf Staging und prüfe, welche Logs und Reports CI-Artefakte werden. Bei Groovy-Skripten kommen Dateizugriffe, Datenbankverbindungen und externe Aufrufe hinzu; diese Abhängigkeiten müssen wie Testcode reviewed und reproduzierbar installiert werden. Mocks sollten nur an kontrollierten Interfaces und Ports lauschen und niemals als vermeintlicher Ersatz für einen abgesicherten Produktionsdienst veröffentlicht werden.

## Preis und laufender Aufwand

SoapUI Open Source wird vom Anbieter als kostenlos und Open Source beschrieben. Kosten entstehen trotzdem durch Rechner oder CI-Ausführung, Pflege der Testdaten, Staging-Services, Reports und die Zeit für stabile Assertions. ReadyAPI ergänzt kommerzielle Module wie Test, Performance oder Virtualization; Preise und Lizenzbedingungen sind daher vor einer Beschaffung direkt bei SmartBear zu prüfen. Bei einem Teamvergleich zählt nicht nur die Lizenz, sondern auch die Frage, ob vorhandene SOAP-Projekte, Runner und Kenntnisse weiterverwendet werden können.

## Alternativen

- [Postman](/tools/postman/): Kürzerer Einstieg für moderne REST- und JSON-Workflows, Collections und geteilte Request-Beispiele; weniger naheliegend, wenn WSDL- und XML-Regressionen im Zentrum stehen.
- [Insomnia](/tools/insomnia/): Schlanker API-Client für Entwickler, die Requests und Umgebungen schnell bearbeiten möchten, statt ein umfangreiches Testprojekt zu modellieren.
- [Hoppscotch](/tools/hoppscotch/): Browsernaher Weg für explorative HTTP-Anfragen und leichte Zusammenarbeit, nicht der erste Kandidat für lokale SOAP-Testprojektpflege.
- [Bruno](/tools/bruno/): Git-freundlicher, dateibasierter API-Client für Teams, die Collections versionieren wollen und bewusst eine lokale Alternative zu cloudlastigen Workflows suchen.

## Redaktionelle Einschätzung

SoapUI ist empfehlenswert für QA- und Integrationsteams, die SOAP, XML und wiederholbare Service-Verträge über GUI und TestRunner absichern müssen. Es liefert Wert, wenn Assertions fachlich aussagekräftig sind, Testdaten getrennt bleiben und ein Staging- oder Mock-Workflow regelmäßig im CI ausgeführt wird. Für einzelne REST-Aufrufe, browserbasierte Exploration oder ein sehr leichtgewichtiges Git-Collection-Modell ist eine der genannten Alternativen die bessere Wahl. Die Entscheidung sollte an Protokollmix, vorhandenen Projektdateien, benötigter CI-Ausführung und Pflegeaufwand hängen, nicht am Etikett "Freemium".

## FAQ

**Kann SoapUI kostenlos im Team eingesetzt werden?**

Die Open-Source-Ausgabe wird offiziell als kostenlos beschrieben. Teamkosten für CI-Runner, Testumgebungen, Pflege und gegebenenfalls kommerzielle ReadyAPI-Module bleiben davon unberührt; Lizenzdetails sollten vor der Verteilung geprüft werden.

**Ist SoapUI nur für SOAP geeignet?**

Nein. SoapUI testet auch REST- und HTTP-Schnittstellen. SOAP und WSDL sind jedoch Bereiche, in denen die Projekt- und Assertion-Struktur besonders gut zum Problem passt.

**Sind MockServices für Produktion geeignet?**

Nein. Sie liefern definierte Testantworten und helfen bei Client- oder Fehlerszenarien, bilden aber Daten, Betrieb und Nebenwirkungen eines echten Dienstes nicht vollständig ab.

**Wie kommt ein SoapUI-Test in CI?**

Projekt, TestSuite oder TestCase wird über den mitgelieferten Kommandozeilen-Runner gestartet. Vor dem Rollout sollten Exit-Code, Report-Speicherort, Secrets und das Verhalten bei nicht erreichbaren Abhängigkeiten in einem kleinen Pilotjob geprüft werden.
