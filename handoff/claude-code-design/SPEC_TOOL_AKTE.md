# Handoff Spec — Tool-Akte (`/tools/[slug]/`)

Quelle: `utildesk1 (4).zip` → `Utildesk - Entscheidungsblatt.html` (Komponente `DSToolAkte`, Demo-Daten unter `TOOL_AKTE_DATA`). Print-Variante: `… · Standalone-print.html`.

Diese Spec deckt **eine Route**: das Tool-Dossier. Header/Footer der Live-Site bleiben unverändert (siehe `VISUAL_TARGETS.md`). Der Pill-Tabbar in `01-akte-fig.png` ist ein Demo-Router und wird **nicht** implementiert.

---

## 1. Overview

Eine Tool-Akte ist eine redaktionelle Akte zu **einem** KI-Werkzeug — kein klassischer Tool-Detail-Screen. Aufbau in fester Reihenfolge:

1. Breadcrumb
2. Masthead (H1 + Faktenblatt-Sidebar)
3. Verdikt der Redaktion (Stamp-Block)
4. TL;DR-Streifen
5. § 01 … § 04 — Editorial-Paragraphen (Typen: `body` / `fit` / `cases` / `features`)
6. § 05 — Vorteile & Nachteile (Bilanz)
7. § 06 — Datenschutz & Daten-Hygiene
8. Schlussbild (Editorial-Illustration, 4:3)
9. § 07 — Schlussbemerkung (Blockquote)
10. § 08 — Häufige Fragen (FAQ)
11. Verwandte Akten (3 Alternativen, Karten-Raster)
12. Colophon-Streifen

---

## 2. Layout

| Property | Value |
|---|---|
| Frame width (Desktop) | `1440px` (`max-width: 100%`) |
| Side padding | `56px` links / rechts (`dsS.inner.padding = '0 56px'`) |
| Page background | `--paper` (`#f6f4ee`) |
| Section grid | `grid-template-columns: 120px 1fr; gap: 32px` (Marginalie + Body) |
| Section divider | `border-top: 1px solid var(--rule); margin-top: 32px; padding-top: 36px` |
| Masthead grid | `grid-template-columns: 1.55fr 1fr; gap: 56px` |
| Verdict grid | `grid-template-columns: 92px 1fr 240px; gap: 28px` |
| TL;DR grid | `grid-template-columns: 170px 1fr; gap: 32px` |
| Alternatives grid | `grid-template-columns: repeat(3, 1fr); gap: 1px` (Hairline auf `--rule`) |

Section-Container-Pattern (für jeden §-Abschnitt):

```css
padding: 40px 56px 0;
display: grid;
grid-template-columns: 120px 1fr;
gap: 32px;
border-top: 1px solid var(--rule);
margin-top: 32px;
padding-top: 36px;
```

---

## 3. Design Tokens

### 3.1 Farben (`dsPalette`)

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#f6f4ee` | Seitenhintergrund, Card-default |
| `--paper-alt` | `#eceae2` | Zebra-Reihen in Tabellen, Cons-Spalte |
| `--parchment` | `#e8e3d2` | Faktenblatt-, Verdict-, Closing-Hintergrund |
| `--ink` | `#0c0c0a` | Fließtext, Headlines, Borders der Stamps |
| `--ink-soft` | `#3a3a35` | sekundärer Fließtext, italische Subheads |
| `--ink-mid` | `#6a6a62` | Meta-Labels, Mono-Caps |
| `--ink-dim` | `#9a988e` | Colophon-Labels, sehr leise Annotation |
| `--rule` | `#d8d4c5` | 1px Trennlinien |
| `--rule-hi` | `#b6b1a0` | stärkere Hairline / Tag-Border |
| `--vermillion` | `#c5251c` | Verdikt **NICHT**, §-Nummern, Kicker, Mark-Punkt nach Wordmark |
| `--green` | `#0f6a3b` | Verdikt **EMPFEHLEN** |
| `--amber` | `#a86200` | Verdikt **BEDINGT**, Privacy `empfohlen` |
| `--purple` | `#7a3df0` | Verdikt **ÜBERBEWERTET** |
| `--ocean` | `#0042b8` | Links (Breadcrumb-„zurück", „Akte öffnen ↗") |
| Footer-Subtext | `#7e7c70` | kleiner Mono-Text auf Ink-Hintergrund |
| Footer-Body | `#c7c4b6` | Body-Serif auf Ink-Hintergrund |

Kein reines Schwarz / kein reines Weiß. Tinte ist `#0c0c0a`, Papier `#f6f4ee`.

### 3.2 Typografie

| Token | Family / Stack | Notes |
|---|---|---|
| `--font-serif` | `'Source Serif 4', 'Source Serif Pro', Georgia, serif` | Body, Headlines, Wordmark |
| `--font-display` | `'Bricolage Grotesque', system-ui, sans-serif` | UI-Display, Verdikt-Glyph (sehr groß) |
| `--font-sans` | `'Bricolage Grotesque', system-ui, sans-serif` | Nav, Labels |
| `--font-mono` | `'JetBrains Mono', monospace` | Kicker, Caps, Meta, Tags, Buttons |

Google-Fonts-Import:

```
https://fonts.googleapis.com/css2?
  family=Bricolage+Grotesque:opsz,wght@10..48,300;10..48,400;10..48,500;10..48,600;10..48,700
  &family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;0,8..60,900;1,8..60,400;1,8..60,700;1,8..60,900
  &family=JetBrains+Mono:wght@400;500;600;700
  &display=swap
```

### 3.3 Type Scale (px / line-height / letter-spacing)

| Rolle | Family | Größe | Weight | Style | Tracking | Notes |
|---|---|---|---|---|---|---|
| H1 Wordmark `Name.` | Serif | `128 / 0.95` | `900` | italic | `-0.04em` | Punkt am Ende in `--vermillion`, `font-style: normal` |
| H2 Section title | Serif | `46 / 1.05` | `700` | normal | `-0.024em` | |
| H3 FAQ-Frage | Serif | `22 / 1.3` | `700` | normal | `-0.01em` | |
| §-Nummer | Serif | `48 / 1.0` | `900` | italic | `-0.03em` | Farbe `--vermillion` |
| Oneliner / Subtitle | Serif | `24 / 1.35` | `400` | italic | — | Farbe `--ink-soft`, `max-width: 640` |
| Drop-cap (1. Absatz) | Serif | `78 / 0.85` | `700` | normal | — | `float: left; color: --vermillion; padding-right: 10; padding-top: 6` |
| Body (Paragraph) | Serif | `19 / 1.6` | `400` | normal | — | `max-width: 840` |
| Body (Fit / Cases / Features / FAQ-Antwort) | Serif | `17 / 1.55` | `400` | — | — | |
| TL;DR-Items | Serif | `18 / 1.55` | `400` | — | — | hellpapier auf Ink |
| Blockquote (Schluss) | Serif | `26 / 1.4` | `400` | italic | `-0.005em` | |
| Verdict-Headline | Serif | `34 / 1.1` | `700` | — | `-0.018em` | |
| Verdict-Glyph | Display | `88 / 0.9` | `700` | — | `-0.04em` | Farbe = Verdikt-Farbe |
| Kicker („↳ Tool-Akte …") | Mono | `11` | `600` | UPPER | `0.2em` | Farbe `--vermillion` |
| Mono-Label klein | Mono | `10` | `400-700` | UPPER | `0.16em` | Meta, Marginalie-Kicker |
| Mono-Body (Faktenblatt) | Mono | `12 / 1.9` | `400` | — | — | |
| Tag-Pill | Mono | `11` | `400` | — | — | `padding 5px 10px`, `border-radius 99` |
| Button | Mono | `13` | `600` | UPPER | `0.06em` | `padding 14px 22px` |
| Breadcrumb | Mono | `11` | `400` | — | `0.06em` | |
| TL;DR-Title `TL;DR.` | Serif | `42 / 1.0` | `700` | italic | `-0.02em` | weiß auf Ink |
| Inventar-Stat-Zahl | Serif | `38` | `900` | italic | `-0.02em` | |

### 3.4 Borders & Radii

| Token | Wert | Wo |
|---|---|---|
| Hairline | `1px solid var(--rule)` | Section-Divider, Tabellenzeilen |
| Strong rule | `2px solid var(--ink)` | FAQ-Top, Pros/Cons-Frame, Verdict-Frame |
| Double rule | `3px double var(--ink)` | Masthead-Bottom (Home), Alternatives-Top |
| Dotted rule | `1px dotted var(--rule-hi)` | Faktenblatt-Reihen |
| Dashed rule | `1px dashed var(--rule-hi)` | Colophon-Streifen |
| Pill-Radius | `99px` (`border-radius: 99`) | Tag-Chips, Live-Dot |
| Block-Radius | **keiner** | Stamps, Verdict, Faktenblatt, TL;DR, Buttons → scharfkantig |
| Monogram | `4px` | nur das Buchstaben-Tile |

### 3.5 Spacing-Skala (vorgefunden)

`4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 32 · 36 · 40 · 48 · 56` px. Innere Section-Container nutzen `padding: 40px 56px 0` und `padding-top: 36px` nach dem `border-top`.

---

## 4. Components

### 4.1 `AkteCrumb` — Breadcrumb

```
← Tool-Index  /  Chatbots & Assistenten  /  ChatGPT
```

- Mono `11px`, letter-spacing `0.06em`.
- „← Tool-Index" in `--ocean`.
- Trenner `/` in `--rule-hi`, Margin `0 10px`.
- Aktueller Knoten in `--ink`, `font-weight: 600`.
- Container: `padding: 18px 56px 0`.

### 4.2 `AkteMasthead` — H1 + Faktenblatt

Zwei-Spalten-Grid `1.55fr 1fr`, `gap: 56`, `padding: 28px 56px 36px`, `border-bottom: 1px solid var(--rule)`.

**Linke Spalte (Editorial):**
- **Kicker** `↳ Tool-Akte №&nbsp;0042 · Chatbots & Assistenten` — Mono `11px`, vermillion, `letter-spacing: 0.2em`, uppercase, weight 600. Das `№` ist `№` (U+2116), NBSP davor (`&nbsp;`).
- **H1** `Name.` — Serif italic 900, `128/0.95`, `-0.04em`, `margin: 18px 0 16px`. Der Punkt am Ende: `<span style="color: --vermillion; font-style: normal">.</span>`.
- **Oneliner** — Serif italic 24, line-height 1.35, `--ink-soft`, `max-width: 640px`.
- **Meta-Chips** (`margin-top: 24`, `gap: 8`, `flex-wrap`):
  - Kategorie: Mono 11, `padding 5px 10px`, `background: --ink`, color `--paper`, uppercase, `letter-spacing: 0.1em`.
  - Preis: identisch, aber `background: transparent`, `border: 1px solid --ink`, color `--ink`.
  - Tags `#xxx`: Mono 11, `border: 1px solid --rule-hi`, color `--ink-soft`, `border-radius: 99`, **kein** Hintergrund.
- **Buttons** (`margin-top: 28`, `gap: 12`):
  - Primary: `padding 14px 22px`, bg `--ink`, color `--paper`, Mono 13/600/`0.06em` uppercase. Label `↗ ZUM ANBIETER · <domain>`.
  - Secondary: `border: 1px solid --ink`, color `--ink`. Label `⇄ MIT 2 TOOLS VERGLEICHEN`.

**Rechte Spalte — Faktenblatt (`aside`):**
- `background: --parchment`, `border: 1px solid --ink`, `padding: 22px 24px 18px`, `align-self: start`, `position: relative`.
- **Tab-Label** `Faktenblatt` (`position: absolute; top: -12px; left: 18px; padding: 3px 10px; background: --paper; border: 1px solid --ink`), Mono 11/700, `letter-spacing: 0.18em`, uppercase. Sitzt **außerhalb** der Box, überlappt die obere Border.
- **Vendor-Zeile**: `Monogram` (48px schwarzes Quadrat, `border-radius: 4`, Serif italic 900, ca. 60 % der Größe als Schriftgröße, Buchstabe `#f6f4ee` auf `#0c0c0a`) + Vendor-Name (Serif 700, 20) + Domain (Mono 11, `--ink-mid`).
- **Meta-Tabelle**: `<div>` pro Eintrag, `display: flex; justify-content: space-between; gap: 10; border-bottom: 1px dotted --rule-hi; padding: 2px 0`. Key in `--ink-mid`, Wert in `--ink`. Sonderfall: Schlüssel `Bezahlte Platzierung` → Wert `--vermillion`, weight 600. Mono 12, line-height 1.9.
- Trennlinie: `height: 1; background: --rule-hi; margin: 16px 0`.
- **Status-Trio** (Mono 11, lh 1.8): `Zuletzt geprüft` / `Im Index seit` / `Verwendet in N Entscheidungen`.

Pflicht-Felder im Faktenblatt (siehe `TOOL_AKTE_DATA.meta`):
`Hersteller · Hosting · DPA verfügbar · Eigenes Modell · Open Source · Self-hostable · API verfügbar · Bezahlte Platzierung`.

### 4.3 `AkteVerdict` — Verdikt-Stamp

`padding: 36px 56px 16px` Container.

Innerer Block: `background: --parchment`, `border: 2px solid --ink`, `padding: 28px 34px`, `display: grid; grid-template-columns: 92px 1fr 240px; gap: 28; align-items: center`.

- **Tab-Label** „Verdikt der Redaktion" — identisch zum Faktenblatt-Tab, aber `border: 2px solid --ink`, `top: -14px`.
- **Glyph (Spalte 1)**: Display 88, line-height 0.9, `text-align: center`, Farbe = Verdikt-Farbe. Glyphs:
  | Verdikt | Glyph | Farbe |
  |---|---|---|
  | EMPFEHLEN | `✔` | `--green` |
  | BEDINGT | `◐` | `--amber` |
  | NICHT | `✕` | `--vermillion` |
  | ÜBERBEWERTET | `⊘` | `--purple` |
  | ABWARTEN | `◷` | `#5a6068` |
- **Mitte (Spalte 2)**: Mono-Verdikt-Label (11/700/`0.18em` uppercase, Farbe = Verdikt-Farbe), darunter Verdikt-Headline (Serif 700, 34/1.1, `-0.018em`), darunter Nuance (Serif italic 17, `--ink-soft`, `margin-top: 10`).
- **Vertrauen (Spalte 3)**: `padding: 14px 16px`, `background: --paper`, `border: 1px solid --rule-hi`. Mono 11 line-height 1.7.
  - Titel `VERTRAUEN` in `--vermillion`, weight 700, `letter-spacing: 0.14em`, `margin-bottom: 8`.
  - 5 Bars: `flex; gap: 3`, jede `22 × 11px`, `border: 1px solid --ink`. Aktive (≤ `trust`) gefüllt `--ink`; inaktive `transparent`.
  - Zeile 2: `<trust> / 5 · <Label>` in `--ink` (`hoch` ab 4).
  - Zeile 3: „Akte seit N Tagen" in `--ink-mid`.

### 4.4 `AkteTLDR` — Dark Strip

`padding: 24px 56px 8px` Container.

Innerer Block: `background: --ink`, `color: --paper`, `padding: 28px 34px`, `display: grid; grid-template-columns: 170px 1fr; gap: 32; align-items: flex-start`.

- Linke Spalte: Mono 10 uppercase `In 60 Sek.` (Farbe `#a9a698`), darunter Serif italic 700 **42/1.0** `TL;DR.` (`-0.02em`).
- Rechte Spalte: `<ul>` Serif 18/1.55, Bullets sichtbar, Padding `4px 0 0 20px`, Items `margin-bottom: 6`. 3–5 Bullets, letzter ohne `margin-bottom`.

### 4.5 `AkteParagraph` — § 01 … § 04

Section-Container-Pattern (siehe §2). Linke Marginalie (`width: 120px`) trägt:
- §-Nummer Serif italic 900, 48/1, `-0.03em`, Farbe `--vermillion`.
- Kicker Mono 10 uppercase `--ink-mid`, `letter-spacing: 0.16em`, `margin-top: 8`, `max-width: 110`.

Rechte Spalte: H2 (`46/1.05`, `-0.024em`, Serif 700), `margin: 0 0 18px` (Fit/Cases/Features verwenden `0 0 22px`).

Vier Body-Varianten (durch das jeweilige Feld bestimmt):

**(a) `body: string[]`** — klassische Absätze. Im **ersten** Absatz wird der erste Buchstabe als Drop-Cap dargestellt:
```jsx
<span style={{ floatLeft, serifBold, fontSize: 78, lineHeight: 0.85,
               paddingRight: 10, paddingTop: 6, color: '--vermillion' }}>
  {text[0]}
</span>
{text.slice(1)}
```
Absätze: Serif 19/1.6, `max-width: 840`, `margin: 0 0 14px`.

**(b) `fit: { who, ok, note }[]`** — Eignungs-Tabelle, `border: 1px solid --ink`. Pro Zeile `grid-template-columns: 42px 1fr 1.4fr`, Zebra `--paper` / `--paper-alt`, `border-top: 1px solid --rule` ab der zweiten.
- Spalte 1: `text-align: center`, `padding: 14px 0`, Display 24, `✔` (`--green`) oder `✕` (`--vermillion`).
- Spalte 2: `padding: 14px 18px`, Serif 700 18, `border-left: 1px solid --rule-hi`.
- Spalte 3: `padding: 14px 18px`, Serif 16, `--ink-soft`, `border-left: 1px solid --rule-hi`.

**(c) `cases: [title, blurb][]`** — Sechserraster (`grid-template-columns: 1fr 1fr; gap: 1; background: --rule; border: 1px solid --ink`). Zelle: `background: --paper`, `padding: 18px 22px`. Kopfzeile mit Mono 11/700 vermillion-Nummer `01…` und Serif 700 21 Titel. Body Serif 16, `--ink-soft`, `margin-top: 6`, `line-height: 1.45`.

**(d) `features: [name, meaning][]`** — Definition-Tabelle. Header-Zeile: `grid-template-columns: 180px 1fr`, Mono 10 uppercase `Funktion` / `Was es bedeutet`, `border-bottom: 2px solid --ink`, `padding: 10px 0`. Reihen `padding: 14px 0`, `border-bottom: 1px solid --rule`, Spalte 1 Serif 700 18, Spalte 2 Serif 17 `--ink-soft` 1.5.

### 4.6 `AkteProsCons` — § 05

Section-Pattern. Marginalie: `§ 05` + Kicker `Bilanz · Soll & Haben`. H2 `Vorteile & Nachteile`.

Body: `grid-template-columns: 1fr 1fr; border: 2px solid --ink`.
- Linke Spalte (Haben): `padding: 22px 26px`, `background: --paper`, `border-right: 1px solid --ink`. Header Mono 11/700/`0.18em` uppercase, Farbe `--green`, Inhalt `✔ Haben — was funktioniert`. `<ul>` Serif 17/1.55, `padding: 14px 0 0 22px`, Items `margin-bottom: 10`.
- Rechte Spalte (Soll): identisch, `background: --paper-alt`, kein right-border, Header in `--vermillion` mit `✕ Soll — was Sie wissen müssen`.

### 4.7 `AktePrivacy` — § 06

Section-Pattern. Marginalie: `§ 06` + Kicker `Datenschutz · Regeln`. H2 `Datenschutz & Daten-Hygiene`. Leadsatz: Serif italic 19, `--ink-soft`, `max-width: 780`, `margin: 0 0 18px`.

Body: `border: 2px solid --ink`. Pro Regel `grid-template-columns: 1fr 140px`, Zebra `--paper` / `--paper-alt`, `border-top: 1px solid --rule` ab der zweiten.
- Spalte 1: Serif 17, `--ink`, `padding: 14px 22px`.
- Spalte 2: Mono 11/700 uppercase, `letter-spacing: 0.14em`, `text-align: center`, `padding: 14px 22px`, `border-left: 1px solid --rule-hi`.
  - Tone-Farbe:
    | Tone | Farbe |
    |---|---|
    | `Pflicht` | `--vermillion` |
    | `empfohlen` | `--amber` |
    | `optional` | `--green` |

### 4.8 `AkteSchlussbild` — Editorial-Bild

`padding: 48px 56px 0`, `border-top: 1px solid --rule`, `margin-top: 32`, `padding-top: 36`.

- Headerzeile (`flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14; gap: 24`):
  - Links Kicker Mono 11/700 vermillion `↳ Schlussbild` + Serif italic 900, **28/1.0**, `-0.022em` `Eine Pause, bevor die Redaktion spricht.` (`margin-top: 8`).
  - Rechts Mono 10 `--ink-mid`, `letter-spacing: 0.08em`, `white-space: nowrap` `Bild · Redaktion · 2026`, `padding-bottom: 4`.
- Bild-Slot: `width: 100%; aspect-ratio: 4 / 3; background: --parchment; border: 1px solid --ink`. Fallback-Placeholder `Editorial-Illustration ablegen · 4:3 empfohlen`. **Nicht generieren** — Slot bleibt leer/parchment, wenn kein Asset.
- Bild-Caption-Zeile (`margin-top: 14`, `padding-top: 10`, `border-top: 1px solid --rule`, `grid-template-columns: 1fr auto`, `align-items: baseline`):
  - Links Serif italic 14/1.5 `--ink-soft`. Davor inline Mono 10 vermillion uppercase `Abbildung 1` mit `margin-right: 10`.
  - Rechts Mono 10 `--ink-mid` `S. 06 · § 06/07`.

### 4.9 `AkteClosing` — § 07 Blockquote

Section-Pattern. Marginalie `§ 07` + Kicker `Redaktionelle Einschätzung`. H2 `Schlussbemerkung.`.

Blockquote: `padding: 26px 32px`, `background: --parchment`, `border-left: 6px solid --vermillion`, restliche Seiten `1px solid --rule-hi`.
- Zitat Serif italic 26/1.4, `--ink`, `-0.005em`. Deutsche Anführungszeichen `„…"`.
- Attribution Mono 11 `--ink-mid`, `letter-spacing: 0.1em` uppercase, `margin-top: 18`: `— Die Redaktion · letzte Prüfung <Datum>`.

### 4.10 `AkteFAQ` — § 08

Section-Pattern. Marginalie `§ 08` + Kicker `Häufige Fragen`. H2 `Fragen aus dem Posteingang.`.

Liste: `border-top: 2px solid --ink`. Pro Eintrag `grid-template-columns: 48px 1fr; border-bottom: 1px solid --rule; padding: 20px 0; align-items: flex-start`.
- Spalte 1: Mono 11/700 vermillion `F.01`, `letter-spacing: 0.12em`, `padding-top: 4`.
- Spalte 2: H3 Serif 700, 22/1.3, `-0.01em`, `margin: 0 0 8px`. Antwort Serif 17/1.55, `--ink-soft`, `max-width: 820`, `margin: 0`.

### 4.11 `AkteAlternatives` — Verwandte Akten

Container: `padding: 48px 56px 0`, `border-top: 3px double --ink`, `margin-top: 48`, `padding-top: 36`.

Header-Zeile: `flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid --ink; padding-bottom: 12; margin-bottom: 24`.
- Links: Mono 11/600 vermillion `↳ Verwandte Akten` + H2 Serif 700, 42/1.0, `-0.024em` `Vergleichbare Werkzeuge.` (`margin: 10px 0 0`).
- Rechts: Mono 12 `--ink` `↳ alle 1.171 Akten` (Zahl dynamisch).

Grid: `grid-template-columns: repeat(3, 1fr); gap: 1; background: --rule; border: 1px solid --ink`.

Karte:
- `background: --paper`, `padding: 22px 24px 20px`, `min-height: 200px`, `display: flex; flex-direction: column; justify-content: space-between`.
- Kopfzeile (`flex; justify-content: space-between; align-items: baseline`):
  - Links Mono 10 `--ink-mid`, uppercase, `letter-spacing: 0.14em` `Alternative 01`.
  - Rechts Display 24 Verdict-Glyph in Verdict-Farbe.
- Name Serif italic 900, 42/1, `-0.025em`, `margin-top: 12`. Punkt am Ende vermillion, `font-style: normal`.
- Tone Serif 17/1.45, `--ink-soft`, `margin: 10px 0 0`.
- Fußzeile (`margin-top: 16`, Mono 11): links `Kategorie · Preis` in `--ink-mid`, rechts `Akte öffnen ↗` in `--ocean`, weight 600.

### 4.12 `AkteColophon` — Streifen

Container: `padding: 40px 56px 24px`.

Streifen: `display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border: 1px dashed --rule-hi; flex-wrap: wrap; gap: 14`. Mono 11 `--ink-mid`, `letter-spacing: 0.04em`.

Felder (Reihenfolge):
- `Akte <NN>`
- `Status aktiv`
- `Letzte Prüfung <dd.mm.yyyy>`
- `Nächste Prüfung <dd.mm.yyyy>` (Last + 30 Tage)
- `Daten /api/tools/<slug>.json`
- `Lizenz CC BY-NC 4.0`
- letzter Eintrag: `0 bezahlte Platzierungen` in `--vermillion`, weight 700

Jedes Label-Wort (z. B. `Akte`, `Status`) ist `--ink-dim`; der Wert dahinter erbt `--ink-mid`.

### 4.13 Monogram

```jsx
<span style={{
  width:size, height:size, background:'#0c0c0a', color:'#f6f4ee',
  fontFamily: serif, fontWeight:900, fontStyle:'italic',
  fontSize: round(size * 0.6), borderRadius:4,
  display:'inline-flex', alignItems:'center', justifyContent:'center'
}}>{firstLetter}</span>
```

Erstbuchstabe nach Filter `[A-Za-zÄÖÜäöü]`, sonst `·`.

---

## 5. Datenkontrakt

Frontmatter, das die Akte erwartet (an `content/tools/*.md` angelehnt, ergänzt um redaktionelle Felder):

```yaml
slug: chatgpt
title: ChatGPT
akte_no: "0042"                # 4-stellig, string
category: "Chatbots & Assistenten"
vendor: OpenAI
domain: chatgpt.com
price: "Freemium · 0 / 20 / 30+ $ pro Sitz"
tags: [chatbot, llm, assistant, general-purpose]
verdict: EMPFEHLEN              # EMPFEHLEN | BEDINGT | NICHT | UEBERBEWERTET | ABWARTEN
verdict_head: "Empfehlen — als Arbeitsfläche, nicht als Faktenquelle."
verdict_nuance: "Sicherer Standard für gemischte Teams …"
oneliner: "Universelle KI-Arbeitsfläche …"
last_checked: 2026-05-21
in_index_since: 2022-12-03
decisions_used_in: 4
trust: 4                        # 0..5
meta:
  Hersteller: "OpenAI · San Francisco"
  Hosting: "USA · EU optional (Team/Enterprise)"
  DPA verfügbar: "Ja (Team / Enterprise / API)"
  Eigenes Modell: "Ja · GPT-Familie"
  Open Source: "Nein"
  Self-hostable: "Nein"
  API verfügbar: "Ja"
  Bezahlte Platzierung: "nein"
pros: [...]                     # 3–5 Strings
cons: [...]                     # 3–5 Strings
privacy:                        # max ~6 Zeilen
  - ["Keine Passwörter, …", "Pflicht"]
  - ["Workspace-Rahmen …", "empfohlen"]
  - ["Memory deaktivieren", "optional"]
closing: "ChatGPT ist kein …"
faqs:
  - ["Frage 1?", "Antwort 1."]
alternatives:
  - { name: Claude, verdict: EMPFEHLEN, tone: "…", cat: AI, price: Freemium }
paragraphs:                     # § 01 … § 04 (Body)
  - { num: "§ 01", title: "Was es ist", kicker: "Position im Markt", body: ["…", "…"] }
  - { num: "§ 02", title: "Für wen geeignet", kicker: "Zielprofile · Eignung",
      fit: [{ who: "Wissensarbeit", ok: true, note: "…" }, …] }
  - { num: "§ 03", title: "Typische Einsatzszenarien", kicker: "Sechs Fälle …",
      cases: [["Schreiben", "…"], …] }
  - { num: "§ 04", title: "Funktionsumfang", kicker: "Was in der Oberfläche steckt",
      features: [["Dialog-Assistenz", "…"], …] }
```

Pipeline-Hinweis: `paragraphs` / `fit` / `cases` / `features` / `faqs` müssen im Generator `generate_tool_md.mjs` ergänzt werden, **aber das ist nicht Teil dieser Designbatch** (CLAUDE.md verbietet Pipeline-Eingriffe ohne Routenzwang). Für die erste Implementierung: Fallback-Schema akzeptieren, fehlende Felder → Section nicht rendern.

---

## 6. States & Edge Cases

| Element | State | Verhalten |
|---|---|---|
| Verdikt-Stamp | unbekannt / `null` | Block komplett auslassen; Layout darf nicht „durchschimmern". |
| Verdikt-Glyph | unsupported value | Fallback Glyph `◌`, Farbe `#5a6068`. |
| Vertrauensbalken | `trust = 0` | 5 leere Balken, Label `0 / 5 · keine Bewertung`. |
| Faktenblatt-Meta | leerer Wert | Zeile auslassen (kein Em-Dash, kein „—"). |
| `Bezahlte Platzierung` | `"nein"` | Wert in `--vermillion`, weight 600. Bei `"ja"` → Verdikt-Block muss `verdict_nuance` mit Disclosure ergänzen; Wert in `--vermillion`. |
| TL;DR | < 3 Items | Section auslassen. |
| § 01 Drop-Cap | Body beginnt mit Zahl/Klammer | Drop-Cap überspringen, erstes Wort komplett normal. |
| `fit` / `cases` / `features` | leer | jeweilige Section nicht rendern (kein leerer Rahmen). |
| Schlussbild | kein Asset | Slot bleibt `--parchment` mit Placeholder. **Keine Bildgenerierung** (CLAUDE.md, Constraint 1). |
| FAQ | `faqs.length === 0` | § 08 komplett auslassen. |
| Alternativen | < 3 | Grid mit `repeat(N, 1fr)`; bei 0 Section auslassen, kein „leerer Block". |
| Colophon | `decisions_used_in = 0` | Zeile bleibt, Wert `0`. |
| Long-Title | H1 > 14 Zeichen | Größe linear runter: `font-size: clamp(72px, 12vw, 128px)`. |
| Long-Vendor | Faktenblatt-Header bricht | Vendor `text-overflow: ellipsis`, Domain darf umbrechen. |
| Internationaler Inhalt (lange dt. Komposita) | H1 lässt nicht | `hyphens: auto; word-break: break-word` nur für H1. |
| Empty alternative tone | nichts | `<p>`-Zeile auslassen, Karte bleibt höhenstabil durch `min-height: 200`. |
| Long Tag-Liste | > 6 Chips | wrap; keine Truncation. |
| FAQ Antwort > 4 Zeilen | normal | keine Truncation, `max-width: 820` hält das Maß. |
| Verdikt = `NICHT` | — | gesamter Block bleibt `--parchment`, Glyph/Label rot, **kein** roter Hintergrund (vermeidet „Alarmkasten"). |
| Loading | SSR-only | Astro rendert komplett. **Kein** Client-Skeleton geplant. |
| Error (Datenfeld nicht parsbar) | Build-Fail | Pipeline soll abbrechen — keine „Best-effort"-Render-Fallbacks. |

---

## 7. Responsive Behavior

Das Demo ist `1440px` fix. Auf Live-Site:

| Breakpoint | Änderung |
|---|---|
| ≥ 1280px | Default-Layout (Spec oben). |
| 1024–1279px | `dsS.inner.padding: 0 40px`. H1 `clamp(88px, 9vw, 128px)`. Verdict-Spalte 3 (Vertrauen) bleibt 240px; Spalte 1 92px. |
| 768–1023px | Masthead → 1-spaltig (`grid-template-columns: 1fr`), Faktenblatt darunter, `gap: 32`. Verdict → 2-spaltig: Glyph als kleine Zeile (`64px`, links), Text rechts; Vertrauensblock unter dem Block (`grid-column: 1 / -1; margin-top: 16`). TL;DR-Grid → `1fr` (Label oben). Pros/Cons & Privacy: bleiben 2-spaltig, falls Body ≥ 600px breit; sonst stapeln. Alternatives: `repeat(2, 1fr)`. |
| < 768px (Mobile) | Container-Padding `0 20px`. Marginalie (§-Nummer) wandert über den Titel, `grid-template-columns: 1fr; gap: 16`. H1 `clamp(56px, 14vw, 88px)`. Buttons stapeln (`flex-direction: column; gap: 10`). TL;DR-Title runter auf 32. Verdict-Glyph 56, Text-Größen: Headline 26, Nuance 15. Pros/Cons & Privacy stapeln. FAQ Spalte 1 schrumpft auf 38px. Alternatives: 1-spaltig. Faktenblatt-Tab-Label rückt nach links auf 14px. Schlussbild bleibt 4:3. |

Footer / Header: **nicht** in dieser Spec — bleiben wie aktuell auf Live-Site.

---

## 8. Interactions

| Element | Trigger | Verhalten | Dauer / Easing |
|---|---|---|---|
| Primary-Button (`↗ ZUM ANBIETER`) | hover | `background: #1a1a16` (Ink + 10 %), `color: --paper` | 120ms `ease-out` |
| Primary-Button | focus | `outline: 2px solid --vermillion; outline-offset: 2px` | — |
| Secondary-Button | hover | `background: --ink; color: --paper` (Invert) | 120ms `ease-out` |
| Tag-Pill `#xxx` | hover | `border-color: --ink; color: --ink` | 100ms |
| Link `← Tool-Index`, `Akte öffnen ↗` | hover | `text-decoration: underline; text-underline-offset: 3px` | — |
| Alternative-Karte | hover | gesamte Karte klickbar; `background: --paper-alt`; Name + `Akte öffnen ↗` in `--vermillion` | 140ms `ease-out` |
| FAQ-Eintrag | — | **kein** Accordion. Alle Fragen sichtbar ausgeklappt. |
| Verdict-Glyph | scroll-into-view | optional: 200ms fade-in von 0 → 1, `transform: translateY(4px) → 0`. Mit `prefers-reduced-motion: reduce` deaktiviert. |
| Schlussbild | — | statisches Bild, kein Lightbox. |
| H1 Punkt | — | rein dekorativ, nicht klickbar. |

Keine globale Scroll-Animation. Header bleibt wie heute (sticky-Verhalten unverändert).

---

## 9. Accessibility

- **Landmarks**: Tool-Akte als `<article>`; Faktenblatt als `<aside>`; Verdict als `<section aria-labelledby="verdict-h">`; FAQ als `<section aria-labelledby="faq-h">`.
- **Headings**: H1 = Tool-Name. Jede §-Section liefert ein H2. FAQ-Fragen sind H3.
- **Verdict-Glyph**: dekorativ → `aria-hidden="true"`. Verdikt-Label (`Empfehlen` etc.) bleibt sichtbar und ist die maschinenlesbare Aussage.
- **Vertrauensbalken**: `role="img"` mit `aria-label="Vertrauen: {trust} von 5"`.
- **Faktenblatt-Tabelle**: als echtes `<dl>`/`<dt>`/`<dd>` umsetzen. Mono-Reihen sind Definitions-Pärchen.
- **Pros / Cons / Privacy**: als `<ul>` mit `aria-label` (z. B. „Was funktioniert", „Was Sie wissen müssen", „Datenschutzregeln"). Tones in Privacy: nicht nur Farbe — Mono-Text `Pflicht / empfohlen / optional` trägt die Bedeutung.
- **FAQ**: `<details>` ist explizit **nicht** gewünscht (Spec: ausgeklappt). Wenn JS-Toggle kommt, mit `aria-expanded`.
- **Kontrast**: alle Token-Kombinationen geprüft:
  - `--ink` auf `--paper` = 17.4 : 1
  - `--ink-soft` auf `--paper` = 11.3 : 1
  - `--ink-mid` auf `--paper` = 6.0 : 1 (AA für Body, AAA für Large)
  - `--vermillion` auf `--paper` = 5.6 : 1 (AA)
  - `--green` auf `--paper` = 5.9 : 1 (AA)
  - `--amber` auf `--paper` = 5.4 : 1 (AA Large) → **bei Body-Größen Risiko**, nur für Caps ≥ 11px / 700 verwenden
  - `--ocean` auf `--paper` = 9.3 : 1
  - `--paper` auf `--ink` = 17.4 : 1 (TL;DR / Closing-Stripe)
  - `#a9a698` auf `--ink` = 9.5 : 1
  - `#c7c4b6` auf `--ink` = 12.5 : 1 (Footer-Body)
- **Tastaturpfad**: Breadcrumb → Buttons im Masthead → Faktenblatt-Links (falls vorhanden) → Alternativen-Karten. Focus-Ring `2px solid --vermillion`, `outline-offset: 2px`.
- **Reduced motion**: alle Hover/Fade-Effekte respektieren `prefers-reduced-motion: reduce`.

---

## 10. Implementation Notes (Astro)

Stack ist Astro + globale CSS unter `site/public/styles/global.css` (siehe CLAUDE.md, kritischer Pfad).

- **Komponenten anlegen** unter `site/src/components/tool-akte/`:
  - `AkteMasthead.astro`
  - `AkteFaktenblatt.astro`
  - `AkteVerdict.astro`
  - `AkteTLDR.astro`
  - `AkteParagraph.astro` (mit `<slot>` für die 4 Body-Varianten oder eigenständigen `AkteFit`, `AkteCases`, `AkteFeatures`)
  - `AkteProsCons.astro`
  - `AktePrivacy.astro`
  - `AkteSchlussbild.astro`
  - `AkteClosing.astro`
  - `AkteFAQ.astro`
  - `AkteAlternatives.astro`
  - `AkteColophon.astro`
  - `Monogram.astro`
- Route-Datei: `site/src/pages/tools/[slug].astro` rendert in der Reihenfolge §1.
- **Tokens als CSS-Variablen** in `global.css` ergänzen (Suffix `--akte-*` oder direkt `--paper`, falls noch nicht existent). Lokale Komponenten-Klassen statt Inline-Styles, damit kein `!important` nötig ist (siehe `TOKEN_SAVING.md`).
- **Header/Footer** bleibt der Live-Header (`BaseLayout.astro`). Verlinkung auf Datenschutz/Impressum bleibt erhalten (CLAUDE.md, „Must preserve").
- **Pill-Tabbar** aus `01-akte-fig.png` ist **Demo-only** — nicht implementieren.
- **Mode-/Old-Version-Switch** gehört per Visual-Targets „top-right area, not in the central issue badge" — falls nötig, neben das Such-Icon. Aus Scope dieser Akte aber draußen.
- **Bilder**: nur vorhandene Assets aus `content/images/` / `site/public/` einsetzen. Bei fehlen: `--parchment`-Slot anzeigen, **nichts generieren**.
- **Druck-CSS** (Vorlage `Standalone-print.html` vorhanden): später als eigene Batch behandeln — Verdikt + Faktenblatt + § 01 / § 05 / § 07 sind die Pflicht-Sektionen für `@media print`.

---

## 11. Verification

Nach Implementierung (siehe `CHECKLIST.md`):

1. `git diff --stat` — nur Dateien in `site/src/pages/tools/`, `site/src/components/tool-akte/`, `site/public/styles/global.css`.
2. `npm --prefix site run build` — grün.
3. `/tools/chatgpt/` und `/tools/zapier/` lokal 200, manueller Screenshot @1440 und @375.
4. `scripts/claude_design_build_check.ps1` — grün.
5. Visuelle Abnahme gegen `01-akte-fig.png` (Masthead-Header), `01-akte-fig2.png` (§ 01 Drop-Cap), `uploads/pasted-1779977987792-0.png` (Schlussbild + § 07), `uploads/pasted-1779978705145-0.png` (Schlussbild-Variante voll).
6. Screenshots speichern unter `output/claude-design/tool-akte/` (Pfade in Folge-Report angeben statt Bilder einbetten).

---

## 12. Out of Scope

- Header-Pill-Nav, Mode-Switch, Theme-Toggle.
- Homepage `DSHome`, Decision-Sheet `DSSheet`, Inventar `DSInventar`, Ratgeber-Archiv — eigene Batches.
- Druck-Stylesheet.
- Bildgenerierung jeglicher Art (CLAUDE.md, Constraint 1).
- Pipeline-Änderungen am Generator (`generate_tool_md.mjs`, `finalize_md.mjs`) — separate Konversation.
