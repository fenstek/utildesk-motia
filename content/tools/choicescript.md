---
slug: choicescript
title: ChoiceScript
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-choicescript-full-editorial"
category: "AI Writing"
price_model: Kostenlos
tags: [interactive-fiction, writing, games]
official_url: "https://www.choiceofgames.com/make-your-own-games/choicescript-intro/"
description: "ChoiceScript ist eine textbasierte Skriptsprache für interaktive Romane mit Entscheidungen, Variablen und verzweigten Szenen."
updated_at: 2026-07-14
lastReviewed: 2026-07-14
popularity: 0
tier: "C"
generated_at: "2026-05-15"
---
# ChoiceScript

ChoiceScript ist eine textbasierte Skriptsprache von Choice of Games für interaktive Romane und entscheidungsgetriebene Spiele. Autorinnen und Autoren schreiben Szenen als einfache Textdateien, verbinden sie mit `*choice`, `*goto` und `*finish` und speichern den Zustand der Geschichte in Variablen. Das macht ChoiceScript interessant für narrative Projekte, aber nicht für ein allgemeines Game-Engine- oder Layout-System: Wer 3D, umfangreiche Animationen oder eine freie Benutzeroberfläche braucht, sollte anders planen.

## Für wen passt ChoiceScript?

ChoiceScript passt zu Schreibenden, Narrative-Design-Teams und kleinen Studios, die eine lange Geschichte mit vielen Entscheidungen als nachvollziehbaren Textbestand pflegen wollen. Ein sinnvoller Einstieg ist etwa ein Rollenspiel mit fünf bis zehn Szenen, in dem frühere Entscheidungen Werte wie Vertrauen, Mut oder Ressourcen verändern. Auch Prototypen für Lern- und Trainingsgeschichten sind möglich, sofern die fachliche Abnahme nicht an die Software delegiert wird.

Weniger passend ist das Werkzeug für bildlastige Visual Novels, Echtzeit-Gameplay oder Projekte, deren Kern eine frei gestaltete Oberfläche ist. Die Lernkurve liegt nicht bei der Syntax allein, sondern beim Planen von Zuständen, Sackgassen und wiederverwendbaren Szenen.

## Wie funktioniert das Skriptmodell?

Ein ChoiceScript-Projekt enthält unter anderem `startup.txt` und weitere Szenendateien. `*choice` legt Optionen an, eingerückte Blöcke enthalten die Folgen. Mit `*create` und `*set` werden Werte angelegt und verändert; `*if` kann später prüfen, ob ein anderer Text oder Pfad angezeigt wird. `*label`, `*goto` und `*goto_scene` helfen, gemeinsame Abschnitte nicht mehrfach zu kopieren.

Die Einrückung ist dabei Teil der Syntax. Spaces und Tabs dürfen nicht beliebig gemischt werden, und ein verschachtelter Block muss sauber mit einem Sprung oder einem Szenenende abschließen. Das ist leicht zu übersehen, wenn mehrere Personen Dateien bearbeiten. Ein einheitlicher Stil, UTF-8 und verständliche Variablennamen gehören deshalb von Anfang an in die Projektregeln.

<figure class="tool-editorial-figure">
  <img src="/images/tools/choicescript-editorial.webp" alt="Offenes Buch mit verzweigten Pfaden und markierten Entscheidungsstellen" loading="lazy" decoding="async" />
</figure>

## Ein konkreter Arbeitsablauf

Beginne nicht mit einer riesigen Weltkarte, sondern mit einem spielbaren Abschnitt. Definiere zuerst die Szene, die Entscheidung und die Zustände, die später sichtbar werden sollen. Schreibe danach den Abschnitt in eine Szenendatei, starte den lokalen ChoiceScript-Server und prüfe den Weg im Browser. Ein Beispiel: Die Entscheidung, ob eine Figur ein Versprechen hält, setzt `trust` auf einen Wert; drei Szenen später entscheidet `*if trust > 60`, ob eine Tür geöffnet wird.

Danach folgt ein Durchlauf pro bewusst geplanter Route. Tote Enden, unerreichbare Abschnitte und widersprüchliche Werte sind keine Randfälle, sondern typische Fehler in verzweigten Geschichten. Für Teamarbeit lohnt sich eine kleine Tabelle mit Szenen, Ein- und Ausgangszuständen sowie den geplanten Testpfaden. Git oder ein anderes Versionssystem bleibt sinnvoll, weil ChoiceScript selbst keine redaktionelle Versionsverwaltung ersetzt.

## Testen und Qualität sichern

ChoiceScript bringt Quicktest und Randomtest für unterschiedliche Prüfaufgaben mit. Quicktest versucht Optionen und Bedingungen systematisch abzudecken; Randomtest spielt viele zufällige Wege und erzeugt Trefferinformationen. Beide Verfahren können Fehler finden, die das jeweils andere übersieht. Sie beweisen aber nicht, dass eine Route dramaturgisch verständlich ist: Titel, Ton, Variablenlogik und alle wichtigen Enden müssen zusätzlich manuell gelesen und gespielt werden.

Für eine Abnahme sind drei Kriterien praktisch: Jede geplante Hauptszenenfolge ist erreichbar, kein Zustand erzeugt einen ungewollten Widerspruch, und ein neuer Textabschnitt kann geändert werden, ohne mehrere Kopien derselben Logik zu reparieren. Zufall sollte sparsam eingesetzt werden, weil er Testbarkeit und Reproduzierbarkeit verschlechtert.

## Export, Veröffentlichung und Grenzen

