---
slug: adapt-learning
title: Adapt Learning
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: Developer
price_model: Open Source
tags: [education, authoring, content, open-source]
official_url: "https://www.adaptlearning.org/"
description: "Open-Source-Werkzeuge für responsive HTML5-E-Learning: Authoring Tool für visuelle Kurserstellung und Framework für Entwickler, mit kontrollierbaren Erweiterungen und LMS-Auslieferung."
updated_at: 2026-07-13
lastReviewed: 2026-07-13
popularity: 0
tier: "C"
generated_at: "2026-05-14"
---
# Adapt Learning

Adapt Learning ist kein einzelner Kurseditor mit einer fertigen Cloud-Laufzeit, sondern ein Open-Source-Projekt mit zwei deutlich unterschiedlichen Arbeitswegen. Das Adapt Authoring Tool richtet sich an Content-Teams, die responsive HTML5-Kurse visuell zusammenstellen möchten. Das Adapt Framework ist der Entwickler-Baukasten darunter: Teams können Kurse, Themes und Komponenten per Code anpassen und anschließend für Webserver oder LMS bauen.

Das macht Adapt interessant für Organisationen, die eine eigene Lernoberfläche kontrollieren und nicht bei jeder Design- oder Interaktionsänderung auf einen proprietären Editor warten wollen. Der Preis dafür ist technische Verantwortung. Hosting, Versionen, Erweiterungen, Tests und die Entscheidung, welche Tracking-Standards tatsächlich eingesetzt werden, gehören in den eigenen Prozess.

## Für wen eignet sich Adapt Learning?

Adapt passt zu E-Learning-Teams mit wiederkehrenden Kursen, eigener Web- oder LMS-Kompetenz und dem Wunsch nach einem responsiven Ergebnis aus einer gemeinsamen Kursquelle. Typische Nutzer sind Bildungsanbieter, interne Learning-&-Development-Teams, Agenturen und Entwickler, die ein zugängliches Frontend mit eigenen Themes oder Komponenten verbinden wollen.

Für einen einzelnen kurzen Kurs ohne technische Betreuung ist ein kommerzieller Editor oft der schnellere Weg. Adapt ist besonders dann sinnvoll, wenn mehrere Kurse dieselbe Designlogik verwenden, die Organisation die Auslieferung selbst kontrollieren möchte oder ein Entwicklerteam vorhandene Komponenten erweitern kann.

<figure class="tool-editorial-figure">
  <img src="/images/tools/adapt-learning-editorial.webp" alt="Illustration zu Adapt Learning: Kursmodule, Quizkarten und Geraeterahmen werden zu Lernpfaden zusammengesetzt" loading="lazy" decoding="async" />
</figure>

## Zwei Wege: Authoring Tool und Framework

Das Authoring Tool bietet einen visuellen Ablauf: Kurs anlegen, Seiten und interaktive Komponenten konfigurieren, Vorschau prüfen und den Kurs exportieren. Es senkt die Einstiegshürde für Autorinnen und Autoren, bleibt aber ein technisch zu betreibendes System. Vor dem produktiven Einsatz sollten Rollen, Backups, Updates und der Exportpfad geklärt sein.

Das Framework ist der kontrollierbare Weg für Entwickler. Eine Kursquelle besteht aus Konfiguration, Inhalt, Themes und Plugins; der Build erzeugt ein HTML5-Kursverzeichnis. Damit lassen sich wiederverwendbare Komponenten und ein eigenes Erscheinungsbild pflegen. Gleichzeitig steigt der Aufwand für Git, Node.js, Build-Tooling, Abhängigkeiten und Regressionstests. Authoring Tool und Framework sollten deshalb nicht ohne Prüfung ihrer Framework- und Plugin-Versionen vermischt werden.

## Praktische Einsatzszenarien

