---
slug: darktable
title: Darktable
description: "Lokaler Open-Source-Workflow für RAW-Entwicklung, Bildverwaltung und kontrollierten Export mit nicht-destruktiver Bearbeitung, XMP-Sidecars und Styles."
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: Design
price_model: Open Source
tags: [photo, editing, raw, open-source]
official_url: "https://www.darktable.org/"
popularity: 0
tier: "C"
generated_at: "2026-05-15"
updated_at: 2026-07-14
---
# Darktable

Darktable ist eine lokal laufende Open-Source-Anwendung für RAW-Entwicklung, Bildverwaltung und kontrollierten Export. Sie passt zu Fotograf:innen und kleinen Produktionsteams, die Kameraoriginale nicht-destruktiv entwickeln und ihre Bearbeitung als wiederholbaren Prozess organisieren wollen. Die wichtige Grenze: Darktable ist kein Cloud-DAM und kein gemeinsamer Review-Arbeitsraum; Bibliothek, Sidecars, Backups und Übergaben bleiben Aufgabe des Teams.

## Für wen ist Darktable geeignet?

Darktable ist sinnvoll, wenn ein Team RAW-Dateien auf eigenen Rechnern oder Speichern verarbeiten, Metadaten pflegen und Varianten ohne Veränderung des Originals erzeugen möchte. Die Oberfläche und der Pixelpipe-Ansatz verlangen Einarbeitung. Wer nur gelegentlich ein JPEG zuschneidet, fährt mit einem einfacheren Editor besser. Wer dagegen viele Aufnahmen sichtet, bewertet, verschlagwortet und in mehreren Ausgabeformaten entwickelt, kann von einem lokalen, lizenzkostenfreien Werkzeug profitieren.

## Die Bausteine im realen Prozess

Die Lighttable dient zum Import, Sichten, Filtern, Bewerten und Taggen. Im Darkroom werden Module als Verarbeitungskette, der Pixelpipe, angewendet; Presets und Styles können wiederkehrende Entwicklungsschritte vorbereiten. Die Bibliotheksdatenbank hält Katalog- und Bearbeitungsinformationen, während XMP-Sidecars die Bearbeitung neben der Quelldatei sichern können. Das Ergebnis entsteht erst beim Export, etwa als JPEG oder TIFF, nicht beim bloßen Ändern eines RAW.

<figure class="tool-editorial-figure">
  <img src="/images/tools/darktable-editorial.webp" alt="Dunkelkammer-Tisch mit Kontaktbögen, Filtern und Landschaftsabzug als Sinnbild für Darktables RAW-Workflow" loading="lazy" decoding="async" />
</figure>

## Ein belastbarer Workflow

1. **Import und Sicherung:** Originale in einer unveränderten Ordnerstruktur ablegen, Kamera- und Aufnahmedaten prüfen und XMP-Sidecars aktivieren.
2. **Auswahl:** Ausschuss markieren, Sterne und Farbmarkierungen für Auswahlstufen verwenden und Tags nach Projekt, Auftrag oder Motiv vergeben.
3. **Entwicklung:** Mit einem definierten Basisprofil beginnen, Belichtung und Farbe an Referenzbildern prüfen und lokale Korrekturen oder Masken nur dort einsetzen, wo sie den Zweck unterstützen.
4. **Style und Varianten:** Wiederkehrende Schritte als Style speichern, aber vor einer Serie an mehreren echten Motiven kontrollieren; ein Style ersetzt keine Sichtprüfung.
5. **Export und Übergabe:** Zielprofil, Dateiformat, Abmessungen, Dateinamen und Metadaten je Ausgabekanal festlegen. JPEG für Web oder Übergabe ist nicht automatisch die richtige Wahl für weitere Rasterbearbeitung; dafür kann TIFF geeigneter sein.

## Betrieb, Export und Übergaben

Darktable arbeitet mit einer lokalen Bibliothek und kann ohne Onlinekonto betrieben werden. Für mobile Arbeit gibt es lokale Kopien, die später mit dem Hauptspeicher synchronisiert werden können. Das hilft bei externen Laufwerken, erzeugt aber eine weitere Synchronisationsstelle. Ein Team sollte daher Ordnernamen, Eigentümer, Schreibrechte und die Regel für parallele Bearbeitung dokumentieren. Vor dem Umbenennen oder Verschieben von Dateien müssen Bibliothek und zugehörige XMP-Dateien berücksichtigt werden; sonst entstehen verwaiste Einträge oder verlorene Bearbeitungsschritte.

## Qualität und Entscheidungskriterien

Bewertet nicht die Zahl der Module, sondern einen kleinen Referenzsatz aus schwierigen Aufnahmen: Mischlicht, hohe ISO, Hauttöne, Objektivfehler und ein anspruchsvoller Export. Messt Zeit bis zum freigegebenen Ergebnis, Korrekturschleifen, Farbabweichungen und Wiederherstellbarkeit nach einem Bibliotheksfehler. Prüft zudem, ob Styles zwischen Rechnern reproduzierbar sind und ob die erzeugten Dateien die erwarteten Farbprofile und Metadaten enthalten. Wenn ein zweiter Editor regelmäßig Handarbeit übernehmen muss, gehört dieser Übergabepunkt in die Entscheidung.

