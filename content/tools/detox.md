---
slug: detox
title: Detox
category: AI
price_model: Open Source
tags: [detox, qa, test-automation]
official_url: "https://www.detox.com/"
popularity: 0
description: "Detox ist ein End-to-End-Testframework für mobile Apps, besonders für React-Native-nahe Entwicklungs- und QA-Workflows."
---
# Detox

Detox hilft, mobile Apps automatisiert so zu testen, wie Nutzer sie bedienen würden. Für React-Native-Teams ist es interessant, weil Tests näher an realen Interaktionen laufen als reine Unit-Tests.

Geeignet für Mobile-Teams, QA-Automatisierung und Projekte mit häufigen Regressionen in App-Flows.

## Für wen ist Detox geeignet?

Detox eignet sich für Mobile-Teams, besonders im React-Native-Umfeld, die kritische App-Flows automatisiert gegen echte Laufzeitbedingungen prüfen wollen. Es ist sinnvoll, wenn Login, Onboarding, Checkout, Berechtigungen oder Offline-Verhalten vor jedem Release zuverlässig getestet werden müssen.

Für kleine Apps ohne stabile Testumgebung kann Detox zu früh sein. Der Aufwand lohnt sich erst, wenn Build-Pipeline, Testdaten, Simulatoren und Verantwortlichkeiten sauber genug sind, damit E2E-Tests nicht ständig aus falschen Gründen brechen.

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

## Alternativen zu Detox

- [Appium](/tools/appium/): breiter für native und hybride Mobile-Apps über verschiedene Frameworks hinweg.
- [Selenium](/tools/selenium/): eher Web- und Browser-Automation, weniger fokussiert auf moderne Mobile-E2E-Setups.
- Playwright: stark für Web-End-to-End-Tests, aber nicht derselbe Schwerpunkt wie mobile App-Flows.
- [Cypress](/tools/cypress/): gut für Frontend- und Web-App-Tests, weniger für echte mobile Runtime-Szenarien.

## Redaktionelle Einschätzung

Detox ist wertvoll, wenn mobile Kernflows wirklich abgesichert werden müssen. Es braucht aber disziplinierte Testarchitektur.

## FAQ

**Ist Detox für Einsteiger geeignet?**

Detox ist eher ein Werkzeug für Teams mit Test- und CI-Erfahrung. Einsteiger sollten zunächst Teststrategie, stabile Selektoren und Testdaten klären, bevor sie eine große Detox-Suite aufbauen.

**Wann lohnt sich Detox besonders?**

Detox lohnt sich, wenn App-Releases regelmäßig Regressionen in Kernflows riskieren. Besonders wertvoll ist es für Login, Bezahlung, Onboarding, Berechtigungen und andere Pfade, die man nicht manuell jedes Mal vollständig prüfen will.

**Worauf sollte man vor dem Einsatz achten?**

Wichtig sind stabile Test-IDs, kontrollierte Testaccounts, reproduzierbare Builds, CI-Ressourcen und klare Regeln, welche Flows wirklich E2E getestet werden. Echte Kundendaten gehören nicht in diese Tests.
