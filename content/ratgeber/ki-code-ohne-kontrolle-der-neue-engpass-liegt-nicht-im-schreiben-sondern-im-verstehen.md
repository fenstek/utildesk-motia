---
slug: "ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen"
title: "KI-Code ohne Kontrolle: Ein grüner Pull Request ist noch kein Beweis"
date: 2026-05-20
updated: 2026-07-28
category: "Praxis"
eyebrow: "AI-Code Review"
excerpt: "Ein Agent kann einen überzeugenden Patch in Minuten liefern. Diese Redaktionseinordnung zeigt, welche Belege ein Team braucht, bevor daraus verantwortbarer Produktionscode wird."
readTime: 8
coverImage: /images/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen-cover-story-v1.webp
secondaryImage: /images/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen-workflow-story-v1.webp
tags:
  - "AI Coding"
  - "Code Review"
  - "Softwarequalität"
  - "Developer Tools"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein grüner Build beweist nur, dass genau die ausgeführten Checks grün waren. Er ersetzt weder fachliches Verständnis noch einen klaren Eigentümer für die Änderung."
  - "Für KI-Code hilft eine Evidenzleiter: Absicht, Änderungsgrenze, Tests, Fehlerszenarien und menschliche Freigabe."
relatedTools:
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "Cursor"
    href: "/tools/cursor/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
---

Der Pull Request ist grün. Der Linter ist grün. Die neuen Tests sind grün. Im Chat steht eine saubere Zusammenfassung, warum der Agent eine Berechtigungsprüfung verschoben und eine Hilfsfunktion eingeführt hat. Das fühlt sich wie ein Abschluss an. In Wahrheit ist es erst der Moment, in dem ein Team die richtige Frage stellen muss: *Was genau beweist dieses Grün?*

Die Antwort ist kleiner, als sie klingt. Ein grüner Lauf beweist, dass die Checks, die tatsächlich ausgeführt wurden, nicht fehlgeschlagen sind. Er beweist nicht automatisch, dass die Anforderung richtig verstanden wurde, dass eine seltene Rolle keinen Schaden nimmt oder dass die neue Abstraktion in sechs Monaten noch lesbar ist. Genau an dieser Lücke entscheidet sich, ob KI-Code Tempo schafft oder nur Arbeit in den Review verschiebt.

## Plausibel ist nicht dasselbe wie verstanden

[GitHub Copilot](/tools/github-copilot/), [Cursor](/tools/cursor/), [Claude Code](/tools/claude/) und [OpenAI Codex](/tools/openai-codex/) können Formulierungen, Muster und Tests überzeugend nachbilden. Das ist hilfreich. Es hat aber eine Nebenwirkung: Ein Patch kann vertraut aussehen, bevor jemand seine Annahmen geprüft hat.

Martin Fowler trennt in seiner aktuellen Arbeit über agentisches Coding die schnelle Erzeugung von Code von dessen innerer Qualität. Das ist der Kern des Problems. Ein Team besitzt nicht nur Dateien. Es besitzt die Fähigkeit, sie zu ändern, wenn Anforderungen, Daten oder Abhängigkeiten sich verändern. Diese Fähigkeit sinkt, wenn ein Diff nur durch seinen Autor im Chat erklärt werden kann oder niemand sagen kann, warum er genau diese Grenze überschreitet.

![Softwareteam prüft einen schnellen Strom aus KI-Code gegen Architektur, Tests und Verantwortlichkeit](/images/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen-workflow-story-v1.webp)

## Die Evidenzleiter für einen KI-Patch

Statt Reviewern eine zusätzliche, diffuse Vorsicht aufzubürden, hilft eine feste Reihenfolge. Sie macht aus „Sieht gut aus“ eine Reihe konkreter Belege.

**1. Absicht.** Ein Satz muss erklären, welches Nutzer- oder Systemproblem der Diff löst. Kein Feature-Katalog, sondern der überprüfbare Zweck.