- **Onboarding:** Ein Team erstellt einen kurzen, responsiven Einführungskurs mit Text, Medien, Verständnisfragen und einer nachvollziehbaren Abschlusslogik. Die LMS-Integration wird mit dem echten Zielsystem getestet, nicht nur in einer lokalen Vorschau.
- **Compliance-Schulung:** Inhalte werden modular aufgebaut, mit klaren Freigaben und einer festen Version ausgeliefert. Tracking und Bestehenslogik werden nur so weit aktiviert, wie das LMS sie zuverlässig verarbeitet.
- **Produkt- oder Prozessschulung:** Ein Fachbereich liefert Inhalte, ein Autorenteam pflegt Komponenten und ein Entwicklerteam hält Theme und Erweiterungen stabil. So bleibt die Gestaltung konsistent, ohne dass jede Textänderung Codearbeit auslöst.
- **Mehrsprachige Kurse:** Die Kursstruktur wird wiederverwendet, während Texte, Medien und Sprachvarianten getrennt geprüft werden. Übersetzung allein reicht nicht: Layout, RTL-Fähigkeit, Terminologie und Interaktionen brauchen einen eigenen Durchlauf.

## Inhalt, Komponenten und Auslieferung

Adapt organisiert Lerninhalte modular. Je nach eingesetzten Core- oder Community-Komponenten können unter anderem Text, Medien, Akkordeons, Hotspots, Multiple-Choice-Fragen, Assessments, Feedback, Navigation und Bookmarking kombiniert werden. Nicht jede Erweiterung gehört automatisch zu jeder Framework-Version; eine Komponentenliste sollte deshalb vor dem Kursstart eingefroren und getestet werden.

Die Ausgabe ist responsive HTML5 und kann auf einem Webserver laufen. Für die LMS-Auslieferung wird ein passender Tracking- beziehungsweise SCORM-Weg benötigt; xAPI ist eine Erweiterungsentscheidung und kein pauschales Versprechen jeder Installation. Vor dem Rollout gehören Abschlussstatus, Resume-Verhalten, Score, Offline-Verhalten und Browser-Matrix in einen Testplan.

## Grenzen und Betriebsrisiken

Die Open-Source-Lizenz spart keine Arbeitszeit für Betrieb. Ein Team muss Authoring-Tool-Instanz, Kursquellen, Assets, Secrets und Backups absichern. Bei Framework-Projekten kommen reproduzierbare Builds, Plugin-Kompatibilität und die Pflege von Node- und Build-Abhängigkeiten hinzu. Community-Erweiterungen können nützlich sein, brauchen aber eine eigene Prüfung auf Wartung, Barrierefreiheit und Lizenz.

Auch responsive Darstellung ist kein automatischer Qualitätsnachweis. Lange Überschriften, Tabellen, Videos, Tastaturbedienung, Screenreader-Labels, Kontraste und mobile Interaktionen sollten auf echten Zielgeräten geprüft werden. Ein Kurs, der im Desktop-Browser gut aussieht, ist noch nicht automatisch eine zugängliche oder LMS-stabile Schulung.

## Datenschutz und Governance

Vor dem Import in Adapt sollte feststehen, ob personenbezogene Lernstände, Prüfungsdaten, interne Dokumente oder nur öffentliche Inhalte verarbeitet werden. Bei einer selbst betriebenen Authoring-Tool-Instanz liegen Zugriffsschutz, Rollen, Backups, Löschkonzept und Serverhärtung beim Betreiber. Exportierte Kurse können außerdem Inhalte, Konfigurationen oder Tracking-Logik enthalten, die nicht unkontrolliert weitergegeben werden sollten.

Für Unternehmen gehören ein benannter Kursverantwortlicher, Freigabe vor Veröffentlichung, Versionskennzeichnung und ein Rückfallplan in den Prozess. Datenschutzrechtliche und arbeitsrechtliche Anforderungen müssen für das konkrete LMS und den konkreten Hostingweg separat bewertet werden.

## Preise und reale Kosten

Adapt ist als Open-Source-Projekt ohne klassische Authoring-Lizenz nutzbar. Die Gesamtkosten entstehen trotzdem durch Hosting, Einrichtung, Theme- und Plugin-Entwicklung, Übersetzungen, LMS-Tests, Wartung, Support und redaktionelle Pflege. Bei wenigen Kursen kann die technische Einrichtung den vermeintlichen Preisvorteil aufzehren; bei vielen ähnlich aufgebauten Kursen kann die Wiederverwendung den Aufwand rechtfertigen.