Der offizielle Export kann ein HTML-Dokument erzeugen, das auf einer Website oder an Testpersonen verteilt wird. Für gespeicherten Fortschritt im exportierten Browser-Spiel braucht das Projekt eine IFID; ohne sie kann ein Neuladen den Spielstand verlieren. Die Veröffentlichung ist nicht auf einen einzigen Kanal festgelegt: möglich sind private Tests, eine kostenlose öffentliche Verteilung oder eine Bewerbung für Angebote von Choice of Games. Hosted Games und eine kommerzielle Veröffentlichung sind eigene Vereinbarungen und keine automatische Eigenschaft jedes Projekts.

ChoiceScript ist damit ein guter Kern für Text und Logik, aber kein Ersatz für Hosting, Store-Verträge, Community-Moderation, Übersetzungsprozess oder Grafik- und Audio-Pipeline. Diese Kosten und Zuständigkeiten müssen vor einer Veröffentlichung separat geklärt werden.

## Sicherheit, Rechte und Pflege

Das lokale Schreiben in Textdateien reduziert die Abhängigkeit von einem webbasierten Editor, sagt aber nichts über die Rechte am Inhalt aus. Prüfe bei Figuren, Marken, Musik, Bildern, Übersetzungen und Beiträgen Dritter jeweils die Lizenz und die Veröffentlichungsrechte. Für unveröffentlichte Manuskripte sollte das Team Zugriffe auf das Repository und exportierte HTML-Dateien begrenzen.

Bei einer Übernahme durch mehrere Autorinnen und Autoren sind Reviews, Branches und ein klares Verantwortungsmodell wichtiger als zusätzliche Syntax. Vor jedem Release sollten die verwendete ChoiceScript-Version, der IFID, die unterstützten Browser und der Umgang mit Spielständen dokumentiert werden.

## Kosten und Aufwand

ChoiceScript ist als Werkzeug kostenlos erhältlich. Das bedeutet nicht, dass ein Spiel ohne Kosten entsteht: Zeit für Schreiben, Dramaturgie, Lektorat, Tests, Übersetzung, Assets, Hosting und mögliche Veröffentlichungsservices bleibt bestehen. Bei einer kommerziellen Einreichung müssen die aktuellen Bedingungen des jeweiligen Labels geprüft werden, statt aus dem kostenlosen Einstieg auf eine bestimmte Umsatz- oder Lizenzregel zu schließen.

## Redaktionelle Einschätzung

ChoiceScript empfehle ich Schreibenden und kleinen Narrative-Teams, die textzentrierte Geschichten mit nachvollziehbaren Zuständen bauen und ihre Dateien selbst versionieren können. Es liefert den größten Wert, wenn die Geschichte bereits in Szenen, Entscheidungen und Testpfade zerlegt ist und das Team vor dem Release Quicktest, Randomtest und manuelle Durchläufe kombiniert.

Für eine bild- oder systemlastige Produktion ist ChoiceScript nicht die erste Wahl. Dann ist eine Alternative mit passenderem Visual-Novel-, Story- oder Editor-Schwerpunkt vernünftiger. Der faire Entscheidungstest ist ein kleiner vertikaler Ausschnitt: Wenn eine Route verständlich bleibt, Zustände sauber funktionieren und die Korrekturen überschaubar sind, trägt das Werkzeug; wenn schon dieser Ausschnitt in Sonderlogik und manuellen Workarounds endet, sollte man wechseln.

## Alternativen

- [Twine](/tools/twine/): besser für einen schnellen visuellen Story-Prototypen und nichtlineare Hypertext-Strukturen im Browser.
- [Ink by Inkle](/tools/ink-by-inkle/): passend, wenn narrative Skripte später enger an eine eigene Spiel- oder Softwareintegration angebunden werden sollen.
- [Ren’Py](/tools/ren-py/): die stärkere Wahl für Visual Novels mit Figuren, Hintergründen, Dialogfenstern und Präsentationslogik.
- [Inform 7](/tools/inform-7/): interessant für interaktive Fiktion, in der Räume, Objekte und Regeln als Weltmodell im Mittelpunkt stehen.
- [Squiffy](/tools/squiffy/): schlanker für kleinere verlinkte Textgeschichten und einfache Choice-Strukturen ohne umfangreiche Zustandsarchitektur.

## FAQ

**Brauche ich Programmiererfahrung für ChoiceScript?**

Nein, aber logisches Denken und sorgfältige Textdatei-Pflege sind nötig. Die Syntax ist zugänglich; verschachtelte Entscheidungen, Variablen und konsistente Einrückung verlangen trotzdem Übung.

**Kann ChoiceScript eine Visual Novel mit Bildern und Animationen ersetzen?**

Nicht als Hauptwerkzeug. Es kann textbasierte Entscheidungen und Zustände abbilden, ist aber nicht auf eine umfangreiche Bild-, Audio- oder Animationspipeline ausgelegt.

**Wie teste ich eine verzweigte Geschichte?**

Nutze Quicktest und Randomtest für strukturelle Hinweise und spiele die wichtigen Routen anschließend manuell. Kein automatischer Test bewertet allein, ob eine Szene dramaturgisch funktioniert.

**Kann ich ein ChoiceScript-Spiel veröffentlichen?**

Ja. Der offizielle Workflow unterstützt HTML-Export und verschiedene Veröffentlichungswege. Für Hosted Games, Stores, Rechte und kommerzielle Bedingungen gelten jedoch die jeweils aktuellen Vorgaben und Vereinbarungen.
