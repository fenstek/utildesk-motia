---
slug: brevo
title: Brevo
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Marketing & Vertrieb"
price_model: Freemium
tags: [email, marketing, crm, automation]
official_url: "https://www.brevo.com/"
popularity: 0
tier: D
generated_at: 2026-05-17
description: "Brevo verbindet Kampagnen, Kontaktverwaltung, Automationen und transaktionale Nachrichten für Teams, die Kundenkommunikation messbar betreiben wollen."
updated_at: 2026-07-14
---
# Brevo

Brevo ist eine Plattform für E-Mail-Kampagnen, Kontaktverwaltung, Marketing-Automation und transaktionale Nachrichten. Sie passt zu kleinen und mittleren Teams, die Newsletter, Formulare, Ereignisse und Follow-ups in einem Arbeitsbereich verbinden wollen. Die wichtige Grenze: Brevo nimmt dem Team weder Einwilligungsmanagement noch Datenmodell, Zustellbarkeitsarbeit oder die Prüfung kritischer Nachrichten ab.

<figure class="tool-editorial-figure">
  <img src="/images/tools/brevo-editorial.webp" alt="Leuchtende Postwerkstatt mit segmentierten Routen für Umschläge" loading="lazy" decoding="async" />
</figure>

## Für wen ist Brevo geeignet?

Brevo ist interessant für Marketingverantwortliche, Agenturen, Shops und Dienstleistungsunternehmen, die regelmäßige Kampagnen mit einem einfachen CRM-nahen Kontaktbestand verbinden möchten. Ein Newsletter-Team kann Listen und Segmente pflegen, ein Vertriebsteam Kontakte und Deals nachhalten, und ein Produktteam kann Bestell- oder Kontoereignisse an eine transaktionale E-Mail übergeben. Das ist kein Ersatz für ein spezialisiertes Data Warehouse oder ein sehr tiefes Enterprise-CRM.

## Welche Bausteine gehören zum Arbeitsablauf?

Der praktische Kern besteht aus Kampagnen, Kontakten, Segmenten, Automationen und transaktionalem Versand. Kampagnen richten sich an ausdrücklich berechtigte Empfänger. Automationen reagieren etwa auf Formularübermittlung, Klicks, Attribute oder eigene Ereignisse und können Kontakte aktualisieren, Listen verändern oder Nachrichten senden. API, SMTP und Webhooks verbinden die Versandstrecke mit Website, Shop oder Backend. SMS, WhatsApp, Push, Chat und Sales-Funktionen sind zusätzliche Kanäle bzw. Produkte; ihre Verfügbarkeit hängt vom gebuchten Bereich und Tarif ab.

## Ein realistischer Start in vier Schritten

Zuerst definiert das Team einen kleinen Ablauf, zum Beispiel eine bestätigte Anmeldung mit einer Willkommensnachricht. Danach werden Kontaktattribute, Listen, Einwilligungsnachweis, Absenderdomain und Zuständigkeit festgelegt. Im nächsten Schritt baut das Team die Nachricht, testet Darstellung und Links und lässt sie von einer zweiten Person prüfen. Erst dann wird der Workflow aktiviert. Für eine Website oder einen Shop kommen ein dokumentiertes Ereignisschema, API- oder SMTP-Zugang und eine Testumgebung hinzu. Ein manueller Fallback bleibt nötig, falls ein Ereignis fehlt, eine Nachricht blockiert wird oder ein Kontakt versehentlich im falschen Segment landet.

## Betrieb, Integration und Übergaben

Die Entwicklerseite sollte API-Schlüssel getrennt nach Umgebung verwalten, Versandereignisse über Webhooks an ein kontrolliertes Endpoint melden und Fehler mit einer eigenen Korrelation-ID protokollieren. Brevo dokumentiert SDKs und APIs für gängige Sprachen sowie Webhooks für Zustellung, Öffnungen, Klicks, Bounces, Abmeldungen und Kontaktänderungen. Ein Webhook ist aber kein vollständiges Monitoring: Das Team braucht Wiederholungslogik, Signatur- oder Authentifizierungsprüfung, Rate-Limit-Beobachtung und eine Entscheidung darüber, welche Ereignisse wirklich gespeichert werden. Kampagnen, Vorlagen und Segmente sollten versioniert oder zumindest mit Owner, Zweck und Ablaufdatum dokumentiert werden.

## Qualität und Messung

Vor dem Versand prüft das Team Empfänger, Einwilligung, Absender, Reply-to-Adresse, Personalisierungsfelder, Links, Abmeldemöglichkeit und mobile Darstellung. Danach werden Zustellung, Bounces, Beschwerden, Abmeldungen, Klicks und die für den Prozess relevante Conversion betrachtet. Öffnungen sind wegen Datenschutz- und Messgrenzen kein alleiniger Erfolgsmaßstab. Ein sinnvoller Pilot beantwortet drei Fragen: Wird eine definierte Handlung häufiger oder schneller ausgelöst? Sinkt manueller Pflegeaufwand? Bleibt die Fehler- und Abmelderate akzeptabel? Erst wenn diese Baseline dokumentiert ist, lohnt sich eine komplexere Journey.

