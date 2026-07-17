---
description: "Microsoft Agent Framework ist ein Werkzeug für den beschriebenen Arbeitsablauf. Prüfe vor dem Einsatz Daten, Zuständigkeiten, Kosten und die offiziellen Produktangaben."
slug: "microsoft-agent-framework"
title: "Microsoft Agent Framework"
category: "Entwickler-Tools"
price_model: "Open Source"
tags: [ai, agents, framework, dotnet, python, developer-tools]
official_url: "https://learn.microsoft.com/en-us/agent-framework/overview/"
tier: D
generated_at: 2026-06-24
popularity: 0
updated_at: "2026-07-17"
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: "2026-07-17"
editorial_status: "manual_polished"
editorial_batch: "2026-07-17-full-tool-card-editorial"
---

# Microsoft Agent Framework

**Microsoft Agent Framework ist ein Entwickler-Framework für den Bau von agentenbasierten Anwendungen und mehrstufigen Workflows.** Es richtet sich an Teams, die autonome oder teilautonome Assistenzfunktionen nicht als lose Skriptlösung, sondern als strukturierten Softwarebaustein umsetzen wollen. Der Schwerpunkt liegt auf zwei Dingen: einzelnen Agents, die mit Modellen, Tools und MCP-Servern arbeiten, und Workflows, die mehrere Schritte, mehrere Agents oder Funktionen kontrolliert zusammenführen.

Praktisch relevant ist das vor allem für Projekte, bei denen ein LLM nicht nur einmal antworten soll, sondern in einer Anwendung eingebettet wird: mit Zustandsverwaltung, Tool-Nutzung, Kontext, Kontrollpunkten und einer nachvollziehbaren Ausführung. Laut offizieller Übersicht unterstützt das Framework mehrere Modell- und Anbieterumgebungen, darunter Microsoft Foundry, Anthropic, Azure OpenAI, OpenAI und Ollama. Für Entwickler mit .NET- oder Python-Stack ist das interessant, weil sich die Arbeit damit näher an klassischer Anwendungsentwicklung als an experimentellem Prompting anfühlt.

## Für wen eignet sich Microsoft Agent Framework?

Microsoft Agent Framework eignet sich für Entwicklerteams, die agentenbasierte Funktionen sauber in bestehende Produkte integrieren wollen. Das betrifft besonders Teams, die bereits mit .NET oder Python arbeiten und ein Framework suchen, das nicht nur Modellaufrufe kapselt, sondern auch State, Tool-Integration und Orchestrierung mitdenkt.

Typische Zielgruppen sind:

- Produktteams, die Assistenzfunktionen in interne Tools, Portale oder Fachanwendungen einbauen möchten.
- Plattform- und Backend-Teams, die robuste Abläufe mit mehreren Schritten, Abzweigungen oder menschlicher Freigabe modellieren müssen.
- Teams, die MCP-Server als Werkzeugquelle anbinden wollen und dafür eine strukturierte Laufzeitumgebung brauchen.
- Entwickler, die Agenten nicht als Demo, sondern als wartbare Softwarekomponente behandeln.
- Organisationen, die mit verschiedenen Modellanbietern arbeiten und eine gewisse Austauschbarkeit im Setup behalten möchten.

Weniger geeignet ist das Framework für sehr kleine Aufgaben, die sich sauber als normale Funktion oder Regelwerk abbilden lassen. Die offizielle Dokumentation macht diesen Punkt selbst deutlich: Wenn sich das Problem als klassische Funktion lösen lässt, ist das meist der bessere Weg.

<figure class="tool-editorial-figure">
  <img src="/images/tools/microsoft-agent-framework-editorial.webp" alt="Illustration zum Microsoft Agent Framework: Spezialisierte Teams bauen unter gemeinsamer Architektur eine modulare Brücke" loading="lazy" decoding="async" />
</figure>

## Hauptfunktionen

Microsoft Agent Framework bündelt laut Dokumentation mehrere Ebenen, die für produktionsnahe Agenten wichtig sind:

- **Agents:** Einzelne Agents nehmen Eingaben entgegen, nutzen Modelle, rufen Tools auf und erzeugen Antworten. Das ist der Kern für dialogorientierte oder zielgerichtete Assistenz.
- **Workflows:** Für mehrstufige Abläufe bietet das Framework graphbasierte Workflows. Damit lassen sich Schritte explizit verbinden, verzweigen oder parallelisieren, statt alles in einer monolithischen Agentenlogik zu verstecken.
- **Modellzugriff:** Unterstützt werden unterschiedliche Modell- und Laufzeitumgebungen. Das ist nützlich, wenn man nicht an einen einzigen Anbieter gebunden sein will.
- **Tool-Integration:** Das Framework arbeitet mit Tools und MCP-Servern, also mit klaren Integrationspunkten für externe Fähigkeiten, Datenquellen oder Aktionen.
- **Sitzungs- und Zustandsverwaltung:** Für Konversationen und längere Aufgaben ist ein Agent Session-Konzept vorgesehen, damit Kontext nicht bei jedem Aufruf verloren geht.
- **Kontext und Memory:** Kontextprovider helfen dabei, Speicher- und Erinnerungslogik kontrolliert aufzubauen.
- **Middleware:** Aktionen von Agents lassen sich abfangen, prüfen oder ergänzen. Das ist wichtig für Logging, Richtlinien, Filter oder Speziallogik.
- **Human-in-the-loop und Checkpoints:** Für kontrollierte Prozesse unterstützt das Framework Prüfpunkte und menschliche Eingriffe, was bei sensiblen oder längeren Abläufen praxisnah ist.
- **.NET- und Python-Zugriff:** Das Framework adressiert beide Welten, was in gemischten Teams oft ein Vorteil ist.

## Workflow-Fit

Der beste Fit entsteht dort, wo ein Prozess zwar durch ein Modell unterstützt wird, aber nicht völlig offen und unkontrolliert laufen soll.

Sehr passend ist das Framework für:

- geführte Recherche- oder Analyseabläufe mit klaren Zwischenschritten,
- Support- oder Assistenzprozesse mit Tool-Nutzung,
- interne Automatisierungen mit Freigabe- oder Kontrollpunkten,
- koordinierte Aufgaben, bei denen mehrere Agents oder Funktionen zusammenspielen,
- Szenarien, in denen ein Ergebnis nachvollziehbar und reproduzierbar bleiben muss.

Weniger passend ist es für offene Enden ohne klaren Produktnutzen oder für einfache Einzelfunktionen, bei denen ein normaler Service, eine API oder ein Batch-Job genügt. Der Sinn des Frameworks liegt gerade darin, Unschärfe und Komplexität kontrollierbar zu machen.

## Vorteile und Nachteile

### Vorteile

- Kombination aus Agenten- und Workflow-Ansatz in einem Framework.
- Geeignet für .NET und Python, also für zwei verbreitete Entwicklungsumgebungen.
- Unterstützt verschiedene Modellanbieter und damit eine flexiblere Architektur.
- MCP-Anbindung macht Tool- und Datenintegration strukturiert.
- Zustandsverwaltung und Kontextverwaltung helfen bei längeren oder mehrstufigen Interaktionen.
- Checkpoints und Human-in-the-loop passen gut zu produktionsnahen Abläufen.
- Middleware eröffnet saubere Ansatzpunkte für Governance, Logging und Anpassungen.
- Für Teams, die bereits in Microsoft- oder Azure-nahen Umgebungen arbeiten, wirkt die Einbindung nachvollziehbar.

### Nachteile

- Für kleine, klar abgegrenzte Aufgaben kann das Framework zu schwergewichtig sein.
- Der produktive Nutzen hängt stark davon ab, wie gut Modelle, Tools und Zustandslogik zusammenspielen.
- Bei Drittanbieter-Systemen trägt man laut Microsoft Verantwortung für Nutzung, Kosten und die Prüfung der Datenflüsse.
- Agenten- und Workflow-Design erfordert Architekturdisziplin; ohne sauberes Konzept wird es schnell unübersichtlich.
- Die Qualität der Ergebnisse bleibt abhängig vom Modell, vom Prompt-Design und von den eingebundenen Tools.
- Wer nur ein einfaches Chat-Interface braucht, bekommt hier eher ein Entwicklerwerkzeug als eine sofort fertige Anwendung.

