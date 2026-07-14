---
slug: darktable
title: Darktable
description: "Local open-source workflow for RAW development, photo management, and controlled export with non-destructive editing, XMP sidecars, and reusable styles."
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: Design
price_model: Open Source
tags:
  - photo
  - editing
  - raw
  - open source
official_url: 'https://www.darktable.org/'
translation: full
updated_at: 2026-07-14
---
# Darktable

Darktable is a local open-source application for RAW development, photo management, and controlled export. It suits photographers and small production teams that need non-destructive work on camera originals and a repeatable way to prepare outputs. The important boundary is that Darktable is not a cloud DAM or shared review room: the team still owns the library, sidecars, backups, permissions, and handovers.

## Who is Darktable for?

Darktable is a good fit when a team wants to process RAW files on its own computers or storage, maintain metadata, and create variants without changing the original. Its interface and pixelpipe model require deliberate learning. Someone who occasionally crops a JPEG will usually be better served by a simpler editor. A photographer or studio that regularly culls, rates, tags, develops, and exports many images can benefit from a local tool without recurring license fees.

## The components in a real workflow

Lighttable supports import, culling, filtering, ratings, and tagging. Darkroom modules form a processing chain, the pixelpipe, while presets and styles can package repeatable development decisions. The library database stores catalog and editing information; XMP sidecars can preserve edits beside the source file. The usable result is created on export, such as JPEG or TIFF, rather than by merely changing a RAW file in place.

<figure class="tool-editorial-figure">
  <img src="/images/tools/darktable-editorial.webp" alt="Darkroom table with contact sheets, filters, and a landscape print representing Darktable's RAW workflow" loading="lazy" decoding="async" />
</figure>

## A dependable working method

1. **Import and protect:** Keep originals in an intentional folder structure, check capture metadata, and enable XMP sidecars.
2. **Cull:** Mark rejects, use ratings and color labels for selection stages, and tag by project, assignment, or subject.
3. **Develop:** Start from a defined baseline, compare exposure and color against reference images, and use masks or local corrections only where they serve the output.
4. **Reuse carefully:** Save recurring steps as a style, then test that style on several real images. A preset is not a substitute for visual review.
5. **Export and hand over:** Define the profile, format, dimensions, filename template, and metadata for each destination. JPEG may suit web delivery; TIFF can be the safer handover for further raster work.

## Operations, export, and handover

Darktable can run with a local library and without an online account. Local copies support work on selected images while an external drive is disconnected, followed by synchronization when the main storage returns. That is useful for travel or field work, but it adds a synchronization point. Teams should document folder ownership, write permissions, naming, and the rule for concurrent edits. Before renaming or moving files, account for both the library and their XMP sidecars; otherwise entries can become detached from their editing history.

## Quality and decision criteria

Do not evaluate Darktable by module count alone. Build a small reference set containing difficult examples: mixed light, high ISO, skin tones, lens defects, and a demanding export. Measure time to an approved result, correction rounds, color deviations, and recovery after a library problem. Check whether styles remain reproducible across machines and whether exported files contain the required profile and metadata. If another editor repeatedly has to repair the handover, that boundary belongs in the selection decision.

## Security, privacy, and governance

Local processing reduces the cloud data path, but it is not an automatic security control. RAWs, XMPs, libraries, previews, and export folders need normal access controls and backup protection. EXIF and GPS data can be included or excluded during export; publishing therefore needs an explicit metadata review. For client or people photography, record consent, retention, deletion, and source-material rights in the brief. Backups should cover RAWs, XMP sidecars, the library database, and, for migration, configuration and styles. Before upgrading, keep a tested rollback path because a newer library may not be readable by an older Darktable release.

## Cost and ongoing effort

Darktable is distributed as open-source software and does not require a subscription. The workflow is not therefore costless: hardware, GPU, storage, backup, color management, training, and support may still matter. Across several workstations, the largest operational cost is often maintaining shared folder and backup rules and checking exports. Compare that total effort with the current process, not just with a commercial license line.

## Editorial Assessment

We recommend Darktable to photographers and small teams that want local control of RAW development, can learn a technically dense workflow, and are prepared to own their data operations. It creates value when the library, XMP protection, styles, color profiles, and export targets are run as one documented process. Choose a more integrated or easier collaborative product for casual single-image work, cloud-first review, or teams without clear file ownership. Start with a real reference assignment and decide from recovery and approved-output quality, not from the length of the feature list.

## Alternatives

- [RawTherapee](/en/tools/rawtherapee/): A similarly focused RAW developer when catalog and workflow features matter less.
- [GIMP](/en/tools/gimp/): Better suited to pixel retouching, compositing, and manual image manipulation after RAW development.
- [Adobe Lightroom](/en/tools/adobe-lightroom/): A more integrated commercial photography workflow when cloud synchronization and guided catalog management justify the subscription.
- [Krita](/en/tools/krita/): Better for digital painting, illustration, and manual raster work than for catalog-oriented RAW development.

## FAQ

**Is Darktable suitable for beginners?**

Yes, but it is not a self-explanatory quick editor. A bounded learning path covering import, culling, exposure, color, and export is more effective than trying to master every module at once.

**Does Darktable modify the RAW originals?**

The development workflow is non-destructive. Edits are stored in the library and, when configured, in XMP sidecars; a distributable image must be explicitly exported.

**What should be included in a backup?**

Keep the RAW originals, their XMP sidecars, and the Darktable library database. A full migration also needs configuration, styles, and presets. Test a restore on a copy rather than assuming that a file copy is enough.

**Can a team use one shared library at the same time?**

Darktable is primarily a local desktop workflow. A library on network storage is not automatically a multi-user review and locking system; ownership, concurrency, backup, and recovery need separate rules.

**Can Darktable be used commercially?**

The software is open source and can be used in commercial workflows. That does not remove rights and licensing obligations for photographs, people, music, brands, embedded content, or third-party packages.

**What should be checked before an upgrade?**

Make and test a complete backup, then read the release notes for library and platform boundaries. New library data may not be compatible with older Darktable versions.
