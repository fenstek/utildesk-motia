---
slug: blockly
title: Blockly
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: "2026-07-14"
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Entwickler-Tools"
price_model: Open Source
official_url: "https://developers.google.com/blockly"
description: "Blockly ist eine Open-Source-Bibliothek für eingebettete visuelle Code-Editoren mit eigenen Blöcken, Toolboxes, Workspaces und Codegeneratoren."
updated_at: "2026-07-14"
popularity: 0
tier: "D"
generated_at: "2026-05-18"
---
# Blockly

Blockly ist eine Open-Source-Bibliothek, mit der Entwickler einen visuellen Code-Editor in eine Webanwendung einbauen. Nutzer setzen Blöcke in einem Workspace zusammen; die Anwendung definiert Toolbox, Blocklogik und Codegeneratoren selbst. Das ist der entscheidende Rahmen: Blockly ist weder ein fertiger Kurs noch eine gehostete Lernplattform und liefert keine komplette Produktlogik für die Anwendung.

<figure class="tool-editorial-figure">
  <img src="/images/tools/blockly-editorial.webp" alt="Visueller Blockly-Editor mit farbigen Programmierblöcken in einem Lern-Workspace" loading="lazy" decoding="async" />
</figure>

## Für wen eignet sich Blockly?

Blockly passt zu Teams, die eine kontrollierte, visuelle Eingabe für Regeln, Lernaufgaben, Robotik oder Konfigurationen brauchen und diese Eingabe in einer eigenen Weboberfläche betreiben wollen. Geeignet ist es vor allem für Entwickler, Produktteams mit eigener Webkompetenz und Bildungsteams, die einen spezifischen Lernpfad bauen. Nicht geeignet ist es für eine Schule oder Redaktion, die ohne Entwicklungsarbeit sofort fertige Kurse, Accounts, Bewertungen und Support erwartet.

## Bausteine im echten Projekt

Der Workspace ist die Arbeitsfläche; Toolboxen stellen Blöcke bereit, typischerweise als Kategorien oder Flyout. Eigene Blöcke lassen sich mit JSON definieren; für fortgeschrittene Fälle wie Mutators kann JavaScript nötig sein. Danach kommen Felder, Inputs, Verbindungen, Themes, Renderer und gegebenenfalls Plugins hinzu. Der Blockly Developer Tools/Block Factory hilft beim Erzeugen von Blockdefinitionen und Generator-Stubs, ersetzt aber nicht die fachliche Modellierung.

## Praktischer Implementierungs-Workflow

1. Das Team grenzt zuerst ein Lern- oder Produktproblem ein: Welche Eingaben sind erlaubt, welches Ergebnis soll entstehen und welche Aktionen bleiben absichtlich ausgeschlossen?
2. Es installiert Blockly über npm oder startet ein Projekt mit dem offiziellen Create-Package-Werkzeug. Ein kleiner Prototyp enthält zunächst nur wenige Blöcke und eine klar beschriebene Toolbox.
3. Für jeden Zielausgabekanal definiert das Team Generatoren und testet verschachtelte Inputs, Operatorpräzedenz, leere Felder und ungültige Kombinationen. Generatoren sind JavaScript-Code, auch wenn sie etwa JavaScript oder Python ausgeben.
4. Workspace-Zustand wird für neue Projekte vorzugsweise als JSON gespeichert. XML bleibt ein älteres Format ohne neue Features; Migration und Rückwärtskompatibilität müssen deshalb bewusst geplant werden.
5. Erst danach folgen Nutzerstudie, Fachreview und Einbettung in Authentifizierung, Speicherung und Release-Prozess der eigentlichen Anwendung.

## Betrieb, Integration und Wartung

Blockly liefert den Editor; Hosting, Nutzerverwaltung, Persistenz, Telemetrie, Übersetzungen, Berechtigungen und die Ausführung des erzeugten Codes liegen beim einbettenden Produkt. Für Plugins sollte das Team Abhängigkeiten explizit installieren, keine privaten Core-APIs voraussetzen und Tests mitliefern. In Production gehört eine veröffentlichte npm- oder GitHub-Version in die Dependency-Strategie. Die Blockly-Dokumentation rät davon ab, den laufenden `main`-Branch als Produktionsquelle zu verwenden; neue APIs können sich vor dem stabilen Release ändern.

## Qualität und Evaluation

Bewertet werden sollte nicht nur, ob Blöcke ansprechend aussehen. Sinnvolle Checks sind: Können fünf repräsentative Aufgaben ohne versteckte Textkorrektur gelöst werden? Erzeugt derselbe Workspace reproduzierbaren Code? Werden fehlerhafte Kombinationen verständlich markiert? Lassen sich JSON-Snapshots laden, migrieren und zurücksetzen? Für Unterricht misst das Team zusätzlich Lösungsweg, Transferaufgabe und Abbruchpunkte; für ein Produkt misst es Fehlerrate, Review-Aufwand und Zeit bis zur sicheren Ausführung. Der Codegenerator braucht eigene Unit- und Snapshot-Tests, weil ein syntaktisch plausibler Output fachlich trotzdem falsch sein kann.

## Datenschutz, Sicherheit und Governance

