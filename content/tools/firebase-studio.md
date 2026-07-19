---
slug: firebase-studio
title: Firebase Studio
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: "AI Infrastructure"
price_model: Freemium
tags: [ai, app-builder, cloud-development, firebase]
official_url: "https://firebase.studio/"
description: "Cloud-Entwicklungsumgebung mit Gemini und Firebase-Anbindung für bestehende Workspaces; Neuanlage ist gesperrt und die Abschaltung für März 2027 angekündigt."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# Firebase Studio

Firebase Studio ist eine browserbasierte Cloud-Entwicklungsumgebung mit Code-Editor, Terminal, Vorschau, Gemini-Unterstützung und Firebase-Deploymentwegen. Die entscheidende Grenze ist inzwischen der Produktstatus: Seit 22. Juni 2026 sind neue Registrierungen und Workspaces deaktiviert, und die Umgebung soll am 22. März 2027 abgeschaltet werden. Die Karte ist daher vor allem für Betrieb und Migration bestehender Workspaces relevant, nicht als Empfehlung für neue Projekte.

## Was ist Firebase Studio und wer kann es noch nutzen?

Bestehende Nutzer können weiterhin vorhandene Workspaces öffnen, Anwendungen entwickeln, testen und bis zum Abschaltdatum bereitstellen. Der Code-Modus basiert auf einer cloudgehosteten Entwicklungsumgebung mit anpassbarer Nix-Konfiguration. Der App Prototyping agent erzeugt aus Text, Bildern oder Skizzen einen Entwurf, Code und eine Vorschau; dieser Prototyping-Pfad ist auf Webanwendungen ausgerichtet und erstellt keine neuen Workspaces mehr.

Firebase-Dienste wie Authentication, Cloud Firestore und App Hosting werden nicht zusammen mit Studio eingestellt. Betroffen ist die Entwicklungsumgebung. Bereits bereitgestellte Anwendungen laufen nach offizieller Aussage weiter, sofern ihre Firebase- und Cloud-Ressourcen unabhängig korrekt betrieben werden.

## Welche Komponenten bilden den Workflow?

Ein Workspace verbindet Code OSS, Terminal, Quellcodeverwaltung, Web- oder Android-Vorschau, Erweiterungen aus Open VSX und Gemini-Funktionen. Projekte können aus GitHub, GitLab, Bitbucket oder Archiven stammen. Nix beschreibt Systempakete und Werkzeuge reproduzierbar. Für Firebase-nahe Tests steht die Local Emulator Suite zur Verfügung; Deployments können je nach Anwendung über App Hosting, Firebase Hosting, Cloud Run oder eigene Infrastruktur erfolgen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/firebase-studio-editorial.webp" alt="Browserbasierter Entwicklungsraum mit Code, Vorschau, Cloud-Bausteinen und markiertem Migrationspfad" loading="lazy" decoding="async" />
</figure>

Der App Prototyping agent und Gemini können Code schreiben und Werkzeuge ausführen. Der erzeugte Stand bleibt prüfpflichtig; die offizielle Dokumentation warnt ausdrücklich vor plausiblen, aber falschen Ausgaben und ungetestetem Produktionscode.

## Praktischer Workflow für bestehende Workspaces

1. Zuerst Quellcode, Git-Remote, verwendete Firebase-Projekte, Hosting-Backends, Domains, Umgebungsvariablen und Abrechnungskonten inventarisieren.
2. Den Workspace in einem privaten Git-Repository sichern oder über die vorgesehene Zip-Funktion exportieren. Beim Prototyping agent beachten, dass Antworten lokale Commits erzeugen können.
3. Tests in Emulatoren oder getrennten Projekten ausführen und Security Rules, Authentication-Flows sowie Hosting-Konfiguration unabhängig vom Studio-Preview prüfen.
4. Den Zielweg wählen: Google AI Studio für browserbasiertes Prototyping oder Google Antigravity für codeorientierte lokale Agentenarbeit.
5. Migration frühzeitig durchführen, Zielumgebung testen und erst danach den alten Workspace als entbehrlich markieren.

Chatverlauf gehört nicht automatisch zum normalen Codeexport. Wer ihn aus Nachweisgründen benötigt, muss die dokumentierten Dateien separat sichern und dabei sensible Prompts wie Produktionsdaten behandeln.

## Migration, Deployment und Betrieb

Für Google AI Studio gibt es einen geführten Transfer. Wer eine bestehende App-Hosting-URL behalten möchte, sollte Code über GitHub synchronisieren und Umgebungsvariablen im Firebase-Backend neu konfigurieren. Schlüssel gehören nicht ins Repository; bei feineren Zugriffsanforderungen ist Secret Manager der passendere Ort.

Der Antigravity-Pfad exportiert den Workspace und öffnet ihn lokal. Die Firebase CLI kann bestimmte Projektarten konvertieren, deckt aber nicht zwangsläufig jedes Framework vollständig ab. Nach der Migration müssen Preview, Build, Authentifizierung, Regeln, Domains und Deployment erneut geprüft werden. Spätestens am 22. März 2027 werden verbleibende Studio-Daten laut Zeitplan dauerhaft gelöscht.

## Qualität, Evaluation und Produktionsgrenze