## Sicherheit, Datenschutz und Governance

Die lokale Verarbeitung reduziert den Cloud-Datenpfad, ist aber keine automatische Sicherheitsgarantie. RAWs, XMPs, Bibliotheken, Vorschaudaten und Exportordner müssen mit den normalen Zugriffs- und Backup-Regeln geschützt werden. EXIF- und GPS-Daten können beim Export bewusst ein- oder ausgeschlossen werden; vor einer Veröffentlichung ist das eine redaktionelle Prüfung. Bei Kund:innen- oder Personenaufnahmen gehören Einwilligung, Aufbewahrung, Löschung und die Rechte am Ausgangsmaterial ins Projektbriefing. Backups sollten RAWs, XMP-Sidecars, Konfiguration und Bibliotheksdatenbank umfassen. Vor einem Versionswechsel ist ein getesteter Rückfallplan wichtig, weil eine neue Bibliothek nicht zwingend von einer älteren Version gelesen werden kann.

## Kosten und laufender Aufwand

Darktable selbst wird als Open-Source-Software ohne Abonnement eingesetzt. Das bedeutet nicht, dass der Prozess kostenlos ist: Es fallen gegebenenfalls Kosten für Rechner, GPU, Speicher, Backups, Farbmanagement, Schulung und Support an. Bei mehreren Arbeitsplätzen ist der größte Aufwand meist die Pflege gemeinsamer Ordner- und Backupregeln sowie die Prüfung von Exporten. Die Entscheidung sollte daher gegen die Gesamtkosten des bestehenden Workflows und nicht nur gegen eine Lizenzzeile fallen.

## Redaktionelle Einschätzung

Darktable empfehlen wir Fotograf:innen und kleinen Teams, die RAW-Entwicklung lokal kontrollieren, sich in einen technisch dichten Workflow einarbeiten und Daten selbst verwalten wollen. Wert entsteht, wenn Bibliothek, XMP-Sicherung, Styles, Farbprofile und Exportziele als ein dokumentierter Ablauf betrieben werden. Für spontane Einzelbilder, kollaborative Cloud-Freigaben oder Teams ohne klare Dateiverantwortung ist ein zugänglicherer oder stärker integrierter Dienst die bessere Wahl. Startet mit einem realen Referenzprojekt und entscheidet nach Wiederherstellbarkeit und freigegebener Ausgabequalität, nicht nach der Länge der Featureliste.

## Alternativen

- [RawTherapee](/tools/rawtherapee/): Ebenfalls auf RAW-Entwicklung spezialisiert und eine naheliegende Wahl, wenn Katalogfunktionen weniger wichtig sind.
- [GIMP](/tools/gimp/): Geeigneter für pixelbasierte Retusche, Compositing und manuelle Bildmontage nach der RAW-Entwicklung.
- [Adobe Lightroom](/tools/adobe-lightroom/): Bietet einen stärker integrierten kommerziellen Foto-Workflow, wenn Cloud-Synchronisation und geführte Katalogverwaltung wichtiger sind.
- [Krita](/tools/krita/): Passt besser zu digitalem Malen, Illustration und manueller Rasterbearbeitung als zur katalogorientierten RAW-Entwicklung.

## FAQ

**Ist Darktable für Anfänger:innen geeignet?**

Ja, aber nicht als selbsterklärter Schnelleditor. Ein begrenzter Lernpfad mit Import, Auswahl, Belichtung, Farbe und Export ist sinnvoller als der Versuch, alle Module gleichzeitig zu verstehen.

**Verändert Darktable die RAW-Originale?**

Der Entwicklungsworkflow ist nicht-destruktiv. Bearbeitungen werden in der Bibliothek und, wenn konfiguriert, in XMP-Sidecars gespeichert; für eine verteilbare Datei muss ausdrücklich exportiert werden.

**Welche Dateien müssen gesichert werden?**

Mindestens die RAW-Originale, die zugehörigen XMP-Sidecars und die Darktable-Bibliotheksdatenbank. Für eine vollständige Migration kommen Konfiguration, Styles und Presets hinzu. Ein Restore sollte mit einer Testkopie geprobt werden.

**Kann ein Team dieselbe Bibliothek gleichzeitig nutzen?**

Darktable ist primär ein lokaler Desktop-Workflow. Eine gemeinsame Bibliothek auf einem Netzlaufwerk ist keine automatische Mehrbenutzer- und Review-Lösung; Besitz, Sperren, Backup und parallele Bearbeitung müssen separat geregelt werden.

**Ist Darktable für kommerzielle Projekte verwendbar?**

Die Software ist Open Source und kann in kommerziellen Workflows eingesetzt werden. Davon unberührt bleiben Rechte an Fotos, Personen, Musik oder Marken sowie die Lizenzbedingungen eingebundener Inhalte und Pakete.

**Was sollte vor einem Versionswechsel geprüft werden?**

Erstellt ein vollständiges Backup, testet es und prüft die Release Notes auf Bibliotheks- und Plattformgrenzen. Neue Bibliotheksdaten können mit älteren Darktable-Versionen inkompatibel sein.