## Datenschutz, Sicherheit und Governance

Brevo verarbeitet Kundendaten je nach Vorgang als Auftragsverarbeiter oder Verantwortlicher; die konkrete Rolle, Rechtsgrundlage und Aufbewahrung muss die Organisation für ihren Fall prüfen. Für Marketingversand braucht sie eine belastbare Einwilligungs- und Abmeldelogik. Tracking, Formulare, externe Integrationen und optionale Drittanbieterfunktionen können weitere Prüfungen auslösen. Rechte sollten nach Aufgabe vergeben, API-Schlüssel nicht in Frontend-Code gelegt und Export, Löschung, Aufbewahrung sowie Zugriff auf Logs geregelt werden. Brevos Privacy Policy und Data Processing Agreement gehören in die Lieferantenprüfung; ein Logo oder ein GDPR-Hinweis ersetzt keine eigene Datenschutzdokumentation.

## Preis und laufende Kosten

Brevo bietet einen kostenlosen Einstieg und bezahlte Pläne. Die Kostenstruktur richtet sich unter anderem nach E-Mail-Volumen, Funktionsstufe, zusätzlichen Kanälen, Nutzerplätzen und optionalen Sales- oder Enterprise-Bausteinen. SMS und andere Credits können separat anfallen; Pay-as-you-go ist für unregelmäßigen Versand eine andere Kalkulation als ein Monatsplan. In die Entscheidung gehören außerdem Domain- und Deliverability-Setup, Templatepflege, Segmentbereinigung, Integrationsbetrieb, Support und ein möglicher Datenexport. Tarife und enthaltene Features ändern sich, deshalb sollte vor Vertragsabschluss die offizielle Pricing-Seite für Region und Abrechnungsintervall geprüft werden.

## Redaktionelle Einschätzung

Brevo empfehlen wir Teams, die E-Mail-Kampagnen, einfache Kontaktprozesse und transaktionale Versandwege mit überschaubarem Integrationsaufwand zusammenführen wollen. Wert entsteht, wenn ein klarer Prozess, saubere Einwilligungen und ein Owner für Daten und Zustellbarkeit vorhanden sind. Wer nur gelegentlich einen Newsletter verschickt, fährt mit einer schlankeren Lösung oft ruhiger; wer komplexe CRM-Objekte, tiefes E-Commerce-Event-Monitoring oder strikte Enterprise-Governance braucht, sollte eine spezialisierte Alternative anhand eines echten Piloten vergleichen.

## Alternativen

- [Klaviyo](/tools/klaviyo/): Stärker auf E-Commerce-Daten, Ereignisse und umsatzorientierte Segmentierung ausgerichtet.
- [ActiveCampaign](/tools/activecampaign/): Geeignet, wenn mehrstufiges Lead-Nurturing und CRM-nahe Automationen im Mittelpunkt stehen.
- [MailerLite](/tools/mailerlite/): Schlankere Wahl für Newsletter, Formulare und überschaubare Automationen ohne breites CRM.
- [HubSpot Marketing Hub](/tools/hubspot-marketing-hub/): Sinnvoll, wenn Marketing eng mit einem größeren HubSpot-CRM und Reporting verzahnt werden soll.
- [Mailchimp](/tools/mailchimp/): Alternative für Teams, die einen etablierten Kampagneneditor und bekannte Marketingprozesse priorisieren.

## FAQ

**Ist Brevo für einen ersten Newsletter-Pilot geeignet?**

Ja, wenn die Kontaktquelle, Einwilligung, Absenderdomain und ein kleiner Testempfängerkreis vor dem Versand geklärt sind. Der kostenlose Einstieg ist kein Ersatz für diese Vorarbeiten.

**Was ist der Unterschied zwischen Kampagne, Automation und transaktionaler E-Mail?**

Eine Kampagne wird an eine ausgewählte Zielgruppe geplant. Eine Automation reagiert auf definierte Kontakt- oder Ereignisbedingungen. Eine transaktionale Nachricht wird typischerweise durch eine konkrete Aktion wie Bestellung oder Passwortanforderung ausgelöst und kann über API oder SMTP versendet werden.

**Braucht eine Website eine eigene Integration?**

Für einfache Formulare kann eine konfigurierte Brevo-Funktion genügen. Für Bestellungen, Kontostatus oder eigene Ereignisse sind API, SMTP oder Webhooks und ein dokumentiertes Ereignismodell die verlässlichere Grundlage.

**Wie verhindert man versehentliche oder unzulässige Sendungen?**

Mit getrennten Listen und Einwilligungsfeldern, Rollen, Testsendungen, einem Vier-Augen-Check sowie Regeln für Abmeldungen und Bounces. Zusätzlich sollte das Team einen Stop-Schalter und einen manuellen Eskalationsweg definieren.

**Was sollte vor dem Wechsel zu Brevo geprüft werden?**

Exportierbarkeit von Kontakten und Events, Absender- und Domainanforderungen, Zustellbarkeit, API- und Webhook-Aufwand, Aufbewahrung sowie die Kosten für laufende Pflege. Ein kleiner Parallel- oder Pilotprozess liefert belastbarere Antworten als ein Featurevergleich.
