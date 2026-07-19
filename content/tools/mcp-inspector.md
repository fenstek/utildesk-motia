---
slug: mcp-inspector
title: MCP Inspector
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: "Entwickler-Tools"
price_model: "Open Source"
tags: [mcp, developer-tools, testing, debugging]
official_url: "https://github.com/modelcontextprotocol/inspector"
description: "MCP Inspector ist ein lokales Open-Source-Werkzeug zum interaktiven und skriptbaren Testen von MCP-Servern; sein Prozess-Proxy gehört niemals ungeschützt in ein fremdes Netz."
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# MCP Inspector

MCP Inspector ist ein Open-Source-Entwicklerwerkzeug zum Testen und Debuggen von Model Context Protocol Servern. Es verbindet sich wie ein MCP-Client über stdio, SSE oder Streamable HTTP, zeigt Fähigkeiten und Nachrichten in einer Weboberfläche und bietet zusätzlich einen CLI-Modus für reproduzierbare Prüfungen. Es ist kein allgemeiner HTTP-Traffic-Sniffer und keine Produktions-Gateway-Lösung. Sein lokaler Proxy kann Prozesse starten und Server erreichen, weshalb er nur in einer vertrauenswürdigen Entwicklungsumgebung laufen darf.

## Für wen eignet sich MCP Inspector?

Das Werkzeug richtet sich an Entwickler von MCP-Servern, Integrations- und QA-Teams sowie Maintainer von MCP-Clients. Es hilft, Initialisierung, Tool-Schemas, Resources, Prompts, Benachrichtigungen, Authentifizierung und Transportprobleme unabhängig von einem vollständigen Host wie einer Coding-App zu untersuchen. Für Endnutzer, dauerhaftes Monitoring oder zentrale Secrets-Verwaltung ist es nicht gedacht.

Besonders nützlich ist die Trennung zwischen interaktiver UI und CLI: Die Oberfläche beschleunigt Exploration, während CLI-Aufrufe sich in Smoke Tests oder CI übernehmen lassen.

## Architektur und getestete Funktionen

MCP Inspector besteht aus einem React-basierten Client und einem Node.js-Proxy. Der Proxy ist gleichzeitig MCP-Client und HTTP-Server für die Oberfläche; er fängt keinen beliebigen Netzwerkverkehr ab. Ein lokaler Server kann mit seinem Startbefehl und Argumenten übergeben werden. Remote-Server werden per URL und passenden Headern verbunden.

<figure class="tool-editorial-figure">
  <img src="/images/tools/mcp-inspector-editorial.webp" alt="Illustration zu MCP Inspector: ein lokaler Prüfstand vergleicht MCP-Tools, Resources und Prompts über mehrere Transportwege" loading="lazy" decoding="async" />
</figure>

In der UI lassen sich Tools auflisten und mit schemaabhängigen Eingaben aufrufen, Resources durchsuchen, Prompts prüfen sowie Fehler und Benachrichtigungen beobachten. Konfigurationen können als Server-Eintrag oder komplette MCP-Datei exportiert werden. Der CLI-Modus unterstützt die wichtigsten Operationen für Tools, Resources und Prompts mit maschinenlesbarer Ausgabe.

## Praktischer Test-Workflow

1. Eine unterstützte Node.js-Version verwenden und Inspector nur aus einer vertrauenswürdigen Shell starten.
2. Den MCP-Server mit Test-Credentials und minimalen Rechten lokal oder in einer isolierten Umgebung ausführen.
3. Initialisierung, Capabilities und erwartete Listen für Tools, Resources und Prompts prüfen.
4. Für jedes Tool gültige, fehlende, falsche und grenzwertige Argumente senden; Ergebnis, Fehlercode und Nebenwirkung dokumentieren.
5. Timeouts, Abbruch, Fortschrittsmeldungen, erneute Verbindung und Transportwechsel testen.
6. Relevante Fälle als CLI-Kommandos in automatisierte Smoke Tests übertragen.
7. Produktionszugänge aus der Inspector-Konfiguration entfernen und das Ergebnis im eigentlichen MCP-Client erneut verifizieren.

## Transporte, Authentifizierung und Export

Stdio startet einen lokalen Prozess und verbindet dessen Standardkanäle. SSE und Streamable HTTP adressieren Remote-Endpunkte; für authentifizierte Verbindungen können Header beziehungsweise Bearer Tokens gesetzt werden. Exportierte `mcp.json`-Einträge sind praktisch für Clients, können aber Befehle, Pfade, URLs oder Environment-Werte enthalten. Sie gehören wie Code reviewed und dürfen keine echten Secrets im Repository speichern.

Clientseitige Timeouts lassen sich konfigurieren. Sie sind unabhängig vom Timeout des MCP-Servers: Ein abgebrochener Inspector-Request beweist nicht, dass der Server seine Arbeit beendet hat. Schreibende Tools müssen daher idempotent sein oder eine klare Statusabfrage anbieten.

## Qualität, Automation und Grenzen