## Datenschutz und Datenhinweise

Für Datenschutz und Datenflüsse ist vor allem wichtig, wie das Framework in der eigenen Umgebung eingesetzt wird. Microsoft weist darauf hin, dass bei der Nutzung mit Drittanbieter-Systemen, nicht-azurebasierten Modellen oder externen Servern die Verantwortung beim Betreiber liegt. Das betrifft insbesondere:

- welche Daten an externe Systeme gesendet werden,
- wo Daten verarbeitet oder gespeichert werden,
- ob die Datenflüsse mit internen Compliance-Vorgaben vereinbar sind,
- welche Berechtigungen, Grenzen und Freigaben im Setup nötig sind.

In der Praxis sollte man also nicht nur das Framework selbst betrachten, sondern vor allem die Modell- und Tool-Kette dahinter. Wer sensible Inhalte verarbeitet, sollte Trennlinien, Filter, Protokollierung und Freigaben bewusst planen. Auch die eigene Responsible-AI-Logik muss meist separat umgesetzt werden, statt sie vom Framework zu erwarten.

## Preise & Kosten

**Preislabel: Open Source**

Das Framework selbst ist laut Einordnung als Open-Source-Lösung zu behandeln. Für die Nutzung des Frameworks fallen damit nicht zwangsläufig Lizenzkosten an. In einem realen Projekt können aber trotzdem Kosten entstehen, etwa durch:

- Modellnutzung bei einem Anbieter,
- Hosting und Betrieb der Anwendung,
- Azure- oder andere Cloud-Ressourcen,
- externe Tools, Datenquellen oder MCP-Server,
- Entwicklungs- und Wartungsaufwand.

Besonders bei Drittanbieter-Systemen sollten Kosten und Verantwortlichkeiten getrennt betrachtet werden. Das Framework ist also nicht automatisch teuer, aber ein produktiver Agent-Stack ist selten kostenlos im Gesamtbetrieb.

👉 **Zum Anbieter:** https://learn.microsoft.com/en-us/agent-framework/overview/

## Redaktionelle Aktualisierung Juni 2026

Microsoft Agent Framework ist strategisch spannend, weil Microsoft Agenten nicht nur als Demo-Pattern, sondern als reguläre Softwarearchitektur behandelt: Sessions, Tools, MCP, Checkpoints, Human-in-the-loop und Workflows gehören direkt zum Denkmodell. Das macht die Lösung vor allem für Teams interessant, die bereits in .NET, Python, Azure oder Microsoft Foundry investieren.

Der wichtigste Praxisfilter lautet: Nicht jede Automatisierung braucht einen Agenten. Wenn ein Prozess deterministisch, regelbasiert und gut testbar ist, bleibt normaler Anwendungscode oft robuster. Das Framework lohnt sich dort, wo Sprache, Tool-Nutzung, Kontext und kontrollierte Zwischenschritte zusammenkommen und man trotzdem nachvollziehbare Freigaben behalten will.

## Redaktionelle Einschätzung

Microsoft Agent Framework wirkt wie ein ernstzunehmendes Entwicklerwerkzeug für Teams, die agentenbasierte Funktionen mit klarer Struktur bauen wollen. Der größte Wert liegt nicht in einer einzelnen Funktion, sondern in der Kombination aus Agents, Workflows, Zustandsverwaltung und Integrationspunkten. Das Framework versucht damit genau die Lücke zu schließen zwischen experimentellen LLM-Setups und einem wartbaren Anwendungssystem.

Besonders überzeugend ist der Workflow-Ansatz: Nicht jeder Vorgang sollte einem freien Agenten überlassen werden. Wenn ein Prozess planbar ist, ist ein expliziter Graph oft robuster als eine rein generative Schleife. Ebenso sinnvoll ist die MCP-Anbindung, weil sie Toolzugriffe und externe Fähigkeiten besser in eine konsistente Architektur einbettet.

