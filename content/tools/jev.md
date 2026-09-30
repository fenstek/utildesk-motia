---
slug: jev
title: JEV by TypeSafe AI
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-09-30
editorial_status: "manual_polished"
editorial_verdict: caution
editorial_batch: "2026-09-30-full-tool-card-editorial"
category: AI Infrastructure
price_model: Nutzungsbasiert
tags: [ai, api, classification, structured-output]
official_url: "https://typesafe.ai/"
description: "Jev von TypeSafe bewertet enge Textfragen als typisierte Entscheidungen mit Wahrscheinlichkeiten; Qualität, Sprachabdeckung und Eskalationsregeln müssen Teams selbst prüfen."
tier: C
popularity: 0
updated_at: 2026-09-30
---
# JEV by TypeSafe AI

Jev von TypeSafe ist für Software gedacht, die aus Text eine eng umrissene Entscheidung ableiten muss: etwa das passende Team-Postfach (Queue) oder eine grobe Dringlichkeitsstufe. Statt einen Text zu verfassen, liefert das Modell typisierte Antworten samt Wahrscheinlichkeiten. Das kann nachgelagerte Logik vereinfachen, macht die Entscheidung aber weder automatisch richtig noch für Deutsch bereits verlässlich.

<figure class="tool-editorial-figure">
  <img src="/images/tools/jev-editorial.webp" alt="Ein künstlerisches Sortieratelier: mehrdeutige Fälle werden an einen Menschen weitergereicht, während klare Entscheidungen in getrennte Fächer sortiert werden" loading="lazy" decoding="async" />
</figure>

## Was Jev macht und für wen