Ein erfolgreicher Tool-Aufruf beweist nur einen Pfad. Ein brauchbarer Vertragstest prüft Schema, Pflichtfelder, optionale Defaults, Fehlermeldungen, Berechtigungen, große Antworten und Nebenwirkungen. Der Inspector soll tiefe Eingabevalidierung bewusst dem Server überlassen; deshalb muss die Serverimplementierung falsche oder manipulierte Argumente selbst robust ablehnen.

CLI-Ausgaben eignen sich für CI und schnelle Regressionstests. Der Inspector ersetzt jedoch kein Lasttestwerkzeug, keine langfristige Observability, kein Fuzzing und keine fachliche Abnahme. Für Produktionsqualität braucht es zusätzlich Unit- und Integrationstests des Servers, reale Host-Kompatibilität und Monitoring am Deployment.

## Sicherheit, Datenschutz und Rechte

Der Proxy kann lokale Prozesse starten und beliebige angegebene MCP-Server erreichen. Die offizielle Dokumentation warnt ausdrücklich davor, ihn ungeschützt in nicht vertrauenswürdige Netze zu stellen. Standardmäßig binden Client und Proxy an localhost, der Proxy benötigt einen zufälligen Session-Token und Origin-Prüfung schützt gegen DNS Rebinding. Diese Kontrollen dürfen nicht aus Bequemlichkeit deaktiviert werden.

`HOST=0.0.0.0` erweitert die Angriffsfläche erheblich. Teste Remote-Szenarien stattdessen in einem isolierten Netz oder Tunnel mit zusätzlicher Authentifizierung. Tokens, Tool-Ausgaben und Resource-Inhalte können vertraulich sein; Bildschirmfreigaben, Logs, Browser-Speicher und exportierte Configs gehören in das Daten- und Löschkonzept.

## Kosten und Auswahlkriterien

MCP Inspector steht unter MIT-Lizenz und verursacht keine Lizenzgebühr. Aufwand entsteht durch Entwicklungszeit, CI-Laufzeit, Testumgebungen und die Systeme, die aufgerufene Tools tatsächlich nutzen. Die entscheidende Auswahlfrage lautet, ob ein Team MCP-Verhalten untersuchen will. Für normale REST-, GraphQL- oder gRPC-APIs bietet ein allgemeiner API-Client meist den passenderen Funktionsumfang.

## Redaktionelle Einschätzung

Wir empfehlen MCP Inspector jedem Team, das einen MCP-Server entwickelt oder integriert, als lokalen Diagnose- und Smoke-Test-Baustein. Wert entsteht durch sichtbare Protokolloperationen und die Möglichkeit, erkannte Fälle in CLI-Tests zu überführen.

Als öffentlich erreichbarer Proxy, Produktions-Gateway oder alleinige Qualitätssicherung ist das Werkzeug ungeeignet. Dort braucht es eine gehärtete Serverlaufzeit, echte Authentifizierung, Autorisierung, Observability und vertragsbasierte Tests.

## Alternativen

- [Postman](/tools/postman/): Umfangreiche Kollaborations-, Mock-, Dokumentations- und Testfunktionen für klassische HTTP- und API-Workflows.
- [Bruno](/tools/bruno/): Lokaler, Git-orientierter API-Client mit dateibasierten Collections und CLI für reproduzierbare Request-Tests.
- [Insomnia](/tools/insomnia/): Desktop-Client für REST, GraphQL und gRPC mit Umgebungen und Authentifizierungs-Workflows.
- [Hoppscotch](/tools/hoppscotch/): Schneller webbasierter API-Client für gängige Protokolle, wenn MCP-spezifische Exploration nicht benötigt wird.

## FAQ

**Kann MCP Inspector einen lokalen stdio-Server starten?**

Ja. Der Serverbefehl, Argumente und Test-Environment können beim Start übergeben werden. Verwende dafür nur vertrauenswürdigen Code und kurzlebige, minimal berechtigte Credentials.

**Darf der Proxy im Teamnetz freigegeben werden?**

Standardmäßig sollte er ausschließlich auf localhost bleiben. Wenn Netzwerkzugriff unvermeidbar ist, braucht er isolierte Infrastruktur, zusätzliche Zugriffskontrollen und eine bewusste Risikoanalyse; ein offener Bind ist gefährlich.

**Eignet sich der CLI-Modus für CI?**

Ja, insbesondere zum Auflisten und Aufrufen von Tools sowie zum Prüfen von Resources und Prompts. Stabile Assertions und Testdaten müssen im Projekt ergänzt werden; der CLI-Erfolg allein ist kein vollständiger Vertragstest.

**Speichert Inspector Tokens sicher für Produktion?**

Er besitzt Schutz für die lokale Proxy-Sitzung und kann Auth-Header senden, ist aber kein Enterprise-Secret-Manager. Produktions-Tokens gehören in den vorgesehenen Secret Store und nicht dauerhaft in URLs, Exportdateien oder Browserprofile.
