# URL_SUSPICION.md

Shared final-destination classifier for redirect-based URL risks.

Script module: `scripts/lib/url_suspicion.mjs`

## Purpose

Centralize logic that evaluates resolved final URLs and returns:

- `verdict`: `allow` | `deny` | `review`
- `reason`: primary reason code
- `reasons`: full reason code list
- `signals`: parsed host/path metadata

Used by:

- `scripts/audit_new_inprogress_qc.mjs`
- `scripts/audit_done_suspicious_official_url.mjs`

## Reason codes

- `redirected_to_denied_final_host`
- `redirected_to_parking_or_domain_sale`
- `final_host_parking_provider`
- `final_url_matches_denied_pattern`
- `final_url_suspicious_content_hub`
- `final_url_unresolved` (fallback review)

## Policy intent

- Prefer `review` for ambiguous content-hub style destinations.
- Use `deny` for clear parking/domain-sale signals.
- Keep false positives low by requiring explicit host/path signals.

