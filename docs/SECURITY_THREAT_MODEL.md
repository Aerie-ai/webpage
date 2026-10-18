# Aerie security foundation — threat model and pre-client checklist
Updated: 18 October 2026. **Development planning, not a penetration-test certificate.**

## System actually present today

- GitHub Pages serves a **public static demonstration**. The browser Lab runs local rule-based enquiry triage, edits drafts in memory, and calculates fictional quotations. It does not have logins, customer tenants, a production database, email access, or a live AI connection.
- Static homepage and privacy pages in this PR add an explicit **no-script/no-network** HTML CSP; the Lab already restricts network access. A meta CSP is defense-in-depth, not a guarantee against maliciously replaced pages. Framing restrictions require server response headers, not a meta tag.
- A separate offline Python pilot reads fictional sample data. A **disabled by default** opt-in local-model adapter exists for future work.
- Current GitHub Actions uses a read-only token and test workflow. The security hardening PR removes persisted checkout credentials and pins the external workflow actions by full commit SHA.
- No production customer data is accepted, synchronised, encrypted, backed up, or processed today. Client-specific compliance is **not implemented**.
- The local data-redaction rules are incomplete and should not be used as a personal-data protection boundary.
- This document distinguishes **implemented**, **tested**, and **future** controls. Reducing attack surface does not make a system impenetrable.

## Highest-impact and less-obvious attack paths

| Attack path | Attacker's opportunity / potential impact | Current state and engineering response |
| --- | --- | --- |
| **Compromised website update or GitHub identity** | A changed browser script can read any plaintext entered on the page and silently send it away; client-side encryption alone cannot defend against malicious code served by the same origin | Public static hosting and CSP reduce some exposure; repository rules require PR + passing tests but currently **zero independent approvals**. Require independent review, identity MFA/passkeys, least-privilege GitHub access and deploy-change monitoring before real clients. |
| **CI/CD dependency substitution** | A mutable GitHub Action tag or exposed workflow token may enable supply-chain compromise | In this PR: pin exact upstream commits; disable checkout credential persistence; ensure minimal token permission; keep PR workflows free of customer data and secrets. Review pinned versions periodically. |
| **Spreadsheet export injection** | An invented job name beginning with spreadsheet formula characters may become an active formula when someone opens exported CSV | In this PR: centralised CSV escaping, Unicode normalisation, dangerous-prefix handling, control-character removal and regression tests. **CSV safety differs by application and after resaving**. Never open untrusted exports with unrestricted spreadsheet features. |
| **Cross-business authorisation failure (IDOR/BOLA)** | A user or integration guesses another company's invoice/customer ID, or accesses another tenant through search, attachments, logs or backups | No tenant backend exists. Block launch until server-side tenant checks, isolated encryption scopes, separate service credentials, and negative cross-tenant tests cover every path. Never trust the tenant ID from the browser alone. |
| **Prompt injection and forged authority** | A customer message, attachment, webpage, retrieved document or tool response says “ignore instructions” or impersonates an admin; an AI then issues refunds or exports records | No auto-executing AI today. Future AI may propose **drafts only**. Tools must enforce signed-in user rights, allowlisted actions, per-action approvals and immutable audit metadata separately from the language model. No LLM-produced URL or tool command is authoritative. |
| **OAuth / email-provider token theft** | A single stolen token can expose an inbox or send believable messages to a business's clients | No provider connections exist. Use narrowly scoped short-lived credentials, encrypted secret vault, revocation/re-auth, no tokens in browser bundles or logs, separate integration permissions, alerting. |
| **Malicious browser extension, device loss or recovery failure** | Browser extensions/malware can read decrypted data; lost encryption keys can destroy access to customer records | Local processing reduces transfer, **not endpoint risk**. Design safe key recovery, account/device revocation and tested backup/restore before enabling encrypted records. |
| **Data leaks via telemetry, exception reports, caches, support or CI artifacts** | Customer text can accidentally appear in logs, search indices, exports, URLs, analytics and support screenshots | Tests must use fictional data only; prohibit private client records in public GitHub, Actions and demo. Plan data-minimised telemetry, short retention, redaction and tenant-scoped audit. |
| **Offline sync conflicts / replayed actions** | A delayed offline instruction can send a duplicate invoice or override a newer approval | Offline-first sync needs authenticated conflict resolution, idempotency keys, approval-bound versions, replay protection and explicit status. No sync exists yet. |
| **Malicious dependencies / service-worker cache persistence** | A hijacked dependency or persistent injected offline bundle can survive a page refresh | Lab has no third-party runtime libraries or service worker. If added: strict CSP, reviewed pinned dependencies, reproducible builds and explicit cache/update/rollback design. |

## Layered architecture before real clients

1. **Identity boundary:** Passkeys/MFA, limited admin accounts, account recovery and revocation; no shared admin logins.
2. **Authorisation boundary:** Every API, query, attachment, export, search and background job checks authenticated identity, business membership and object ownership on the trusted server; deny by default.
3. **Data boundary:** Minimise fields; TLS; encrypted storage/backups; isolated, rotated keys; explicit retention/deletion and export; scoped privacy-safe logs; secure recovery. Browser encryption requires an audited key-management design.
4. **Action boundary:** No action solely because an AI “approved” it. Require an independent deterministic policy engine, clear user confirmation of exactly what will happen, narrow scopes, rate limits, idempotency and post-action audit. For payments/refunds/erasure, use stronger confirmation.
5. **Supply-chain boundary:** Branch protection, independent human review, pinned CI steps, no CI production credentials for untrusted PRs, automated dependency/secret checks, incident playbook and independent security review.
6. **Operational boundary:** Threat-based alerts for unusual exports, login changes, cross-tenant access attempts, payment/permission changes; tested restore, incident notification and kill switches.

## Verify before deployment to real customers

- [ ] A competent independent reviewer tests authentication, authorisation and cross-tenant access against OWASP ASVS; demonstrate that changing object/tenant IDs **never** grants access.
- [ ] A separate test user/account is unable to read, search, restore or export another fictional tenant's data, including via logs, backups, attachments and AI retrieval.
- [ ] GitHub repository admins use passkeys/MFA; branch rules require at least one independent approval and refreshed passing tests without trapping the sole maintainer in an impossible workflow.
- [ ] No real client data is stored in public demos, source control, PR discussions, CI logs, build artifacts or third-party model providers without a legal and technical basis.
- [ ] Credentials and encryption keys are not present in distributed HTML/JavaScript. Verify revocation and response to stolen tokens.
- [ ] Test CSV exports in intended spreadsheet applications, including after save/reopen; account for their differing formula handling.
- [ ] Build threat-based simulations: malicious enquiry/document instructions, tampered download, poisoned integration response, device theft, revoked employee access, offline replay, denial of service and restore.
- [ ] Arrange independent penetration testing, privacy assessment and GDPR data-processing agreements before onboarding businesses.
- [ ] Build an incident plan: ownership, isolation, preservation, backup recovery, customer communication and regulatory assessment.

## References

- [OWASP ASVS 5.0 — Authorization, including cross-tenant restrictions](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x17-V8-Authorization.md)
- [OWASP LLM security project — prompt injection and excessive agency](https://owasp.github.io/www-project-top-10-for-large-language-model-applications/)
- [OWASP CSV injection](https://community.owasp.org/attacks/CSV_Injection)
- [GitHub — Secure use of GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use)

**Status:** Security requirements and targeted demo regression guards are useful preparation, **not** proof of immunity to attack. Future customer-data and AI-service architecture requires separate design and approval.
