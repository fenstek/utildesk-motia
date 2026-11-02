---
slug: "ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly"
title: "KI-Video 2026 nach Sora: Gemini Omni, Kling 4.0, Seedance und Firefly"
date: 2026-06-21
updated: "2026-11-02"
category: "Einordnung"
eyebrow: "KI-Video"
excerpt: "Sora ist abgeschaltet. Gemini Omni, Kling 4.0 und Seedance 2.5 bringen neue Möglichkeiten, doch erste Tests zeigen auch Fehler. Wir erklären, worauf es bei KI-Videos jetzt ankommt."
readTime: 8
coverImage: /images/ratgeber/ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly-silent-cinema-cover-v3.webp
coverVideo: /videos/ratgeber/ki-video-silent-cinema-motion-b52a42d4388d.mp4
secondaryImage: /images/ratgeber/ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly-silent-cinema-platform-v1.webp
tags:
  - "AI Video"
  - "Content Production"
  - "Marketing"
  - "Security"
sidebarTitle: "Kurz gesagt"
sidebarPoints:
  - "Die Sora-App und Website endeten im April; die Entwickler-Schnittstelle folgte im September 2026."
  - "Erste Tests zeigen Stärken und Fehler. Einen klaren Alleskönner gibt es bisher nicht."
  - "Teste deine eigene Szene und prüfe Kosten und Datenweg, bevor du ein Modell fest einplanst."
relatedTools:
  - title: "Gemini"
    href: "/tools/gemini/"
  - title: "Runway"
    href: "/tools/runway/"
  - title: "Adobe Firefly"
    href: "/tools/adobe-firefly/"
  - title: "PixVerse"
    href: "/tools/pixverse/"
  - title: "Kling AI"
    href: "/tools/kling-ai/"
decisionTools:
  - title: "Runway"
    href: "/tools/runway/"
    note: "für Teams, die Shot-Kontrolle, konsistente Figuren und eine echte Bearbeitungsstufe brauchen"
    score: "8.8"
    kind: "recommend"
  - title: "Adobe Firefly"
    href: "/tools/adobe-firefly/"
    note: "für Markenarbeit, wenn Creative-Cloud-Anschluss und nachvollziehbare Freigaben zählen"
    score: "8.6"
    kind: "recommend"
  - title: "Gemini"
    href: "/tools/gemini/"
    note: "für frühe Richtungen, Referenzen und schnelle multimodale Varianten"
    score: "8.3"
    kind: "recommend"
decisionAvoid:
  - "einen ungeprüften Rohclip direkt in Kundenarbeit übernehmen"
  - "Varianten ohne Versionsnummer, Quellen- und Rechtehinweis als finale Datei freigeben"
decisionNote: "Ein starker Demo-Clip reicht nicht. Nimm das Werkzeug, bei dem du Fehler korrigieren und Freigaben nachvollziehen kannst."
editorial_reviewed: true
editorial_reviewed_at: 2026-11-02
final_human_approval_at: 2026-11-02
editorial_review_scope: "Quellen, Tatsachenbehauptungen, Einordnung und vollständige Endfassung"
ai_assistance: true
ai_disclosure_mode: editorial-passport
---

Stell dir ein kleines Kampagnenteam vor. Am Morgen stehen zwei Produktfotos und ein grobes Skript fest; am Nachmittag soll ein fertiger Clip in mehreren Formaten vorliegen. Der erste Entwurf ist schnell da. Schwieriger wird es, dieselbe Figur durch mehrere Szenen zu führen, eine misslungene Einstellung gezielt zu ändern und anschließend nachvollziehbar zu zeigen, wer welche Fassung freigegeben hat.

Auch die Marktfrage hat sich verändert. [Sora](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) ist inzwischen nicht mehr verfügbar, aber KI-Video ist nicht stehen geblieben. Neue Modelle von Google, Kuaishou und ByteDance konkurrieren um längere Szenen und bessere Referenzsteuerung. Gleichzeitig bündeln [Runway](/tools/runway/) und [Adobe Firefly](/tools/adobe-firefly/) mehrere Modelle mit Bearbeitungs- und Produktionsschritten. Für Teams zählt deshalb nicht nur der schönste Einzelclip, sondern die gesamte Strecke bis zur freigegebenen Datei.

## Sora ist weg – die Entwicklung läuft weiter

Stand 2. November 2026 sind beide Abschaltungen bereits erfolgt: OpenAI stellte die Web- und App-Version von Sora am 26. April 2026 ein und die Sora-API am 24. September 2026. Sora ist damit kein laufender Dienst, den ein Team für neue Projekte einplanen sollte. Die Abschaltung sagt für sich genommen allerdings nichts darüber aus, warum OpenAI den Dienst beendet hat oder wie gut andere Modelle sind. [OpenAI bestätigt beide Daten in seinem Hilfecenter](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation).