Für einen Pilot sollten Teams nicht nur die Installationszeit messen. Aussagekräftiger sind Zeit bis zur ersten freigegebenen Lektion, Nacharbeit pro Kurs, Aufwand für Updates und die Zahl der LMS-Fehler nach dem Export. Die konkrete Kostenrechnung hängt vom eigenen Betrieb und nicht nur von der Lizenz ab.

## Redaktionelle Einschätzung

Adapt Learning ist eine gute Wahl für Teams, die responsive E-Learning-Inhalte selbst kontrollieren, wiederverwendbare Bausteine pflegen und technische Verantwortung übernehmen wollen. Der stärkste Anwendungsfall ist ein kuratiertes Kurs-Ökosystem mit klarer Trennung zwischen Redaktion, Entwicklung und LMS-Betrieb.

Ich würde mit einem realen Pilotkurs beginnen: eine kurze Schulung, ein echtes Zielgerät-Set, ein echter LMS-Test und eine dokumentierte Export- und Freigabekette. Wenn schon dieser Kurs nur mit vielen manuellen Sonderlösungen stabil wird, ist ein stärker betreuter kommerzieller Editor wahrscheinlich die vernünftigere Wahl.

## Alternativen

- [H5P](/tools/h5p/): Naheliegend für interaktive HTML5-Inhalte, wenn ein vorhandenes LMS oder CMS im Vordergrund steht und kein eigener Framework-Build gewünscht ist.
- [Articulate Storyline](/tools/articulate-storyline/): Passender für tiefere Desktop-Autorierung, komplexe Szenarien und ein kommerziell betreutes Ökosystem.
- [Adobe Captivate](/tools/adobe-captivate/): Interessant, wenn responsive Layouts, Software-Demos und Adobe-orientierte Produktionsabläufe zusammenkommen.
- [Articulate Rise](/tools/articulate-rise/): Sinnvoll für schnelle, browserbasierte Kurse mit weniger technischer Betriebsarbeit und stärker vorgegebenem Design.
- [iSpring Suite](/tools/ispring-suite/): Praktisch für Teams, die aus PowerPoint heraus Kurse erstellen und sie in bestehende LMS-Prozesse übergeben möchten.

## FAQ

**Ist Adapt Learning wirklich kostenlos?**

Die Software ist Open Source und ohne klassische Authoring-Lizenz nutzbar. Kosten für Hosting, Entwicklung, Support, Übersetzung, LMS-Tests und laufende Wartung bleiben jedoch bestehen.

**Brauche ich Programmierkenntnisse?**

Für einfache Kurserstellung im Authoring Tool nicht zwingend. Für Installation, eigene Themes, Plugins, Framework-Builds und stabile Updates sind technische Kenntnisse oder ein verlässlicher Dienstleister sinnvoll.

**Kann Adapt-Kurse jedes LMS abspielen?**

Nicht automatisch. Der exportierte Kurs und das gewählte Tracking müssen zum LMS passen. SCORM-Konfiguration, Abschlussstatus, Resume, Scores und Browserverhalten sollten im echten Zielsystem geprüft werden.

**Unterstützt Adapt adaptive Lernpfade?**

Das Framework kann mit Erweiterungen und Kurslogik unterschiedliche Navigations- oder Feedbackpfade abbilden. Das ist nicht dasselbe wie eine automatisch personalisierte Lernplattform; die konkrete Adaptation muss entworfen, konfiguriert und getestet werden.

**Ist Adapt für barrierefreie Kurse geeignet?**

Das Framework bietet dafür relevante Grundlagen, aber Barrierefreiheit entsteht nicht allein durch die Plattform. Inhalte, Komponenten, Theme, Tastaturbedienung und Screenreader-Ausgabe müssen mit realen Tests und den Anforderungen des Projekts geprüft werden.