Grenzen gibt es aber ebenfalls. Das Framework ersetzt kein gutes Produktdesign, keine saubere Sicherheitsarchitektur und keine gute Modellwahl. Wer es einsetzt, muss Ziele, Datenflüsse und Kontrollpunkte selbst sauber definieren. Für kleine Aufgaben ist es wahrscheinlich zu viel, für produktionsnahe Agenten- und Workflow-Szenarien dagegen sehr passend.

## FAQ

**Ist Microsoft Agent Framework nur für Azure gedacht?**

**Wie sollte ein Pilot mit Microsoft Agent Framework aussehen?**

Für Microsoft Agent Framework: Starte mit einem abgegrenzten Prozess, wenigen Beteiligten und einem klaren Erfolgskriterium. Prüfe Ergebnisqualität, Berechtigungen und Übergaben, bevor der Einsatz erweitert wird.

**Welche Daten sollten nicht ungeprüft in Microsoft Agent Framework verarbeitet werden?**

Microsoft Agent Framework: Sensible oder vertrauliche Inhalte gehören erst nach Prüfung von Vertrag, Zugriffen, Speicherort und Löschmöglichkeiten in den Prozess. Bei Unsicherheit sollte der Datenschutzverantwortliche entscheiden.

**Wann ist eine Alternative zu Microsoft Agent Framework sinnvoll?**

Bei Microsoft Agent Framework ist eine Alternative sinnvoll, wenn der Bedarf nur gelegentlich auftritt, die nötige Integration fehlt oder Administration und Kosten den Nutzen übersteigen.

Nein. Laut offizieller Übersicht werden mehrere Umgebungen und Modellanbieter unterstützt. Azure-nahe Setups sind naheliegend, aber nicht die einzige Option.

**Brauche ich .NET, um das Framework zu nutzen?**  
Nein. Die Dokumentation nennt sowohl .NET als auch Python. Für Teams mit gemischtem Stack ist das hilfreich.

**Wann sollte ich einen Workflow statt eines Agents verwenden?**  
Wenn der Ablauf klar definiert ist, mehrere Schritte festgelegt sind oder mehrere Komponenten koordiniert werden müssen. Für offene, eher dialogische Aufgaben passt ein Agent besser.

**Unterstützt das Framework Tool-Nutzung?**  
Ja. Agents können Tools und MCP-Server nutzen, um externe Fähigkeiten oder Datenquellen einzubinden.

**Ist das Framework für produktive Anwendungen geeignet?**  
Es ist ausdrücklich auf robuste, sichere und interaktive Anwendungen ausgerichtet. Die Produktreife hängt aber vom eigenen Setup, den Modellen, den Tools und den Sicherheitsmaßnahmen ab.

**Fallen neben dem Framework selbst weitere Kosten an?**  
Sehr wahrscheinlich ja, je nach Modellanbieter, Hosting und Integrationen. Open Source bedeutet hier nicht automatisch kostenfreien Gesamtbetrieb.

**Wie wichtig ist Zustandsverwaltung bei solchen Anwendungen?**  
Sehr wichtig, wenn Konversationen oder Aufgaben länger laufen. Das Framework bringt dafür eigene Bausteine mit, damit Kontext und Fortschritt nicht verloren gehen.

**Kann ich damit menschliche Freigaben in Abläufe einbauen?**  
Ja, die Workflow-Seite unterstützt Kontrollpunkte und Human-in-the-loop-Szenarien. Das ist besonders nützlich bei sensiblen Entscheidungen oder Freigaben.

Дата/время: 2026-06-24 00:00 (Europe/Berlin)

## Alternativen

- [asana](/tools/asana/): ist eine prüfenswerte Option, wenn ein anderer bestehender Workflow oder ein anderes Ökosystem besser passt.
- [Microsoft Teams](/tools/microsoft-teams/): ist eine prüfenswerte Option, wenn sich Anforderungen an Umfang, Zusammenarbeit oder Administration unterscheiden.
- [zoom](/tools/zoom/): ist eine prüfenswerte Option, wenn sich Anforderungen an Umfang, Zusammenarbeit oder Administration unterscheiden.
- [dropbox-business](/tools/dropbox-business/): ist eine prüfenswerte Option, wenn sich Anforderungen an Umfang, Zusammenarbeit oder Administration unterscheiden.
