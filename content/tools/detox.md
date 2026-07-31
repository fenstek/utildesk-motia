---
slug: detox
title: Detox
editorial_reviewed: true
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-31
editorial_status: manual_polished
editorial_batch: 2026-07-31-story-card-refresh-50
category: "AI Agents"
price_model: Open Source
tags: [detox, qa, test-automation]
official_url: "https://www.detox.com/"
popularity: 0
description: "Detox testet mobile Anwendungen Ende-zu-Ende mit synchronisierten Aktionen und eignet sich für wenige geschäftskritische Nutzerabläufe."
tier: "C"
generated_at: "2026-05-11"
updated_at: 2026-07-31
---
# Detox

Nach einem Update scheitert der mobile Login nur im CI, lokal aber nicht. Das Team baut deshalb einen kleinen Detox-Test mit kontrollierten Fixtures, eindeutigen Aktionen und fachlichen Assertions, lässt ihn auf derselben App-Version und Emulator-Konfiguration laufen und speichert bei Fehlern Logs sowie Video. So wird Flakiness messbar statt weggeklickt. Detox hilft bei echten End-to-End-Risiken; für reine Komponentenlogik wären schnellere Tests die bessere Ebene.

Detox hilft, mobile Apps automatisiert so zu testen, wie Nutzer sie bedienen würden. Für React-Native-Teams ist es interessant, weil Tests näher an realen Interaktionen laufen als reine Unit-Tests.

Geeignet für Mobile-Teams, QA-Automatisierung und Projekte mit häufigen Regressionen in App-Flows.

## Für wen ist Detox geeignet?

Detox eignet sich für Mobile-Teams, besonders im React-Native-Umfeld, die kritische App-Flows automatisiert gegen echte Laufzeitbedingungen prüfen wollen. Es ist sinnvoll, wenn Login, Onboarding, Checkout, Berechtigungen oder Offline-Verhalten vor jedem Release zuverlässig getestet werden müssen.

Für kleine Apps ohne stabile Testumgebung kann Detox zu früh sein. Der Aufwand lohnt sich erst, wenn Build-Pipeline, Testdaten, Simulatoren und Verantwortlichkeiten sauber genug sind, damit E2E-Tests nicht ständig aus falschen Gründen brechen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/detox-editorial.webp" alt="Illustration zu Detox: Mobile QA-Team laesst App-Tests ueber Geraete und Pruefgates laufen" loading="lazy" decoding="async" />
</figure>

## Typische Einsatzszenarien

- Login-, Onboarding- und Checkout-Flows testen
- Regressionen vor Releases abfangen
- Mobile CI-Pipelines ergänzen
- Interaktionen auf Geräten oder Simulatoren automatisieren
- Push-, Permission- und Deep-Link-Flows absichern
- Release-Checks für besonders umsatz- oder supportkritische Wege automatisieren

## Stärken

- Stärker als reine Komponententests für echte Flows
- Gut für React-Native-nahe Projekte
- Hilft bei releasekritischen mobilen Pfaden

## Grenzen

- E2E-Tests können fragil sein
- Setup und CI-Stabilität brauchen Pflege
- Nicht jeder Test gehört auf diese Ebene

## Workflow-Fit

Detox gehört an das obere Ende der Testpyramide. Unit- und Integrationstests sollten schnelle Logik absichern, Detox prüft wenige, aber wichtige Nutzerflüsse so realistisch wie möglich.

Ein guter Workflow hält die Suite klein, stabil und releasekritisch. Wenn jede Kleinigkeit als E2E-Test modelliert wird, wird die Pipeline langsam und fragil; wenn nur Kernflows getestet werden, kann Detox sehr wertvoll sein.

## Datenschutz & Daten

Testumgebungen sollten keine echten Kundendaten nutzen. Zugangsdaten, Testaccounts und Geräte-Logs müssen kontrolliert werden.

## Preise & Kosten

Detox ist im Katalog als **Open Source** geführt. Direkte Lizenzkosten sind nicht der Hauptpunkt; entscheidend sind Setup-Zeit, CI-Minuten, Geräte- beziehungsweise Simulatorpflege und der Aufwand für stabile Testdaten.

Teams sollten einkalkulieren, dass E2E-Tests laufend gewartet werden müssen. Der Preis ist also weniger das Tool selbst als die Disziplin, Testfälle aktuell zu halten.

**Zum Anbieter:** https://www.detox.com/

## Alternativen

- [Appium](/tools/appium/): für native und hybride Mobile-Apps über verschiedene Frameworks hinweg.
- [Selenium](/tools/selenium/): für etablierte Browser-Automation mit breitem Ökosystem.
- [Playwright](/tools/playwright/): für moderne Web-End-to-End-Tests und detaillierte Traces.
- [Cypress](/tools/cypress/): für entwicklernahe Frontend- und Web-App-Tests.
## Redaktionelle Einschätzung

Detox ist wertvoll, wenn mobile Kernflows wirklich abgesichert werden müssen. Es braucht aber disziplinierte Testarchitektur.

## FAQ

**Ist Detox für Einsteiger geeignet?**

Detox ist eher ein Werkzeug für Teams mit Test- und CI-Erfahrung. Einsteiger sollten zunächst Teststrategie, stabile Selektoren und Testdaten klären, bevor sie eine große Detox-Suite aufbauen.

**Wann lohnt sich Detox besonders?**

Detox lohnt sich, wenn App-Releases regelmäßig Regressionen in Kernflows riskieren. Der beste Start sind wenige kritische Pfade wie Login, Bezahlung, Onboarding oder Berechtigungen, die bei jedem Release reproduzierbar geprüft werden müssen.

**Worauf sollte man vor dem Einsatz achten?**

Wichtig sind stabile Test-IDs, kontrollierte Testaccounts, reproduzierbare Builds, CI-Ressourcen und klare Regeln, welche Flows wirklich E2E getestet werden. Echte Kundendaten gehören nicht in diese Tests.

**Wie reduziert man Flakiness bei Detox-Tests?**

Kontrollierte Testdaten, stabile Selektoren, eindeutige Zustände und identische Build-Umgebungen verwenden. Fehler sollten mit Logs und Video untersucht statt blind wiederholt werden.
