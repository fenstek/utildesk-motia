---
slug: carbon-black
title: Carbon Black (VMware)
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: Entwickler-Tools
price_model: Abonnement
tags: [cybersecurity, endpoint-security, xdr, enterprise]
official_url: "https://www.broadcom.com/products/carbon-black"
description: "Endpoint-Sicherheitsplattform für Prävention, EDR und Incident Response mit Sensoren, Richtlinien und zentraler Untersuchung im Carbon-Black-Portfolio von Broadcom."
popularity: 0
tier: "D"
generated_at: "2026-05-17"
updated_at: 2026-07-14
---
# Carbon Black (VMware)

Carbon Black ist heute ein Broadcom-Portfolio für Endpoint-Sicherheit, dessen Produkte aus der VMware-Carbon-Black-Linie stammen. Je nach Vertrag und Modul geht es um Prävention und automatisierte Erkennung mit Carbon Black Cloud Endpoint Standard, um Threat Hunting und Incident Response mit Enterprise EDR oder um restriktive Application-Control-Regeln. Das ist kein einzelnes All-in-one-Produkt und ersetzt weder ein SOC noch getestete Wiederherstellung.

<figure class="tool-editorial-figure">
  <img src="/images/tools/carbon-black-editorial.webp" alt="Schwarz-weißer Cyberabwehr-Perimeter mit Einsatzteam" loading="lazy" decoding="async" />
</figure>

## Was ist Carbon Black und für wen?

Carbon Black richtet sich an Security- und IT-Teams, die Prozesse auf Endpoints sichtbar machen, riskante Verhaltensweisen blockieren und Vorfälle nachvollziehbar untersuchen müssen. Endpoint Standard kombiniert NGAV mit verhaltensbasierter EDR-Funktionalität. Enterprise EDR ist auf kontinuierliche Ereignisdaten, Suche und Reaktion ausgelegt. App Control verfolgt dagegen ein Positivmodell: Auf kritischen oder festen Systemen soll nur vertrauenswürdige Software laufen. Vor einer Beschaffung muss deshalb das konkrete Modul, die unterstützten Betriebssysteme und das gewünschte Deployment feststehen.

## Welche Komponenten greifen ineinander?

Ein Sensor sammelt je nach Produkt und Konfiguration Prozess-, Datei-, Netzwerk-, Skript- und Registry-Ereignisse und kommuniziert mit der Konsole. Richtlinien entscheiden, ob ein Verhalten nur protokolliert, blockiert oder ausdrücklich erlaubt wird. In der Cloud Console werden Geräte, Alerts, Investigations, Policies und Rollen verwaltet; APIs und Data Forwarder können Alerts und Endpoint-Ereignisse an ein SIEM oder einen Security Lake weitergeben. Enterprise EDR ergänzt Threat Intelligence, Watchlists und Live Response. Diese Bausteine müssen getrennt lizenziert und für den jeweiligen Mandanten geprüft werden.

## Praktischer Einführungs-Workflow

1. Inventarisiere Endpoints, Server, Workloads, Sondergeräte und Offline-Netze und bestimme, welche Telemetrie und Reaktion wirklich nötig sind.
2. Starte mit einer Testgruppe und einer beobachtenden Policy. Prüfe Sensor-Konnektivität, CPU- und Speicherlast, Proxy-Anforderungen, Agent-Updates und Deinstallation mit administrativen Rollen.
3. Führe danach gezielte Testfälle für Malware, PowerShell, Script- und Ransomware-Verhalten aus. Dokumentiere Detection, Block, Alert-Kontext und den manuellen Fallback.
4. Überführe bewährte Regeln stufenweise in eine Produktions-Policy. Änderungen brauchen Eigentümer, Testnachweis, Ausnahmen mit Ablaufdatum und einen Rollback-Weg.
5. Übe schließlich Triage, Isolation, Live Response, Beweissicherung und die Übergabe an Helpdesk, Incident Response oder externe Forensik.

## Betrieb, Integration und Grenzen

Cloud-Varianten reduzieren den Serverbetrieb, aber nicht die Arbeit an Sensor-Lebenszyklus, Richtlinien, Netzwerkzugriff, Rollen und Alert-Queues. Für On-Premises- oder Offline-Anforderungen ist Carbon Black EDR eine andere Betriebsentscheidung: Speicherung, Skalierung, Backup, Patchen und Hochverfügbarkeit liegen stärker beim Betreiber. API-Schlüssel gehören in einen Secret Manager, mit minimalen Access Levels und Rotation. Bei API-Abfragen gelten Rate Limits; Exporte und Data-Forwarder-Ziele brauchen eigene Speicher-, Kosten- und Löschregeln.

Ein Bypass ist kein harmloser Kompatibilitätsknopf: Broadcom weist darauf hin, dass er Sichtbarkeit und Enforcement verringern kann. Ausnahmen sollten deshalb möglichst eng auf Pfad, Prozess und Operation begrenzt, getestet und regelmäßig entfernt werden. Offline-Geräte behalten lokale Schutzmechanismen und Richtlinien, erhalten aber keine neuen Cloud-Reputationsabfragen, solange sie nicht verbunden sind.

## Evaluation und Qualitätskontrolle

