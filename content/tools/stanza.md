---
slug: stanza
title: Stanza
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: "AI Coding"
price_model: Open Source
tags: [nlp, python, developer-tools]
official_url: "https://stanfordnlp.github.io/stanza/"
description: "Stanza ist eine Python-NLP-Bibliothek von Stanford für mehrsprachige linguistische Pipelines. Sie strukturiert Rohtext, liefert Annotationen und lässt sich mit eigenen Daten evaluieren."
popularity: 0
tier: "D"
generated_at: "2026-05-18"
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# Stanza

Stanza ist eine Python-Bibliothek für die linguistische Analyse vieler menschlicher Sprachen. Aus Rohtext erzeugt sie eine konfigurierbare Pipeline mit Sätzen, Tokens, Lemmata, Wortarten, morphologischen Merkmalen, Abhängigkeitsstrukturen und benannten Entitäten. Das ist eine andere Aufgabe als Textgenerierung oder ein Chatbot: Stanza annotiert vorhandenen Text, damit nachgelagerte Suche, Korpusauswertung, Klassifikation oder Datenaufbereitung darauf aufbauen können.

## Was ist Stanza und für wen?

Stanza richtet sich an Entwickler, Forschende und Data-Science-Teams, die eine nachvollziehbare NLP-Verarbeitung in Python betreiben möchten. Das Projekt stammt aus der Stanford-NLP-Umgebung und nutzt vortrainierte neuronale Modelle, die für einzelne Sprachen und Prozessoren geladen werden. Mehrsprachige Projekte profitieren von der einheitlichen Pipeline-Idee, sollten aber jede relevante Sprache und Domäne separat prüfen.

Für ein kleines Skript, das nur Zeichenfolgen trennt, wäre Stanza vermutlich zu umfangreich. Sinnvoll wird es, wenn linguistische Annotationen wiederholt gebraucht werden und das Ergebnis als strukturierte Daten weiterlebt.

<figure class="tool-editorial-figure">
  <img src="/images/tools/stanza-editorial.webp" alt="Illustration zu Stanza: Eine Bahnhofshalle führt markierte Sprachfragmente über getrennte Lichtpfade" loading="lazy" decoding="async" />
</figure>

## Welche Komponenten gehören in die Pipeline?

Die zentrale `Pipeline` verbindet einzelne `Processor`. Typisch beginnt sie mit Tokenisierung und Satzsegmentierung. Je nach Sprache kann die Multi-Word-Token-Erweiterung folgen; danach kommen POS- und morphologisches Tagging, Lemmatisierung, Dependency Parsing und Named Entity Recognition. Weitere Prozessoren decken unter anderem Sentiment und Constituency Parsing ab, sofern passende Modelle verfügbar sind. Die Ausgaben landen in einem `Document` mit Sätzen, Tokens, Wörtern und Annotationen.

Die Auswahl sollte vom Ziel abhängen. Wer nur Entitäten extrahiert, muss nicht automatisch jede Analysekomponente laden. Sprach- und Processor-Pakete können getrennt gewählt werden; die verwendete Modellvariante gehört deshalb in die Konfiguration und in die Dokumentation des Projekts.

## Praktischer Workflow

Ein belastbarer Einstieg beginnt mit einem kleinen, repräsentativen Korpus. Zuerst werden die benötigten Sprachmodelle und Processor-Ressourcen geladen, danach wird eine Pipeline mit der gewünschten Sprache und Processor-Liste gebaut. Die Pipeline verarbeitet Text oder bereits teilweise annotierte `Document`-Objekte. Für wiederholte Jobs sollte die Pipeline einmal pro Worker geladen werden, statt für jedes Dokument neu zu starten.

Im nächsten Schritt speichert das Team nicht nur das Endergebnis, sondern auch Modellpaket, Sprachcode, Konfiguration und Version der Python-Umgebung. Ein Beispielworkflow kann Rechnungs- oder Supporttexte in Sätze und Entitäten zerlegen, diese Felder in ein internes Format exportieren und nur die daraus abgeleiteten Daten an die Suche oder Klassifikation übergeben. Rohtext und Annotationen bleiben dabei getrennt, damit Fehler zurückverfolgt werden können.

## Integration und Betrieb

Stanza passt in Python-Services, Batch-Jobs und Forschungsnotebooks. Modelle werden standardmäßig lokal in einem Ressourcenverzeichnis abgelegt und können nach dem Download offline verwendet werden. Für größere Mengen ist GPU-Unterstützung möglich; CPU-Betrieb bleibt eine Option, kann aber längere Laufzeiten bedeuten. Container, Dependency-Lockfile und ein definierter Modellcache helfen, Notebook-Ergebnisse in reproduzierbare Jobs zu überführen.

Im Betrieb gehören Queue-Größe, Laufzeit pro Dokument, Speicherverbrauch und Fehlerhafteingaben ins Monitoring. Lange Dokumente, ungewöhnliche Unicode-Zeichen oder unvollständige Vorannotation können die Verarbeitung beeinflussen. Ein Worker sollte fehlgeschlagene Dokumente isoliert protokollieren, statt eine gesamte Charge stillschweigend als erfolgreich zu markieren.

## Qualität und Entscheidungskriterien