Jev, von TypeSafe als [System-One-Modell](https://docs.typesafe.ai/introduction.md) bezeichnet, beantwortet strukturierte Fragen zu einem bereitgestellten Zustand. Eine Anwendung kann zum Beispiel fragen, welches von vier Teams zuständig ist, wie dringend ein Vorgang wirkt und welcher Schweregrad zu einer vorher definierten Skala passt. Die Antwort ist ein Wert, den Code prüfen und verwenden kann; Jev schreibt dabei nicht die Nachricht für den Kunden.

Das ist interessant für Entwicklerteams, die ähnliche, uneinheitlich formulierte Eingaben vorsortieren. Jev ist kein Helpdesk, Chatbot oder Ersatz für Geschäftsregeln. TypeSafe kündigte es am 15. September 2026 als [Early Access](https://typesafe.ai/blog/introducing-system-one-models-and-jev) an; ein begrenzter Pilot mit eigener Qualitätsevaluation gehört daher zum Produktionsplan.

## Die drei Fragetypen

[`Choice`](https://docs.typesafe.ai/primitives/choice.md) wählt aus benannten Möglichkeiten und liefert eine Wahrscheinlichkeitsverteilung sowie einen Confidence-Wert. [`Score`](https://docs.typesafe.ai/primitives/score.md) ordnet eine Eingabe einer beschriebenen Skala zu und liefert ebenfalls Verteilung und Confidence. [`Noul`](https://docs.typesafe.ai/primitives/noul.md) beantwortet eine Ja-Nein-Frage mit einem Wert von 0 bis 1: Er steht für die Wahrscheinlichkeit, dass die Antwort „ja“ lautet. Noul hat keinen zusätzlichen Confidence-Wert.

Wahrscheinlichkeit und Confidence sind nicht austauschbar: Die Wahrscheinlichkeit gilt für eine Option, Confidence fasst zusammen, wie deutlich die Verteilung ausfällt. Keiner der Werte beweist sachliche Richtigkeit; Schwellen und Folgen einer Fehlentscheidung legt die Anwendung fest ([TypeSafe zu Confidence](https://docs.typesafe.ai/confidence.md)).

## Ein möglicher Ablauf für Support-Nachrichten

Pilot-Beispiel: „Meine Bestellung wurde zweimal berechnet. Könnt ihr die zweite Abbuchung prüfen?“ Die Anwendung entfernt Namen und Bestellnummern und sendet den verbleibenden Text als Eingabekontext (`state`). `Choice` kann als Ziel das Team-Postfach für Abrechnung vorschlagen; eine unabhängige `Noul`-Frage bewertet, ob eine Reaktion am selben Tag nötig scheint, und `Score` ordnet den Schweregrad anhand einer beschriebenen Skala ein.

Der Anwendungscode prüft die Vorschläge und legt fest, ob ein risikoarmer Fall in dieses Team-Postfach gelangt. Bei uneinheitlichen Antworten, unklarer Dringlichkeit oder einem unbekannten Fall prüft ein Mensch die Nachricht. Solange ein deutscher Testdatensatz keine akzeptable Rate falscher automatischer Weiterleitungen zeigt, bleibt die Weiterleitung manuell.

## Integration und Betrieb

TypeSafe dokumentiert das [Python-SDK](https://docs.typesafe.ai/sdk/python.md), das [JavaScript/TypeScript-SDK](https://docs.typesafe.ai/sdk/javascript.md) sowie einen [Quickstart](https://docs.typesafe.ai/introduction/quickstart.md) für `POST /v1/systemone`. Die Anwendung sendet Zustand und Fragen und verarbeitet die Antworten. Jev nimmt Text oder texttragendes JSON an, aber keine Bilder, Audio- oder Videoeingaben; diese müssen vorher umgewandelt werden.

Halte Fragen eng und unabhängig; kombiniere umfassende Bewertungen im Anwendungscode. Exakte Datums- und Betragsrechnung, Richtlinien sowie Rechte gehören in deterministischen Code. Große Eingabekontexte können die Qualität verändern; TypeSafe dokumentiert diese Grenze für [Jev 1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md). Plane Schwellenwerte, Fehlerrouten, Protokollierung und Rückfallverhalten mit ein.

## Qualität messen, bevor etwas automatisch läuft

Beginne mit gelabelten Fällen und einer getrennten Testmenge. Für Deutsch gehören Umgangssprache, Tippfehler, kurze Antworten, mehrere Anliegen und Widersprüche hinein. Prüfe auch, ob Anweisungen im Nachrichtentext die Klassifikation beeinflussen; Eingabetext darf keine Berechtigung geben, Systemregeln zu umgehen.

Miss Präzision und Fehlerraten pro Frage, falsche automatische Weiterleitungen und den Anteil ohne menschlichen Eingriff. Vergleiche Sprache und Falltyp. TypeSafe nennt Englisch als stärkste Sprache, dokumentiert aktuell `jev-1.13.0` und berechnet Eingabetokens mit $0.042 pro Million; Aliase können wechseln ([Modelle](https://docs.typesafe.ai/models.md)). Binde getestete Schwellen an eine feste Version und evaluiere Änderungen erneut.

## Sicherheit, Datenschutz und Grenzen

TypeSafe sagt, Kundenanfragen und Antworten nicht zum Training zu nutzen; die [Rechtsseiten](https://docs.typesafe.ai/legal.md) verlinken eine DPA und nennen ZDR für Unternehmenskunden. Die [Datenschutzerklärung](https://typesafe.ai/legal/privacy-policy) nennt die USA als Hosting-Standort. Prüfe vor personenbezogenen oder regulierten Daten Aufbewahrung, Unterauftragnehmer, Übermittlungen, Löschung und Vertrag. „Kein Training“ bedeutet nicht „keine Speicherung“.

Typisierte Ausgabe verhindert weder Fehlinterpretationen noch Prompt Injection. Anonymisierung, minimale Datenfelder, begrenzte Aktionen und nachvollziehbare Eskalation bleiben Anwendungssache. Für rechtliche, finanzielle oder sicherheitsrelevante Folgen reicht ein Modellwert allein nicht als Freigabe.

## Kosten und laufender Aufwand

Die dokumentierte Preisangabe für Jev 1.13 beträgt 0,042 US-Dollar pro Million Eingabetokens; Ausgabetokens sind kostenlos. Hundert Millionen Eingabetokens entsprächen damit rechnerisch 4,20 US-Dollar an Modellkosten. Das ist kein Gesamtpreis: Zustand und Fragetexte verbrauchen Eingabetokens, hinzu kommen mögliche Wiederholungen, menschliche Prüfung, Anbindung, Monitoring und Pflege des gelabelten Datensatzes. Ein kurzer Pilot mit gemessener Tokenmenge liefert eine bessere Budgetbasis als die Anzahl der Antworten allein.

## Redaktionelle Einschätzung

**Redaktionelles Verdikt: Mit Vorbehalt.**

Wir sehen Jev mit Vorbehalt für Teams, die viele wiederkehrende Textentscheidungen in klar abgegrenzte Felder überführen müssen und die Antworten vor jeder Aktion durch eigene Regeln führen. Der praktische Wert hängt davon ab, ob ein eigener Datensatz für die betreffende Sprache und Fallklasse genügend sichere Automatisierung bei vertretbarer Fehlerquote zeigt.

Für Kundentexte, Bildanalyse oder Erklärungen passt eher eine generative Modell-API; exakte Regeln und Rechnungen gehören in Code. Ohne bestandene deutsche Evaluation, Datenschutzfreigabe und manuellen Rückweg sollte Jev keine Fälle selbstständig weiterleiten.

## Alternativen

- [OpenAI API](/tools/openai-api/): Für Teams, die neben strukturierten Daten auch Textgenerierung, Tool-Aufrufe oder multimodale Eingaben brauchen.
- [Anthropic API](/tools/anthropic-api/): Eine generative API für Dokumentenarbeit, längere Textanalyse und erklärende Antworten.
- [Cohere](/tools/cohere/): Interessant, wenn Embeddings, Suche und Reranking Teil des Problems sind; es ist kein gleichartiger Ersatz für jede Entscheidung.
- [Pydantic AI](/tools/pydantic-ai/): Ein Python-Framework für typisierte Agenten-Workflows, das ein Inferenzmodell orchestriert statt selbst eines bereitzustellen.

## FAQ

**Generiert Jev Antworten für einen Chatbot?**

Nein. Jev beantwortet definierte Fragen mit typisierten Werten. Für frei formulierte Chat-Antworten braucht die Anwendung ein anderes Modell.

**Ist die Antwort durch ein festes Schema automatisch korrekt?**

Nein. Ein Schema begrenzt nur die Form, nicht die sachliche Richtigkeit. Evaluation und Eskalation müssen Fehlentscheidungen sichtbar machen.

**Kann Jev deutsche Support-Nachrichten verarbeiten?**

Englisch ist laut Dokumentation die stärkste Sprache. Ein repräsentativer, separat gelabelter deutscher Testdatensatz sollte über den Einsatz entscheiden.

**Was ist der Unterschied zwischen Confidence und Wahrscheinlichkeit?**

Choice und Score liefern Wahrscheinlichkeiten und einen zusammenfassenden Confidence-Wert. Noul liefert nur die Ja-Wahrscheinlichkeit von 0 bis 1. Keiner der Werte beweist Wahrheit.

**Kann ich sensible Nachrichten direkt senden?**

Erst nach Prüfung der eigenen Datenschutzanforderungen. TypeSafe verlinkt eine DPA, nennt ZDR für Unternehmenskunden und weist auf US-Hosting hin. Entferne unnötige Identifikatoren und kläre Aufbewahrung sowie Vertrag.

**Was sollte bei niedriger Confidence passieren?**

Nicht raten lassen: nachfragen oder manuell prüfen. Lege Schwellen anhand gelabelter Beispiele und der Fehlerfolgen fest.

**Wie viel kostet die API im Betrieb?**

Berechnet werden Eingabetokens; Ausgabetokens sind kostenlos. Miss auch Wiederholungen, Integration und menschliche Prüfung in einem datenschutzgerecht vorbereiteten Pilot.

**Sollte ich `jev-latest` oder eine feste Version verwenden?**

Ein Alias ist zum Erkunden bequem. Sobald Schwellen davon abhängen, pinne die getestete Version und evaluiere jeden Wechsel erneut.