Blockly ist eine Bibliothek, keine Datenschutzgarantie. Welche Workspace-Daten, Eingaben und Telemetrie den Browser verlassen, bestimmt die umgebende Anwendung. Vor dem Rollout sollte das Team Datenfluss und Aufbewahrung dokumentieren, unnötige Inhalte aus Snapshots entfernen, Berechtigungen trennen und Plugins sowie npm-Abhängigkeiten prüfen. Erzeugten Code darf die Anwendung nicht blind mit weitreichenden Rechten ausführen: Eingaben validieren, gefährliche APIs begrenzen und bei untrusted Inhalten eine geeignete Isolation oder Sandbox vorsehen. Keyboard- und Screenreader-Unterstützung ist im Projekt vorgesehen, aber eigene Blöcke, Themes und Fokusführung müssen separat mit realen Nutzungsszenarien getestet werden. Apache 2.0 vereinfacht die Nutzung, ersetzt aber keine Lizenzprüfung für Drittanbieter-Plugins und eingebundene Assets.

## Preis und laufende Kosten

Blockly selbst wird als freie Open-Source-Software unter Apache 2.0 verteilt; es gibt keinen Blockly-Tarif, der Hosting oder Betrieb abdeckt. Die Rechnung entsteht an anderer Stelle: Entwicklungszeit für Blockmodell und Generatoren, Tests, Übersetzungen, Barrierefreiheit, Browserkompatibilität, Infrastruktur, Speicherung und Pflege der Abhängigkeiten. Bei einem Lehrprojekt kann das Lizenzbudget daher niedrig sein, während die Erstellung guter Aufgaben und die Betreuung der Lernenden den größeren Aufwand verursachen. Vorab sollte das Team ein kleines Blockset kalkulieren und die Kosten einer späteren Migration aus dem eigenen Datenformat berücksichtigen.

## Redaktionelle Einschätzung

Blockly empfehlen wir, wenn ein Team einen begrenzten visuellen Editor in eine eigene Webanwendung einbetten und die fachlichen Regeln selbst verantworten kann. Der Wert entsteht bei klaren Domänenblöcken, nachvollziehbaren Generatoren und einem Testset, das falsche Ausgaben sichtbar macht. Für eine reine Lernplattform ohne Entwicklerressourcen oder für frei programmierbare, sehr große Softwareprojekte ist Blockly die falsche Abstraktion: Dort sind Code.org, MakeCode oder ein normaler Quelltext-Editor je nach Ziel näher am Bedarf.

## Alternativen

- [MakeCode](/tools/makecode/): Eine stärker fertige Lern- und Programmierumgebung mit Block- und Textansicht; sinnvoll, wenn Hardware- oder Kursmaterialien schneller starten sollen.
- [Code.org](/tools/code-org/): Kurs- und Unterrichtsplattform mit fertigen Lernpfaden; besser, wenn Lehrkräfte Inhalte nutzen möchten, statt einen Editor selbst zu bauen.
- [AppInventor](/tools/appinventor/): Visuelle Entwicklungsumgebung für mobile Apps; passend, wenn das Ergebnis eine Android-App und nicht ein eingebetteter allgemeiner Editor sein soll.
- [Thunkable](/tools/thunkable/): Gehosteter No-Code-Ansatz für mobile Anwendungen; prüfenswert, wenn Publishing und Plattformdienste wichtiger sind als eigene Block- und Generatorlogik.
- [Codecademy](/tools/codecademy/): Interaktive Lernplattform mit Übungen; die bessere Wahl für strukturierte Coding-Kurse statt eigener Blockly-Infrastruktur.

## FAQ

**Ist Blockly eine fertige Lernplattform?**

Nein. Blockly liefert die Editorbibliothek und Kernbausteine. Kurse, Aufgaben, Konten, Fortschrittsmessung, Speicherung und Support müssen in der umgebenden Anwendung entstehen.

**Welche Ausgabesprachen kann Blockly erzeugen?**

Das hängt von den eingebundenen Generatoren und der eigenen Modellierung ab. Blockly bringt mehrere Generatoren und APIs mit; für jeden Zielkanal müssen die Blockgeneratoren und ihre Tests zur Anwendung passen.

**Soll ein neues Projekt JSON oder XML speichern?**

Für neue Projekte ist JSON die empfohlene, aktiv weiterentwickelte Option. XML bleibt als älteres Format erhalten, erhält laut Dokumentation aber keine neuen Features. Bestehende XML-Daten brauchen deshalb einen geprüften Migrationspfad.

**Kann erzeugter Code direkt ausgeführt werden?**

Die Bibliothek erzeugt Code, übernimmt aber nicht automatisch die sichere Ausführung. Das Produkt muss Ausgaben validieren, Berechtigungen begrenzen und bei untrusted Eingaben eine geeignete Ausführungsisolation bereitstellen.

**Wie werden eigene Blöcke erstellt?**

Blockdefinitionen können bevorzugt als JSON oder bei komplexeren Erweiterungen als JavaScript angelegt werden. Die Developer Tools erzeugen dabei einen Ausgangspunkt; fachliche Regeln, Generatoren, Tests und UX bleiben Teamarbeit.

**Ist Blockly im kommerziellen Produkt erlaubt?**

Der Core steht unter Apache 2.0. Das ist keine pauschale Freigabe für jede Drittanbieterkomponente: Lizenztexte, Plugins, Abhängigkeiten und eingebundene Inhalte müssen separat geprüft und mit dem eigenen Vertriebsmodell abgeglichen werden.

**Wie bleibt ein Blockly-Produkt wartbar?**

Versionen sollten über veröffentlichte Releases statt über `main` bezogen, in CI getestet und mit JSON-Fixtures, Generator-Snapshots und Browserchecks abgesichert werden. Bei Plugins helfen klare APIs und explizite Abhängigkeiten.