Was bleibt, ist eine praktische Lehre aus der Zeit von Sora: Ein überzeugender Demo-Clip ist noch kein verlässlicher Produktionsprozess. Dafür braucht ein Team Quellen für Bild und Ton, klare Versionsstände, Rechteprüfung und eine Person, die den finalen Export freigibt.

## Erst den Bedarf wählen, dann das Modell

Einige Angebote sind einzelne Modelle, die direkt aus Text, Bildern oder Referenzvideos Clips erzeugen. Andere sind Arbeitsumgebungen: Sie lassen ein Team zwischen Modellen wechseln, Änderungen vornehmen, Varianten sammeln und einen finalen Schnitt vorbereiten. Diese Ebenen werden oft unter dem Begriff „KI-Video-Tool“ vermischt. Für die Auswahl sollte man sie auseinanderhalten.

### Google: [Gemini](/tools/gemini/) Omni 1.1 und [Flow](https://labs.google/flow/about) geben mehr Kontrolle über Übergänge

Google hat Gemini Omni 1.1 Flash am 27. August 2026 vorgestellt. Die API kann Szenen in Zehn-Sekunden-Schritten bis zu einer kumulierten Gesamtlänge von 40 Sekunden erweitern. Außerdem lassen sich Start- und Endbild festlegen; 360p-Entwürfe sollen schnellere Iterationen ermöglichen. In Flow nennt Google Start- und Endbilder sowie Exporte in 1080p und 4K. Die Gemini-App, Flow und die API haben jedoch nicht automatisch dieselben Funktionen und Bedingungen. [Google beschreibt die API-Funktionen](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-omni-1-1-flash/) und [die Neuerungen in Flow](https://blog.google/innovation-and-ai/models-and-research/google-labs/new-creative-controls-google-flow/).

Das ist nützlich, wenn eine Szene fortgesetzt oder der Übergang zwischen zwei festgelegten Bildern kontrolliert werden soll. Für einen kurzen Website-Clip kann aber ein schneller Entwurf genügen; 4K ist kein Qualitätsgewinn, wenn Bewegung, Motiv oder Aussage noch nicht stimmen.

### [Kling AI](/tools/kling-ai/) 4.0: längere Einstellungen und Referenzsteuerung

Kling 4.0 ist bereits am 15. Oktober 2026 gestartet; Kuaishou bestätigte den offiziellen Start in seiner Mitteilung. Laut Hersteller kann das Modell bis zu 30 Sekunden in einem Durchlauf erzeugen und bis zu 15 Referenz-Assets sowie zehn Keyframes einbeziehen. Kuaishou positioniert die Neuerung vor allem für dynamische Bewegung, komplexe Kamerafahrten und längere Erzählungen. Das sind Herstellerangaben, keine unabhängige Rangliste. [Kuaishous Ankündigung](https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-officially-launches-next-generation-kling-40-raising) beschreibt die angekündigten Fähigkeiten.

Der praktische Test ist, ob die Referenzen tatsächlich konsistent bleiben und ob sich eine einzelne Einstellung ändern lässt, ohne den Rest der Szene neu aufzubauen. In Adobe Fireflys aktueller Modellübersicht ist außerdem Kling 4.0 Omni für Bild-zu-Video- und Video-zu-Video-Abläufe aufgeführt. Welche Variante in welchem Konto verfügbar ist, hängt von Produkt und Region ab.

### [Seedance 2.5](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5): viele Referenzen und gezielte Änderungen

ByteDance stellte Seedance 2.5 am 31. Juli 2026 vor. Der Hersteller nennt Clips bis 30 Sekunden, bis zu 30 Bild-, zehn Video- und zehn Audio-Referenzen sowie zeitcodierte Bearbeitungen. Diese Angaben versprechen mehr Kontrolle über längere Szenen; sie ersetzen aber keine Prüfung, ob das Ergebnis im eigenen Stil und mit dem eigenen Material zuverlässig funktioniert. [Die Seed-Team-Ankündigung](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5) beschreibt Umfang und Grenzen des Modells.

Der Zugang hängt von der Plattform ab: ByteDance nannte zum Start unter anderem Jimeng AI und Doubao Pro; Runway dokumentiert Seedance 2.5 außerdem in seinem MCP-Angebot. Verfügbarkeit, Tarif, Datenweg und Nutzungsbedingungen sind also nicht allein durch den Modellnamen bestimmt.

## Was die ersten Tests zeigen

Die ersten Tests küren keinen Gesamtsieger. Sie zeigen aber, woran man im eigenen Projekt denken sollte: Was klappt schon gut, und wo macht die KI noch überraschende Fehler?

- **Gemini Omni 1.1 Flash:** In einem Test von Fulgor vom 9. Oktober sprach das Modell einen polnischen Satz sehr überzeugend (9 von 10 Punkten). Die Clips mit Kaffee und Straßenbahn hatten dagegen sichtbare Fehler. In der Straßenbahnszene stand sogar ein Stativ auf den Gleisen: Das Modell hatte einen Hinweis zur Kameraführung als Gegenstand im Bild verstanden. [Fulgors Test](https://elfulgor.es/gemini-omni-flash/).
- **Seedance 2.5:** 27 Personen aus kreativen und technischen Berufen probierten das Modell eine Woche lang aus. Im Vergleich zur Vorgängerversion fielen ihnen vor allem bessere Kamerabewegungen und lebendigere Actionszenen auf. In längeren Clips kann sich das Aussehen einer Figur aber verändern, und genaue Anweisungen gehen manchmal verloren. Muss man den Clip oft neu erstellen, steigen Zeitaufwand und Kosten. [Der Test von 36Kr vom 12. August](https://eu.36kr.com/en/p/3936379078409606).
- **Kling 4.0:** Fuser ließ die Versionen 4.0 und 3.0 dieselben vier Szenen erstellen, jeweils nur mit einem Versuch. In drei Fällen setzte die neuere Version die Handlung besser um – etwa beim Rudern und bei einem Judo-Wurf. Beim Aufblühen einer Blume waren die Ergebnisse fast gleich. Das ist ein erster Hinweis, aber vier Szenen reichen nicht für ein endgültiges Urteil. [Fusers Vergleich vom 23. Oktober](https://fuser.studio/articles/kling-4-vs-kling-3).

Bislang gibt es keinen Alleskönner. Für den eigenen Clip lohnt es sich, drei Dinge zu prüfen: Klingt die Sprache natürlich? Sieht die Figur in längeren Szenen noch gleich aus? Und zeigt die KI die gewünschte Bewegung?

## Runway und Firefly werden zu Produktionsumgebungen

Runway bleibt mit Gen-4.5 ein eigener Modellanbieter, baut aber zugleich ein Arbeitsumfeld mit Agent, Schnitt und Partner-Modellen aus. Am 29. September 2026 kündigte Runway Runway Creative im OpenAI Marketplace für berechtigte Unternehmenskunden an. Laut Runway gehören dort unter anderem Gen-4.5, Seedance 2.5, [ChatGPT](/tools/chatgpt/) Image 2.5 und [ElevenLabs](/tools/elevenlabs/) V4 zusammen; ein Agent kann Briefing, Generierung und Montage unterstützen. Das ist ein Zugang für bestimmte Unternehmenskunden, keine Aussage, dass jeder Runway-Nutzer dieselbe Auswahl erhält. [Runways Mitteilung zum Marketplace](https://runway.com/news/company-news/runway-openai-marketplace) und [der aktuelle Produkt-Changelog](https://runway.com/changelog) zeigen, wie schnell sich die integrierten Modelle ändern.

Adobe Firefly verfolgt eine ähnliche Plattformlogik. Adobes am 23. Oktober 2026 aktualisierte Übersicht führt je nach Funktion unter anderem Kling 4.0 Omni, Kling 3.0, Seedance 2.0, [Veo 3.1](https://deepmind.google/models/veo/), Runway Gen-4.5 und Gemini Omni Flash in Firefly Boards auf. Der Firefly AI Assistant und die Timeline sind laut Adobe-Hilfeseiten Beta-Funktionen; die Partnermodelle können regional unterschiedlich verfügbar sein. [Adobes Modellübersicht](https://helpx.adobe.com/creative-cloud/apps/generative-ai/non-adobe-models-in-adobe-products.html), [FAQ zum AI Assistant](https://helpx.adobe.com/firefly/web/firefly-ai-assistant/ai-assistant-faq.html) und [Anleitung zur Timeline](https://helpx.adobe.com/firefly/web/firefly-video-editor/generate-videos/generate-video-using-firefly-models.html) geben den aktuellen Stand wieder.

Auch der Datenweg gehört zur Entscheidung. Adobe weist darauf hin, dass bei ausgewählten chinesisch entwickelten Partnermodellen Prompts und Referenzdateien an die jeweiligen Modellanbieter übertragen werden. Wer internes Material, Kundendaten oder noch nicht veröffentlichte Produkte hochlädt, sollte vorab prüfen, welches Modell die Anfrage verarbeitet und welche Bedingungen dafür gelten.

## So vergleicht ein Team die Angebote

Ein kurzer, fairer Vergleich braucht dieselbe Aufgabe und dieselben Eingaben:

1. **Kontinuität:** Kann dieselbe Figur oder dasselbe Produkt in zwei Einstellungen erkennbar bleiben?
2. **Korrektur:** Lässt sich ein Detail ändern, ohne die ganze Szene neu zu generieren?
3. **Übergang:** Kann das Team Anfang und Ende einer Bewegung gezielt festlegen?
4. **Aufwand:** Wie viele Versuche braucht es bis zu einem verwendbaren Clip – einschließlich Schnitt, Export und Freigabe?
5. **Betrieb:** Welche Credits, Laufzeiten, Exportformate, Länderbedingungen und Datenwege gelten im konkreten Konto?

Für jeden Versuch sollten Teammitglieder Modell und Version, Eingaben, Referenzen, Datum, Bearbeitung und Freigabestatus festhalten. Dann lässt sich später noch erklären, aus welchen Materialien ein finaler Clip entstanden ist und wie man eine frühere Fassung wiederherstellt.

<figure class="article-inline-image article-inline-video">
  <video autoplay muted loop playsinline loading="lazy" preload="none" poster="/images/ratgeber/ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly-silent-cinema-platform-v1.webp" width="1280" height="720" aria-label="Animierte Illustration einer Stummfilmproduktion zwischen Idee, Schnitt und Freigabe">
    <source src="/videos/ratgeber/ki-video-silent-cinema-platform-motion-702117291277.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
    <img src="/images/ratgeber/ki-video-2026-nach-sora-gemini-omni-flow-runway-und-adobe-firefly-silent-cinema-platform-v1.webp" alt="Zwei Stummfilm-Filmemacher halten eine laufende Filmproduktion zwischen Idee, Schnitt und Freigabe in Bewegung – eine eigenständige Schwarzweiß-Illustration im Stil des frühen Kinos." loading="lazy" decoding="async" width="1280" height="720" />
  </video>
</figure>
## Die Entscheidung hängt an der ganzen Kette

- **Gemini Omni und Flow** passen, wenn Referenzbilder, Szenenverlängerung und Start-/Endbildsteuerung im vorhandenen Google-Arbeitsablauf wichtig sind.
- **Kling 4.0** ist einen Vergleich wert, wenn längere Einstellungen, Keyframes und mehrere Referenzen gebraucht werden.
- **Seedance 2.5** gehört in den Test, wenn viele Bild-, Video- und Audio-Referenzen oder zeitcodierte Änderungen zum Briefing gehören.
- **Runway** kann passen, wenn Generierung, Bearbeitung, Agent und mehrere Modelle in einem Arbeitsbereich zusammenkommen sollen.
- **Adobe Firefly** ist interessant, wenn Varianten, Partnermodelle und Bearbeitung in den Creative-Cloud-Ablauf passen – nach Prüfung der Beta-, Konto-, Regions- und Datenbedingungen.

Sora ist aus dem Markt verschwunden. Einen einzelnen Ersatz gibt es nicht: Die Anbieter entwickeln Modelle weiter, während Plattformen mehrere davon in Produktionsketten einbauen. Verglichen werden sollte deshalb nicht nur der beste erste Frame, sondern der Clip, den das Team sauber korrigieren, erklären und freigeben kann.

## Quellen

1. OpenAI: [What to know about the Sora discontinuation](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)
2. Google: [Build with Gemini Omni 1.1 Flash](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-omni-1-1-flash/)
3. Google: [New creative controls in Flow](https://blog.google/innovation-and-ai/models-and-research/google-labs/new-creative-controls-google-flow/)
4. Kuaishou: [Kling 4.0 launch](https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-officially-launches-next-generation-kling-40-raising)
5. ByteDance Seed: [Introducing Seedance 2.5](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)
6. Runway: [Runway Creative in the OpenAI Marketplace](https://runway.com/news/company-news/runway-openai-marketplace)
7. Runway: [Product updates and changelog](https://runway.com/changelog)
8. Adobe: [Partner models in Adobe products](https://helpx.adobe.com/creative-cloud/apps/generative-ai/non-adobe-models-in-adobe-products.html)
9. Adobe: [Firefly AI Assistant FAQ](https://helpx.adobe.com/firefly/web/firefly-ai-assistant/ai-assistant-faq.html)
10. Adobe: [Generate video with Firefly models and add it to the timeline](https://helpx.adobe.com/firefly/web/firefly-video-editor/generate-videos/generate-video-using-firefly-models.html)
11. Fulgor: [Gemini Omni Flash hands-on tests](https://elfulgor.es/gemini-omni-flash/)
12. 36Kr AI Evaluation: [Seedance 2.5 seven-dimensional hands-on test](https://eu.36kr.com/en/p/3936379078409606)
13. Fuser: [Kling 4.0 vs. 3.0 on identical inputs](https://fuser.studio/articles/kling-4-vs-kling-3)
