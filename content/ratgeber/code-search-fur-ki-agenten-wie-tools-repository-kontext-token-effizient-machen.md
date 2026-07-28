---
slug: "code-search-fur-ki-agenten-wie-tools-repository-kontext-token-effizient-machen"
title: "Code Search für KI-Agenten: Erst finden, dann verstehen, dann ändern"
date: 2026-06-06
updated: 2026-07-28
category: "Vergleich"
eyebrow: "KI-Vergleich"
excerpt: "Ein Coding-Agent braucht nicht das ganze Repository im Kontext. Er braucht einen nachvollziehbaren Weg von der Frage zur Definition, zum Test und zum kleinen Diff."
readTime: 7
coverImage: /images/ratgeber/code-search-fur-ki-agenten-cover-editorial-v1.webp
secondaryImage: /images/ratgeber/code-search-fur-ki-agenten-repository-map-editorial-v1.webp
tags:
  - "Developer Tools"
  - "KI-Agenten"
  - "Code Search"
  - "Repository Understanding"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Mehr Kontext ist nicht automatisch besser: Ungeprüfter Code kann einen Agenten vom eigentlichen Fehler wegführen."
  - "Exakte Suche, Struktur und Tests sind meist wichtiger als eine aufwendige semantische Suche."
  - "Ein guter Agent kann zeigen, welche Dateien er gelesen hat und warum der Patch dort entsteht."
relatedTools:
  - title: "Aider"
    href: "/tools/aider/"
  - title: "Cursor"
    href: "/tools/cursor/"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
  - title: "Sourcegraph"
    href: "/tools/sourcegraph/"
---

Ein Bug-Ticket lautet: „Die Einladung funktioniert nach einem Rollenwechsel nicht mehr.“ Wer einen Agenten jetzt mit dem ganzen Repository füttert, bekommt oft eine lange Erklärung und einen Patch an der falschen Stelle. Der brauchbare Weg beginnt kleiner: Wo wird eine Einladung ausgelöst? Wo wird die Rolle geprüft? Welcher Test beschreibt den Ablauf? Erst dann lohnt sich eine Änderung.

Code-Suche für Agenten ist keine Token-Spar-Zauberei. Sie ist eine Methode gegen falsches Selbstvertrauen. Der Agent muss nicht alles lesen; er muss zeigen können, warum gerade diese Dateien, Symbole und Tests zu der Aufgabe gehören.

## Drei Sucharten haben verschiedene Jobs

**Exakte Suche** ist der Startpunkt. Namen von Events, API-Routen, Fehlermeldungen oder Feature-Flags sind oft die schnellste Spur. `rg`, IDE-Suche und Git-Blame beantworten keine Architekturfrage, aber sie zeigen, wo eine Behauptung überhaupt vorkommt.

**Strukturelle Suche** hilft, wenn Schreibweisen variieren. Eine Suche nach Funktionsaufrufen, Imports oder Klassenhierarchien kann sauberer sein als ein Texttreffer. Sie ist besonders nützlich, wenn ein Begriff gleichzeitig in Kommentaren, Tests und Implementierung auftaucht.

**Semantische Suche** ist ein Zusatz für Fragen ohne klare Begriffe: „Wo wird Berechtigung vor dem Versand geprüft?“ Sie kann gute Kandidaten liefern, darf aber nicht als Beweis gelten. Jeder Treffer muss wieder in Definition, Call-Site und Test zurückgeführt werden.

Die Reihenfolge ist bewusst unspektakulär: exakten Anker finden, Umgebung lesen, dann entscheiden, ob weitere Suche nötig ist. Das ist weniger spektakulär als ein Agent, der hundert Dateien zusammenfasst. Es führt aber häufiger zu einem Diff, das ein Reviewer versteht.

## Eine Repo-Map ist ein Stadtplan, keine Antwortmaschine