**2. Grenze.** Der Pull Request benennt, welche Dateien, Services oder Datenflüsse er absichtlich *nicht* verändert. Diese negative Aussage ist wertvoll: Sie macht Übergriff sichtbar.

**3. Verhalten.** Tests zeigen mindestens einen Erfolgspfad und den relevanten Fehler- oder Berechtigungspfad. Ein neu geschriebener Test ist nur dann ein Beleg, wenn er am alten Verhalten sinnvoll scheitern würde.

**4. Folgen.** Der Autor oder Agent beschreibt neue Abhängigkeiten, Datenbewegungen, Flags und Rollback-Schritte. Wenn das nicht kurz erklärt werden kann, ist der Diff meist zu groß.

**5. Eigentum.** Ein Mensch, nicht ein Tool, bestätigt, wer die Änderung nach dem Merge wartet und welche Annahme er im Zweifel noch einmal prüft.

Diese Leiter ist keine Bürokratie um der Bürokratie willen. Sie verkürzt Diskussionen, weil Reviewer nicht erst erraten müssen, welchen Beweis sie suchen.

## Kleine Änderungen sind keine Kleinlichkeit

GitHub rät zu kleinen, fokussierten Pull Requests und zu Kontext für die Personen, die sie prüfen. Bei KI-Code ist das besonders wichtig. Ein Agent kann aus einer einfachen Anforderung ohne Mühe einen Architekturvorschlag machen. Das ist manchmal richtig. Häufiger ist es aber ein zweiter Auftrag, der separat diskutiert werden sollte.

Die nützliche Reaktion auf einen zu großen Agenten-Diff lautet daher nicht „mehr Review-Energie“. Sie lautet: aufteilen. Erst die minimal nötige Korrektur. Dann, falls sie sinnvoll ist, ein eigenständiger Refactoring-Vorschlag. Dadurch bleibt die fachliche Entscheidung sichtbar und ein grüner Testlauf wird nicht mit einer stillen Architekturfreigabe verwechselt.

## Was ein guter Reviewer anders fragt

Der klassische Kommentar „Kannst du das vereinfachen?“ reicht bei KI-Code nicht immer. Besser sind Fragen, die auf Annahmen zielen:

- Welcher reale Fehlerfall oder welches Nutzerziel wird hier abgedeckt?
- Welche bestehende Regel im Repository stützt diese Lösung?
- Welcher Test würde fehlschlagen, wenn diese Annahme falsch ist?
- Welche Rolle, alte Datenform oder externe Antwort ist absichtlich nicht abgedeckt?
- Welche Änderung muss zurückgerollt werden können, wenn die Annahme nicht hält?

Diese Fragen sind nicht agentenspezifisch. Sie sind gutes Engineering. Ein Agent macht sie nur dringlicher, weil er in kurzer Zeit mehr scheinbar fertigen Code liefern kann.

## Der Merge ist eine verantwortete Wette

Ein Team muss KI-Code nicht misstrauisch behandeln, als sei er grundsätzlich fremd. Aber es sollte ihn auch nicht durchwinken, weil er gut formuliert ist. Der praktikable Mittelweg lautet: Agenten produzieren Vorschläge und erste Belege; Menschen entscheiden, ob die Belege zur Risikoklasse der Änderung passen.

Das verschiebt die Arbeit weg vom bloßen Schreiben und hin zu einer besseren Frage: *Wissen wir genug, um diese Änderung zu besitzen?* Wenn die Antwort Nein lautet, ist das kein Scheitern des Agenten. Es ist ein Signal, den Diff kleiner zu machen, einen Test nachzuziehen oder die fachliche Entscheidung sichtbar zu treffen. Genau dafür sollte ein Review da sein.

## Quellen

- [GitHub Docs: Pull Requests sinnvoll prüfen](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
- [GitHub Docs: Kontext, Selbstreview und fokussierte Änderungen](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes)
- [Martin Fowler: Internal quality while coding with an agent](https://martinfowler.com/articles/exploring-gen-ai/ccmenu-quality.html)