Vor einer Entscheidung sollte ein handgeprüftes Set aus echten Dokumenten erstellt werden, einschließlich Abkürzungen, Eigennamen, Tabellenresten, gemischten Sprachen und absichtlich schwierigen Sätzen. Verglichen werden sollten nicht nur allgemeine Modellwerte, sondern die Felder, die im eigenen Prozess tatsächlich weiterverwendet werden: etwa Entity-Treffer, Satzgrenzen oder syntaktische Relationen.

Ein sinnvoller Pilot misst Präzision und Recall auf den wichtigsten Annotationen, Laufzeit und Speicher pro Dokument sowie den Anteil manueller Korrekturen. Die Baseline kann eine einfachere Bibliothek oder regelbasierte Verarbeitung sein. Wenn Stanza bei den relevanten Fällen nicht besser ist oder die zusätzliche Modellpflege nicht rechtfertigt, ist die Alternative die bessere technische Entscheidung.

## Datenschutz, Rechte und Governance

Stanza ist lokale Software, aber lokale Ausführung macht Daten nicht automatisch unkritisch. Korpora können personenbezogene, vertrauliche oder lizenzierte Inhalte enthalten. Vor dem Import müssen Zweck, Zugriff, Aufbewahrung, Anonymisierung und Exportformat geklärt werden. Bei selbst trainierten Modellen kommen Herkunft und Nutzungsrechte der Annotationen hinzu.

Für reproduzierbare Forschung und Produktion sollten Modellressourcen, Konfigurationen und Testdaten versioniert werden, ohne sensible Originaltexte in Logs zu schreiben. Die Lizenz des Pakets, der Modellressourcen und möglicher Trainingsdaten ist getrennt zu prüfen; Open Source bedeutet nicht, dass jedes Korpus frei weiterverwendet werden darf.

## Preise und reale Kosten

Stanza wird im Katalog als Open Source geführt. Es gibt damit keine typische SaaS-Sitzplatzabrechnung, aber der Betrieb ist nicht kostenfrei: CPU- oder GPU-Zeit, Speicher für Modelle, Container, Batch-Infrastruktur, Monitoring und menschliche Nachkontrolle gehören in die Kalkulation. Bei eigener Modelltrainierung kommen Datenaufbereitung, Annotation und Experimentierzeit hinzu.

## Alternativen

- [spaCy](/tools/spacy/): Praktischer für schnelle, produktionsnahe Python-Pipelines und eigene Komponenten, wenn maximale linguistische Breite nicht der Hauptgrund ist.
- [NLTK](/tools/nltk/): Geeignet für Lehre, klassische NLP-Verfahren und kleine Experimente mit vielen zugänglichen Einzelbausteinen.
- [Hugging Face](/tools/hugging-face/): Besser, wenn moderne Transformer-Modelle, Modellvergleich oder ein breiterer Hub wichtiger sind als eine einheitliche linguistische Pipeline.
- [Flair](/tools/flair/): Interessant für Teams, die Embeddings und Sequenzlabeling mit einem stärker modellorientierten Framework untersuchen.
- [Google Cloud Natural Language](/tools/google-cloud-natural-language/): Eine verwaltete API-Option, wenn eigener Modellbetrieb vermieden werden soll und Cloud-Datenfluss akzeptabel ist.

## Redaktionelle Einschätzung

Wir empfehlen Stanza für Python-Teams und Forschungsprojekte, die mehrsprachige linguistische Annotationen als nachvollziehbaren Verarbeitungsschritt brauchen und Modelle, Daten sowie Evaluation selbst verantworten können. Wert entsteht, wenn konkrete Felder wie Entitäten, Lemmata oder syntaktische Relationen einen nachgelagerten Prozess verbessern und dieser Effekt auf einem eigenen Testset messbar ist.

Wer nur eine schnelle Produktionspipeline mit minimalem Betriebsaufwand sucht, sollte zuerst spaCy prüfen. Wer dagegen generative oder sehr aktuelle Transformer-Modelle vergleichen möchte, ist mit Hugging Face wahrscheinlich näher am Ziel. Stanza ist eine gute spezialisierte Wahl, aber kein Ersatz für eine Qualitätsstrategie.

## FAQ

**Kann Stanza offline laufen?**

Ja. Nach dem Herunterladen der benötigten Modelle kann die Pipeline lokal und ohne laufende Verbindung zum Anbieter ausgeführt werden. Der Modellcache und die Versionen sollten für reproduzierbare Jobs kontrolliert werden.

**Brauche ich eine GPU?**

Nein. Stanza läuft auch auf der CPU. Eine GPU kann bei großen Textmengen die Verarbeitung beschleunigen; ob sich die Infrastruktur lohnt, sollte mit der eigenen Dokumentgröße und Batchrate gemessen werden.

**Kann Stanza eigene Modelle nutzen?**

Die neuralen Module können mit eigenen annotierten Daten trainiert und evaluiert werden. Das ist ein Trainings- und Datenprojekt, nicht nur eine Option in der normalen `Pipeline`-Konfiguration.

**Ist Stanza für sensible Dokumente geeignet?**

Die lokale Ausführung kann den externen Datentransfer reduzieren, ersetzt aber keine Datenschutz- und Rechteprüfung. Zugriff, Speicherorte, Logs, Korpuslizenz und Modellherkunft müssen vor dem Einsatz geklärt sein.