[Aider](/tools/aider/) nutzt eine kompakte Repo-Map: wichtige Dateien und Symbole werden als Überblick in den Kontext gelegt. Das kann helfen, wenn ein Agent sonst nicht weiss, ob ein Modul zentral oder nur ein Adapter ist. Auch [Cursor](/tools/cursor/) und [GitHub Copilot](/tools/github-copilot/) sammeln Projektkontext, bevor sie eine Änderung vorschlagen.

Die Gefahr beginnt, wenn die Karte als Wahrheit behandelt wird. Maps altern nach Refactorings. Sie zeigen Beziehungen, aber nicht zwingend Laufzeitbedingungen, Berechtigungen oder ein gerade aktives Feature-Flag. Ein Agent sollte sie als Hypothese nutzen und vor einem Patch mindestens die Zieldefinition und den relevanten Test lesen.

![Eine Repository-Karte verbindet Symbole, Tests und Änderungspfad](/images/ratgeber/code-search-fur-ki-agenten-repository-map-editorial-v1.webp)

## Ein Ablauf, den man im Review prüfen kann

1. **Frage schärfen.** Was soll sich für wen in welchem Zustand ändern? Eine reproduzierbare Erwartung ist wertvoller als ein allgemeines „funktioniert nicht“.
2. **Anker suchen.** Fehlermeldung, Route, Event, Datenfeld oder Testname liefern die ersten Dateien.
3. **Grenze ziehen.** Der Agent nennt, welche Dateien er gelesen hat und welche er bewusst nicht anfasst.
4. **Patch klein halten.** [Claude](/tools/claude/) oder [OpenAI Codex](/tools/openai-codex/) können den Vorschlag erklären; der Diff bleibt trotzdem die entscheidende Schnittstelle.
5. **Test gegen die Ausgangsfrage.** Nicht nur „Build ist grün“, sondern: Deckt ein Test Rollenwechsel und Einladung wirklich ab?

Diese Schleife kostet am Anfang eine Minute mehr. Sie spart Zeit, sobald ein Agent plausible, aber falsche Zusammenhänge konstruiert.

## Wann ein Suchindex lohnt

Ein eigener Index ist sinnvoll, wenn viele Repositories, Monorepos oder interne Bibliotheken beteiligt sind und dieselben Fragen wiederkehren. [Sourcegraph](/tools/sourcegraph/) kann Symbole und Referenzen über grössere Codebestände hinweg auffindbar machen. Aktualisierung, Zugriffsrechte und Ausnahmen gehören dann aber zum Produkt, nicht in einen Nebenjob des Agents.

Für ein einzelnes, gepflegtes Repository reichen meist gute Ordnerstruktur, aussagekräftige Tests, `rg`, eine IDE und kleine Agentenaufträge. Ein Vektorindex kompensiert keine fehlenden Ownership-Grenzen oder Tests.

## Was Teams messen sollten

Miss nicht nur eingesparte Tokens. Zähle, wie oft ein Agent die richtige Datei beim ersten Versuch findet, wie gross seine Diffs werden, welche Vorschläge im Review zurückgehen und ob Tests den beschriebenen Fehler wirklich verhindern. Wenn Suche schneller wird, aber Reviews länger und Fehler subtiler werden, ist der Index kein Gewinn.

## Fazit

Ein Agent braucht keinen Repository-Roman im Kontext. Er braucht eine prüfbare Spur: einen konkreten Anker, relevante Definitionen, einen begrenzten Patch und einen Test gegen die ursprüngliche Erwartung. Gute Suche macht Agenten nicht magisch klüger. Sie macht ihre Arbeit kleiner, erklärbarer und damit nützlicher.

## Quellen

- [Aider: Repository map](https://aider.chat/docs/repomap.html)
- [Sourcegraph: Code Search](https://sourcegraph.com/docs/code-search)
- [ripgrep repository](https://github.com/BurntSushi/ripgrep)