Ein Prototyp ist kein Produktionsnachweis. Teams sollten Anforderungen als Tests formulieren, Datenmodell und Security Rules separat reviewen, Fehlerfälle in Emulatoren prüfen und Deploymentartefakte reproduzierbar aus Git erstellen. Für AI-Funktionen gehören Prompt-Injection, ungeeignete Ausgaben, Rate Limits und Kosten in die Abnahme.

Bewertet wird außerdem die Portabilität: Lässt sich die Anwendung ohne den Studio-Workspace lokal starten, bauen und deployen? Sind alle Secrets, APIs und Cloud-Ressourcen dokumentiert? Ein Projekt, das nur über die aktuelle Browseroberfläche wiederherstellbar ist, hat seine Migration noch nicht bestanden.

## Sicherheit, Datenschutz und Governance

In Gemini-Chats sollen keine personenbezogenen Daten oder Nutzerdaten eingegeben werden. `.aiexclude` kann Dateien aus dem Gemini-Kontext ausschließen; von Git ignorierte Dateien werden ebenfalls nicht indexiert. Diese Mechanismen ersetzen keine Datenklassifizierung, denn Quellcode, Prompts, Screenshots und Logs können dennoch vertrauliche Informationen enthalten.

Automatisch erzeugte Gemini-API-Schlüssel können im Workspace in einer `.env`-Datei liegen. Vor Git-Synchronisation müssen sie entfernt und im Zielsystem sicher als Umgebungsvariable oder Secret gespeichert werden. Workspace-Freigaben, Firebase-IAM, Billing-Rechte und Deployment-Berechtigungen sollten getrennt und nach dem Prinzip der minimalen Rechte vergeben werden.

## Kosten und Folgekosten

Der Zugriff auf bestehende Firebase-Studio-Workspaces ist ohne eigene Studio-Gebühr möglich. Kosten entstehen jedoch durch Google Developer Program Premium, Gemini- beziehungsweise Modellnutzung und aktivierte Firebase- oder Google-Cloud-Dienste. App Hosting und andere Integrationen können ein Cloud-Billing-Konto voraussetzen; das Verknüpfen kann ein Firebase-Projekt auf den nutzungsbasierten Blaze-Plan umstellen.

Für die verbleibende Laufzeit kommen Migrationsaufwand, Doppelbetrieb, Regressionstests und gegebenenfalls neue Tool-Abonnements hinzu. Diese Übergangskosten sind wichtiger als alte Workspace-Kontingente, weil neue Workspaces ohnehin gesperrt sind.

## Redaktionelle Einschätzung

Firebase Studio empfehlen wir nur noch Teams, die bestehende Workspaces stabilisieren und geordnet migrieren müssen. Es bietet kurzfristig Wert, wenn die aktuelle Umgebung weiterhin funktioniert, der Code bereits gesichert ist und ein verbindlicher Übergangsplan zu Google AI Studio, Antigravity oder einem anderen Entwicklungssetup existiert.

Für neue Projekte ist eine Plattform mit fortlaufender Produktperspektive die bessere Wahl. Auch bestehende Teams sollten Studio nicht weiter zur einzigen Quelle für Code, Secrets oder Deploymentwissen machen; der Erfolg bemisst sich an einem getesteten Export und nicht an zusätzlicher Arbeit kurz vor der Abschaltung.

## Alternativen

- [Google AI Studio](/tools/google-ai-studio/): Offizieller Zielpfad für browserbasiertes, promptorientiertes Prototyping und damit die naheliegendste Migration für Prototyper-Projekte.
- [Replit](/tools/replit/): Browserbasierte Entwicklungs- und Deploymentumgebung für Teams, die neue Cloud-Workspaces statt eines auslaufenden Produkts benötigen.
- [StackBlitz](/tools/stackblitz/): Geeignet für schnelle Web-Prototypen und reproduzierbare Browserumgebungen mit engerem Fokus auf Webentwicklung.
- [CodeSandbox](/tools/codesandbox/): Alternative für isolierte Entwicklungsumgebungen, Reviews und geteilte Webprojekte ohne Bindung an Firebase Studio.

## FAQ

**Kann ich heute einen neuen Firebase-Studio-Workspace anlegen?**

Nein. Neue Registrierungen und Workspaces sind seit 22. Juni 2026 deaktiviert. Bestehende Workspaces bleiben bis zur angekündigten Abschaltung zugänglich und sollten jetzt migriert werden.

**Werden bereits veröffentlichte Firebase-Apps 2027 abgeschaltet?**

Nicht allein wegen des Studio-Endes. Zentrale Firebase-Dienste und bereits bereitgestellte Apps sind davon getrennt. Prüfe trotzdem Billing, Backend, Domains, Secrets und den zukünftigen Deploymentprozess außerhalb von Studio.

**Welcher Migrationspfad passt besser?**

Google AI Studio passt eher zu browserbasiertem Prompt-Prototyping. Google Antigravity ist für codeorientierte lokale Arbeit und agentische Workflows vorgesehen. Die Entscheidung sollte vom tatsächlichen Projekt und nicht vom Namen des bisherigen Workspaces abhängen.

**Reicht ein GitHub-Export als vollständige Sicherung?**

Nein. Zusätzlich sind Cloud-Projekte, Hosting-Konfiguration, Security Rules, Domains, Umgebungsvariablen, Abrechnung und gegebenenfalls Chatnachweise zu inventarisieren. Ein Restore- und Deploymenttest in der Zielumgebung ist der belastbare Beweis.
