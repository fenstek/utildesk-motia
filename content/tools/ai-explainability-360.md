---
slug: ai-explainability-360
title: AI Explainability 360
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: "AI Infrastructure"
price_model: Open Source
tags: [ml, explainability, ai]
official_url: "https://github.com/Trusted-AI/AIX360"
popularity: 0
description: "AI Explainability 360 bündelt Python-Methoden für lokale und globale Erklärungen von ML-Modellen und Daten. Der Nutzen hängt von passenden Testdaten, Modellzugriff und sauberem Dependency-Management ab."
updated_at: 2026-07-13
lastReviewed: 2026-07-13
tier: "C"
generated_at: "2026-05-14"
---
# AI Explainability 360

AI Explainability 360 (AIX360) ist eine Python-Bibliothek für Erklärungen rund um Daten und Machine-Learning-Modelle. Sie bündelt unterschiedliche Ansätze: direkte und post-hoc-Erklärungen, lokale Erklärungen einzelner Vorhersagen, globale Modellbilder sowie Methoden für Zeitreihen. Das ist kein fertiger Compliance-Bericht und kein Knopf, der aus jedem neuronalen Netz eine verständliche Regelmaschine macht. AIX360 liefert Bausteine, aus denen ein Data-Science-Team einen prüfbaren Erklärungsworkflow baut.

## Für wen eignet sich AIX360?

AIX360 passt zu Data Scientists und ML Engineers, die mehrere Erklärungsarten in einer Python-Umgebung vergleichen wollen. Ein Kreditrisiko-Team kann etwa einzelne Ablehnungen untersuchen, ein Qualitäts-Team kann Merkmalsänderungen über viele Fälle vergleichen und ein Monitoring-Team kann bei Zeitreihen prüfen, welche Abschnitte eine Prognose beeinflussen. Für reine Business-Nutzer ohne Python- und Modellkenntnisse ist das Paket nicht die passende Oberfläche.

Der Ausgangspunkt sollte eine konkrete Frage sein: Warum wurde dieser Fall so klassifiziert? Welche Merkmale treiben das Modell im Bestand? Welche plausible Änderung würde eine andere Entscheidung erzeugen? Je präziser diese Frage ist, desto leichter lässt sich ein passender Explainer auswählen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/ai-explainability-360-editorial.webp" alt="Illustration zu AI Explainability 360: ein transparentes Modell, Attributionspunkte und eine Waage machen Modellentscheidungen prüfbar" loading="lazy" decoding="async" />
</figure>

## Was steckt im Toolkit?

Das offizielle Repository beschreibt AIX360 als Sammlung von Algorithmen und Proxy-Metriken, nicht als eine einzelne Methode. Je nach Daten- und Modellfrage kommen unter anderem LIME und SHAP für lokale post-hoc-Erklärungen, kontrastive Erklärungen, ProtoDash, Regelmodelle und verschiedene direkt interpretierbare Verfahren infrage. Die Version 0.3.0 ergänzt auch Methoden für Zeitreihen, darunter TSLIME, TSICE und TSSaliency.

Diese Breite ist der Vorteil, aber auch die Lernkurve. Eine SHAP-Attribution beantwortet nicht dieselbe Frage wie eine kontrastive Erklärung oder eine direkt interpretierbare Regel. Vor jeder Visualisierung sollte dokumentiert werden, ob die Erklärung lokal oder global ist, welche Daten perturbiert werden und ob der Explainer das Modell nur über eine Prediction-Schnittstelle oder über Gradienten sieht.

## Praktischer Workflow

Ein belastbarer Pilot beginnt mit einem eingefrorenen Testset aus normalen Fällen, Grenzfällen und bewusst schwierigen Gegenbeispielen. Danach wird ein Modelladapter mit klarer Eingabe- und Ausgabeform gebaut. Das Team wählt zunächst eine Methode für die konkrete Frage, erzeugt Erklärungen für einzelne Fälle und fasst sie erst anschließend zu globalen Mustern zusammen.

Für eine Kreditentscheidung könnten lokale kontrastive Beispiele erklären, welche Merkmalskombination zu einer anderen Klassifikation führen würde. Für eine Bildprüfung kann eine Saliency- oder Attribution-Ansicht zeigen, ob das Modell tatsächlich das Objekt statt eines Hintergrundartefakts nutzt. Bei einer Nachfrageprognose sind zeitlich strukturierte Perturbationen sinnvoller als unabhängiges Verändern einzelner Spalten. Jede Erklärung sollte mit Modellrevision, Eingabedaten, Parametern und Zeitpunkt gespeichert werden.

## Evaluation und Betriebsgrenzen

Eine plausible Grafik ist noch kein Beweis, dass die Erklärung faithful ist. Prüfe deshalb mindestens, ob wichtige Merkmale bei kontrollierten Änderungen tatsächlich das Modellverhalten beeinflussen und ob die Erklärung auf leicht veränderten, aber fachlich gleichartigen Fällen stabil bleibt. AIX360 enthält unter anderem Faithfulness- und Monotonicity-Metriken; deren Ergebnis muss aber zur jeweiligen Methode und Domäne passen.

Die Bibliothek sitzt neben dem Modell, nicht an dessen Stelle. Sie stellt keine allgemeine Modellüberwachung, kein Rollen- und Freigabesystem und keine automatische regulatorische Entscheidung bereit. In Produktion braucht es weiterhin ein Artefakt-Repository, reproduzierbare Umgebungen, Logging, Review-Verantwortung und einen Plan für neue Modell- oder Datenversionen.

## Integration und Abhängigkeiten

