# Proton Affiliate Mail Access

This project may use a dedicated Proton mailbox for Utildesk affiliate
registrations and verification links.

The project owner approved using this dedicated mailbox broadly for our project
work, not only affiliate confirmations, as long as the use remains tied to
Utildesk/JGDUS/OpenClaw-related operational tasks and does not touch private
mail or unrelated personal accounts.

## Secret

Real credentials live only in the git-ignored local file:

```text
secrets/proton-affiliate-webmail.env
```

Template:

```text
secrets/proton-affiliate-webmail.env.example
```

Required variables:

- `PROTON_WEBMAIL_URL`
- `PROTON_WEBMAIL_USER`
- `PROTON_WEBMAIL_PASSWORD`

Optional variable:

- `PROTON_WEBMAIL_ALLOWED_SENDERS`

## Rules

- Use this mailbox only for Utildesk affiliate and submission verification.
- Broader project use is allowed for our projects: registrations, verification
  links, vendor/platform communication, outreach, and operational mail.
- Do not use this mailbox for unrelated personal activity or accounts outside
  our projects.
- Never print, commit, or copy the password into logs, docs, issues, commits,
  or screenshots.
- Browser automation may open Proton Mail and verification emails, but must not
  change password, recovery data, forwarding, filters, account settings, or
  security settings.
- If a registration requires tax data, payout details, personal identity,
  company identity, or legal declarations, stop and ask before continuing.
- Prefer affiliate programs where credit can accumulate in the platform and
  payout is not forced immediately.