Bewerte nicht nur die Zahl blockierter Angriffe. Miss Abdeckung der verwalteten Geräte, Sensor-Gesundheit, Alert-Qualität, Triage-Zeit, False Positives, Regeländerungen, CPU-Auswirkung und Zeit bis zur Isolierung. Lass SOC-Analysten echte Untersuchungsfälle mit Prozessbaum und Telemetrie bearbeiten. Prüfe, ob API-Exporte im SIEM ankommen und ob ein Restore der Beweisdaten sowie ein Ausfall der Cloud-Konsole im Notfallprozess berücksichtigt sind. Eine Demo ist kein Beleg für eine funktionierende Response-Kette.

## Sicherheit, Datenschutz und Governance

Endpoint-Telemetrie kann Kommandozeilen, Dateipfade, Netzwerkverbindungen, Prozesse und Registry-Aktivitäten enthalten. Vor dem Rollout müssen Region, Auftragsverarbeitung, Aufbewahrung, Zugriff, Export und Löschung mit Datenschutz und Betriebsrat geklärt werden. Broadcom dokumentiert eine Option zur Obfuskation von Command Lines auf dem Gerät; sie schützt jedoch nicht automatisch jede bereits in der Konsole gespeicherte Information. Rollen, getrennte Admin-Konten, Audit-Logs, Sensor-Schutz und ein kontrolliertes Verfahren für Ausnahme-Policies gehören zur Governance. Zertifizierungs- oder Compliance-Mapping sollte für das konkrete Modul und den Vertrag nachgewiesen werden, nicht aus der Produktbezeichnung abgeleitet werden.

## Kosten und Auswahlkriterien

Carbon Black wird über Partner und individuelle Angebote verkauft; eine belastbare öffentliche Standardpreisliste ist für die hier betrachteten Module nicht ersichtlich. Die Rechnung hängt typischerweise von Endpoints oder Workloads, Cloud- beziehungsweise On-Premises-Variante, Endpoint- und EDR-Modulen, Datenaufbewahrung, Support, Managed Services und Vertragslaufzeit ab. Hinzu kommen SIEM-Speicher, Netzwerkverkehr, Sensor-Rollout, Policy-Pflege, On-Call und Schulung. Fordere ein Angebot je Modul an und rechne ein Jahr Betrieb mit realistischen Geräteklassen und Retention durch.

## Redaktionelle Einschätzung

Carbon Black empfehlen wir einem bestehenden Security-Team mit klarer Endpoint-Verantwortung, das verhaltensbasierte Prävention, Untersuchung und kontrollierte Response in einem Portfolio bündeln will. Der Wert entsteht, wenn Sensorabdeckung, Policy-Ownership und ein erreichbarer Incident-Response-Prozess vorhanden sind. Für kleine Teams ohne SOC, hauptsächlich Microsoft-zentrierte Umgebungen oder einen eng begrenzten Bedarf wie Application Allowlisting ist eine passendere, einfacher betreibbare Alternative oft vernünftiger. Entscheidend sind ein Pilot mit echten Endpoints, messbare Triage-Ziele und ein geprüftes Daten- und Kostenmodell.

## Alternativen

- [CrowdStrike Falcon](/tools/crowdstrike-falcon/): Cloud-zentrierte EDR-Plattform für Teams, die Falcon-Module und deren Detection- und Response-Workflow vergleichen wollen.
- [Microsoft Defender for Endpoint](/tools/microsoft-defender-for-endpoint/): Naheliegend für Organisationen mit Microsoft 365, Entra und Windows-Management, wenn Plattformintegration wichtiger ist als ein herstellerunabhängiger Stack.
- [SentinelOne](/tools/sentinelone/): Vergleichsoption für automatisierte Endpoint-Reaktion mit eigenem Agent- und Policy-Modell.
- [Sophos Intercept X](/tools/sophos-intercept-x/): Passt eher, wenn Endpoint-Schutz mit Sophos Central und einem stärker konsolidierten Administrationsweg gesucht wird.

## FAQ

**Ist Carbon Black ein einzelnes Produkt?**

Nein. Carbon Black umfasst unter Broadcom mehrere Produkte und Module, darunter Cloud Endpoint Standard, Enterprise EDR, Carbon Black EDR und App Control. Angebot, Sensor und Betriebsmodell müssen deshalb konkret benannt werden.

**Braucht Carbon Black eine Internetverbindung?**

Cloud-Sensoren benötigen die Verbindung für neue Cloud-Reputationen, Analysen und die zentrale Konsole. Offline-Geräte behalten lokale Richtlinien und bestimmte lokale Schutzfunktionen, erhalten aber keine neuen Cloud-Erkenntnisse, solange sie nicht erreichbar sind.

**Wie verhindert man, dass eine Policy eine ganze Flotte stört?**

Regeln zuerst in einer Test-Policy mit wenigen Geräten prüfen. Danach Wirkung und Ausnahmen dokumentieren, schrittweise ausrollen und jede weit gefasste Bypass-Regel vermeiden, weil sie Sichtbarkeit und Schutz reduzieren kann.

**Welche Daten sollten vor dem Rollout geprüft werden?**

Prüfe Prozess- und Command-Line-Daten, Dateipfade, Netzwerkereignisse, Aufbewahrung, Region, Rollen, Exporte und SIEM-Ziele. Datenschutz, Betriebsrat und Incident-Response-Verantwortliche sollten die Zweckbindung und Zugriffskette freigeben.

**Wie sollte man die Kosten vergleichen?**

Vergleiche nicht nur den Preis pro Endpoint. Fordere Modul- und Retention-Preise an und addiere Sensorbetrieb, Policy-Pflege, SOC-Zeit, SIEM-Speicher, Support, Schulung und mögliche On-Premises-Infrastruktur.