AIX360 lässt sich in Python-Notebooks, Tests und bestehende ML-Pipelines einbauen. Für einzelne Explainer können optionale Installationsgruppen genutzt werden. Das ist besser als blind alle Abhängigkeiten zu installieren, denn das Repository weist selbst auf mögliche Versionskonflikte zwischen Algorithmen hin und empfiehlt eine isolierte Umgebung. Ein reproduzierbares `requirements`- oder Conda-Setup, ein kleiner Smoke-Test und ein gespeichertes Beispielergebnis gehören daher zum Rollout.

Vor einer Freigabe sollte der Adapter mit fehlenden Werten, kategorialen Features, falschen Datentypen und einem leeren Batch getestet werden. Außerdem muss klar sein, ob die Erklärung synchron in einer Nutzeranfrage entsteht oder nachgelagert berechnet wird. Rechenintensive Perturbationen können für interaktive Oberflächen zu langsam sein und gehören dann in einen kontrollierten Job.

## Datenschutz, Lizenz und Governance

Erklärungen können sensible Merkmale sichtbar machen, selbst wenn das Modell selbst keine Rohdaten exportiert. Personenbezogene Eingaben, medizinische Werte oder interne Feature-Namen sollten nur in einer Umgebung verarbeitet und gespeichert werden, die dafür freigegeben ist. Logdateien und gespeicherte Gegenbeispiele brauchen dieselbe Lösch- und Zugriffspolitik wie die ursprünglichen Modellinputs.

Vor dem Einsatz sind die Lizenz des AIX360-Repositories, die Lizenzen der optionalen Abhängigkeiten und mögliche Zusatzbedingungen einzelner Beispiele zu prüfen. Für eine Entscheidung gegenüber Betroffenen sollte die erzeugte Erklärung außerdem fachlich lesbar sein und nicht ungeprüft als Kausalnachweis verkauft werden. Eine Attribution beschreibt Modellverhalten unter Annahmen; sie beweist nicht automatisch eine Ursache in der Welt.

## Kosten und realer Aufwand

AIX360 ist Open Source und hat keine eigene Nutzungsgebühr. Die Rechnung entsteht trotzdem durch CPU/GPU-Zeit für Perturbationen, Speicher für Testdaten und Erklärungsartefakte, CI-Läufe sowie die Pflege mehrerer Python-Abhängigkeiten. Bei wenigen Offline-Analysen ist das meist ein überschaubarer Infrastrukturposten. Bei Erklärungen pro Nutzeranfrage können Latenz, Caching und Batch-Verarbeitung wichtiger werden als die Lizenzfrage.

## Redaktionelle Einschätzung

Wir empfehlen AIX360 Teams, die mehrere Explainability-Fragen mit eigenen Modellen untersuchen und die Auswahl der Methode selbst verantworten können. Besonders sinnvoll ist es für Forschungs- und Diagnosephasen, für Vergleichstests und für einen kontrollierten Erklärungsservice mit festem Testset.

Nicht empfehlen wir AIX360 als alleinige Governance-Lösung oder als schnelle UI für Fachabteilungen. Wenn nur Feature-Attribution für tabellarische Modelle gebraucht wird, ist SHAP oft der kürzere Weg; für PyTorch-spezifische Attribution kann Captum passender sein. Der Wert von AIX360 entsteht erst, wenn Modelladapter, Validierung, Versionierung und fachliche Prüfung mitgeliefert werden.

## Alternativen

- [SHAP](/tools/shap/): spezialisiert auf Feature-Attribution und eignet sich, wenn lokale und globale Beiträge in tabellarischen oder modellnahen Workflows im Zentrum stehen.
- [LIME](/tools/lime/): schlanker für lokale, modellagnostische Erklärungen einzelner Vorhersagen, wenn kein breites Toolkit benötigt wird.
- [InterpretML](/tools/interpretml/): bietet eine stärker zusammengefasste Interpretability-Umgebung mit transparenten Modellen, Explainern und Dashboard-orientierter Nutzung.
- [Captum](/tools/captum/): die naheliegendere Wahl für Attribution und Interpretability direkt im PyTorch-Ökosystem.
- [Hugging Face](/tools/hugging-face/): sinnvoll, wenn Modellwahl, Model Cards und Betrieb offener Modelle wichtiger sind als ein spezialisiertes Explainability-Toolkit.

## FAQ

**Brauche ich ein bestimmtes ML-Framework für AIX360?**

Nein, aber die konkrete Methode entscheidet über die nötigen Abhängigkeiten und den Modellzugriff. Plane einen Adapter und prüfe die unterstützte Konfiguration des gewählten Explainers, statt die Kompatibilität pauschal anzunehmen.

**Sind AIX360-Erklärungen automatisch verlässlich?**

Nein. Sie sind modell- und methodenabhängige Näherungen. Teste Faithfulness, Stabilität und fachliche Plausibilität mit bekannten Fällen und dokumentiere die Grenzen der Darstellung.

**Kann AIX360 sensible Produktionsdaten verarbeiten?**

Technisch kann eine lokale Python-Installation Daten verarbeiten. Ob das erlaubt ist, hängt aber von Hosting, Zugriffen, Logs, Löschung, Lizenz- und Datenschutzvorgaben deines Projekts ab.

**Wie starte ich mit möglichst wenig Risiko?**

Nimm ein Modell, ein kleines repräsentatives Testset und eine einzige Entscheidungsfrage. Pinne die Umgebung, speichere Modellrevision und Parameter und vergleiche die Erklärung mit fachlich bekannten Gegenbeispielen, bevor du sie Nutzern zeigst.
