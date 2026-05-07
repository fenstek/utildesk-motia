# INWX DNS/DNSSEC Access For `utildesk.de`

## Secret Location

Real credentials live only in the git-ignored local file:

```text
secrets/inwx-dns.env
```

Expected keys:

```env
INWX_LOGIN=
INWX_PASSWORD=
INWX_2FA_NOTE=
INWX_DOMAIN=utildesk.de
INWX_PANEL_URL=https://account.inwx.de/de/nameserver2/dnssec
```

## Why This Exists

`tools.utildesk.de` is served by Cloudflare Pages, but the public name is under
the `utildesk.de` DNS zone at INWX. A broken DNSSEC chain at INWX can make the
whole zone fail with `SERVFAIL` / `ERR_NAME_NOT_RESOLVED` even when Cloudflare
Pages itself is healthy.

## Emergency Check

Use these checks before touching deploy code:

```powershell
Resolve-DnsName tools.utildesk.de -Server 1.1.1.1
Resolve-DnsName tools.utildesk.de -Server 8.8.8.8
Invoke-WebRequest https://tools.utildesk.de/ -UseBasicParsing
Invoke-WebRequest https://utildesk-motia.pages.dev/ -UseBasicParsing
```

If `tools.utildesk.de` fails but `utildesk-motia.pages.dev` works, suspect DNS
or DNSSEC first, not the Pages deployment.

## DNSSEC Symptom

Google DNS-over-HTTPS may show:

```text
Status: 2
Comment: DNSSEC validation failure
```

If the same query with `cd=1` returns the expected CNAME/A records, the DNS
records exist and validation is the broken part.

## Safety Rules

- Never commit INWX credentials.
- Never paste INWX credentials into chat, issues, docs, or logs.
- Do not rotate nameservers, delete the zone, or change DNSSEC keys without a
  live recovery reason.
- During outage recovery, prefer one small DNSSEC action, then re-check public
  resolvers before doing anything else.
