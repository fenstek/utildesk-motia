---
slug: carbon-black
title: Carbon Black (VMware)
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: Entwickler-Tools
price_model: Abonnement
tags:
  - cybersecurity
  - endpoint security
  - XDR
  - enterprise
official_url: "https://www.broadcom.com/products/carbon-black"
description: "Endpoint security portfolio for prevention, EDR, and incident response, combining sensors, policies, and centralized investigation under Broadcom's Carbon Black products."
translation: full
updated_at: 2026-07-14
---
# Carbon Black (VMware)

Carbon Black is now a Broadcom endpoint-security portfolio whose products originated in the VMware Carbon Black line. Depending on the contract and module, it covers prevention and automated detection through Carbon Black Cloud Endpoint Standard, threat hunting and incident response through Enterprise EDR, or restrictive application-control policies. It is not one all-in-one product and it does not replace a SOC or a tested recovery process.

<figure class="tool-editorial-figure">
  <img src="/images/tools/carbon-black-editorial.webp" alt="a black-and-white cyber-defense perimeter and response team" loading="lazy" decoding="async" />
</figure>

## What Carbon Black is for

Carbon Black is aimed at security and IT teams that need endpoint activity to be visible, risky behavior to be blocked, and incidents to be investigated with evidence. Endpoint Standard combines next-generation antivirus with behavioral EDR capabilities. Enterprise EDR is built around continuous event data, hunting, and response. App Control takes a different approach: its positive-security model is designed to let only trusted software run on critical or fixed-function systems. Before buying, identify the exact module, supported operating systems, and deployment model.

## The components that matter

Depending on the product and configuration, a sensor collects process, file, network, script, and registry activity and communicates with the console. Policies determine whether behavior is logged, blocked, or explicitly allowed. The cloud console manages devices, alerts, investigations, policies, and roles; APIs and the Data Forwarder can send alerts and endpoint events to a SIEM or security lake. Enterprise EDR adds threat intelligence, watchlists, and live response. These components must be checked against the tenant's actual license rather than assumed from the Carbon Black name.

## A practical rollout workflow

1. Inventory endpoints, servers, workloads, special-purpose devices, and offline networks. Define the telemetry and response actions that are actually required.
2. Start with a test group and a monitoring policy. Check sensor connectivity, CPU and memory impact, proxy requirements, agent updates, and administrator-controlled uninstall protection.
3. Run targeted tests for malware, PowerShell, script, and ransomware behavior. Record detection, blocking, alert context, and the manual fallback.
4. Move proven rules into production gradually. Every change needs an owner, a test record, time-bounded exceptions, and a rollback path.
5. Practise triage, isolation, live response, evidence handling, and hand-off to the help desk, incident responders, or external forensics.

## Operations, integration, and boundaries

Cloud editions reduce server administration, but they do not remove sensor lifecycle work, policy ownership, network access, roles, or alert queues. An on-premises or offline requirement is a different operational decision: Carbon Black EDR puts more responsibility for storage, scaling, backup, patching, and high availability on the operator. Store API credentials in a secret manager, use least-privilege access levels, and rotate them. API queries are rate limited; exports and Data Forwarder destinations need their own storage, cost, and deletion controls.

A bypass is not a harmless compatibility switch. Broadcom documents that bypass can reduce visibility and enforcement. Keep exceptions narrow by path, process, and operation, test them, assign an expiry, and remove them when the interoperability problem is understood. Offline devices retain local policies and some local protection, but they do not receive new cloud reputation lookups while disconnected.

## Evaluation and quality control

Do not measure only the number of blocked attacks. Track managed-device coverage, sensor health, alert quality, triage time, false positives, policy changes, CPU impact, and time to isolation. Have analysts investigate real cases using the process tree and available telemetry. Verify that API exports arrive in the SIEM and that evidence retention, restore, and a cloud-console outage are covered by the incident plan. A successful demo is not proof that the response chain works under pressure.

## Security, privacy, and governance

Endpoint telemetry can contain command lines, file paths, network connections, processes, and registry activity. Before rollout, document region, processing terms, retention, access, export, and deletion with privacy, legal, and employee-representation stakeholders. Broadcom documents a command-line obfuscation option on the device; it does not automatically protect information already stored in the console. Use separate administrator accounts, audit logs, sensor protection, least privilege, and a controlled exception process. Treat compliance or certification mapping as something to verify for the specific module and contract, not something to infer from the product name.

## Costs and selection criteria

Carbon Black is sold through partners and tailored offers; no dependable public standard price list was found for the modules covered here. The quote may depend on endpoints or workloads, cloud versus on-premises deployment, endpoint and EDR modules, retention, support, managed services, and term. Add SIEM storage, network traffic, sensor rollout, policy maintenance, on-call coverage, and training. Ask for a module-level quote and model a full year with realistic device classes and retention instead of comparing only a per-endpoint headline.

## Editorial Assessment

We recommend Carbon Black to an established security team with clear endpoint ownership that wants to combine behavioral prevention, investigation, and controlled response within one portfolio. It creates value when sensor coverage, policy ownership, and an available incident-response process already exist. A small team without SOC capacity, a mostly Microsoft-centered estate, or a narrowly defined allowlisting requirement may be better served by a simpler alternative. Decide after a pilot on real endpoints with measurable triage goals and a documented data and cost model.

## Alternatives

- [CrowdStrike Falcon](/en/tools/crowdstrike-falcon/): A cloud-centered EDR option for teams comparing Falcon modules and its detection-and-response workflow.
- [Microsoft Defender for Endpoint](/en/tools/microsoft-defender-for-endpoint/): A natural fit for Microsoft 365, Entra, and Windows-management estates where platform integration matters most.
- [SentinelOne](/en/tools/sentinelone/): A comparison point for automated endpoint response with its own agent and policy model.
- [Sophos Intercept X](/en/tools/sophos-intercept-x/): More suitable when endpoint protection should be administered through Sophos Central and a consolidated operations path.

## FAQ

**Is Carbon Black one product?**

No. Under Broadcom, Carbon Black covers several products and modules, including Cloud Endpoint Standard, Enterprise EDR, Carbon Black EDR, and App Control. The quote, sensor, and operating model must therefore be named explicitly.

**Does Carbon Black require an internet connection?**

Cloud sensors need connectivity for new cloud reputations, analysis, and the central console. Offline devices retain local policies and some local protection, but they do not receive new cloud intelligence while disconnected.

**How do we keep a policy from disrupting the whole fleet?**

Test rules in a policy assigned to a small device group first. Document their effect and exceptions, roll out gradually, and avoid broad bypass rules because they can reduce both visibility and protection.

**Which data should be reviewed before rollout?**

Review process and command-line data, file paths, network events, retention, region, roles, exports, and SIEM destinations. Privacy, employee-representation, and incident-response owners should approve the purpose and access chain.

**How should the cost comparison be made?**

Do not compare only the endpoint price. Request module and retention pricing, then add sensor operations, policy maintenance, SOC time, SIEM storage, support, training, and any on-premises infrastructure.
