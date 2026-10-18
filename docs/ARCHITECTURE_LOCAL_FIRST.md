# Aerie architecture decision: efficient, secure, decentralised by default

**Status:** Foundational design constraint for future Aerie products (18 October 2026).
**Prototype reality:** Aerie currently has a static public website and a fictional-data, browser-local Lab. This is **not yet** a decentralised customer-data service, authenticated SaaS, or an encrypted storage system.

## The four non-negotiable principles

1. **Data gravity is the customer's choice.** Keep records on the customer's device or under their independently controlled account/instance whenever feasible. No mandatory central Aerie repository of private enquiries, quotes, attachments or model prompts.
2. **Least computation, least movement.** Perform deterministic classification, arithmetic, data formatting and safe draft scaffolding where the data already lives. Send only purpose-limited, consented information to an external AI service if simpler local processing is genuinely inadequate. Default outbound calls for the public Lab: **zero**.
3. **Small, independently enforceable trust boundaries.** Browsers, AI outputs, third-party integrations and stored documents are untrusted. Decisions to access, send, erase or charge belong to authenticated, scoped policy enforcement, *never* a model response or a browser-side flag.
4. **Recovery and portability, not single-provider dependence.** Use versioned open export formats, documented schema, safe backups and, in future, an optional authenticated, end-to-end encrypted sync. Customers must retain a viable export/exit path.

## Proposed data plane / control plane

```text
Customer device / browser                 Optional customer-controlled storage
- local rules / calculations              - encrypted record files + backups
- in-memory review and approval  <---->   - revocable device-level sync keys
- only local non-secret metrics           - isolated instance / account
          |
          | explicit permission and minimum necessary payload
          v
   Optional narrowly scoped connector / AI gateway
   - per-request authorisation and tool allowlists
   - explicit approval for material actions
   - no raw customer prompts in default telemetry
   - customer-selectable provider or customer-hosted instance
```

Aerie can supply software updates, documentation and optional managed operations (control plane) **without automatically becoming the central owner of customers' content (data plane)**. Static website hosting and code updates still create *centralised* risks: compromised publisher keys or served JavaScript can expose decrypted browser data. A future live app needs independent review of update integrity, key recovery, supply-chain isolation and possible installed/offline bundles. This architecture is a target, not a delivered guarantee.

## Default decision policy

| Task | Default execution | Server/model escalation allowed? |
| --- | --- | --- |
| Enquiry keywords, basic priority, quota checks | Local deterministic code, in browser or customer-controlled runtime | No; show human uncertainty when rules are insufficient |
| Arithmetic, quotation drafts, CSV formatting | Local deterministic code | No |
| Complex free-form interpretation | Human review first; possible small local model | Only after explicit opt-in, data minimisation, selected processing region/provider and policy approval |
| Sending email, bookings, payments, data deletion | **Nothing automatic** in prototype | Future integration only with authenticated user, granular scope, idempotency, explicit approval and audit |
| Encrypted sync/backup | Disabled for current public demo | Future opt-in after key lifecycle, tenant isolation and restore are independently tested |

## Efficiency and security budgets (development guards)

- Current browser Lab uses **no third-party runtime packages**, no external AI API, no telemetry and no persistent enquiry histories; its CSP blocks network connections. That is a useful design, not proof against hostile extensions or compromised deployments.
- `tests/local_first_constraints.test.cjs` enforces basic static design guards and maximum **uncompressed source sizes**: Lab JavaScript <= **32 KiB**, and the combined listed public pages + scripts <= **140 KiB**. These are maintainability / network-transfer *proxies*, **not electricity or carbon measurements**.
- As an explicit reviewed expansion for six new working tools, Studio and the original Lab combined are also guarded at **<=64 KiB JavaScript source** and **<=180 KiB total listed uncompressed public assets**. This includes the large embedded homepage artwork; exceeding the guard requires review, not a claim of measured energy.
- Studio Energy handles entered equipment wattage/tariffs and **user-supplied** compute joules/task, not meter-based verification. Its equipment portfolio and Follow-Up review queue remain in memory with fictional CSV exports and no automatic contact or scheduled tasks.
- `tools/measure_demo.cjs` records aggregate asset size, fictional local evaluations, zero external model/action counts and local elapsed runtime. No customer text is retained or published. Timing is machine-dependent, so it is **reported**, not used as a brittle hard failure threshold.
- A meaningful energy claim requires comparable hardware, network measurements, browser profiling, accounting for caching, device CPU, server/AI execution and methodology. Do not call a zero-model-call prototype 'zero-energy' or claim a percentage reduction without measurement.
- Any proposal to add a dependency, analytics script, remote font, persistent server, service worker, telemetry endpoint or automatic AI call requires a documented purpose, data-flow threat assessment, byte/computation budget impact, data-retention policy, permission model and targeted regression tests.

## Security of decentralisation: non-obvious pitfalls

- **XSS / malicious software update:** Decryption on a device does not help if compromised code reads plaintext. CSP, auditable releases, minimum privileges and update controls matter.
- **Lost device or key:** Encryption without verified recovery can be permanent data loss. Plan encrypted backup + recovery with customer choice, not an undocumented master key.
- **Offline replay / conflicts:** Never let delayed sync send a second invoice or apply an obsolete approval. Use version binding and idempotency tokens enforced at destination.
- **Cross-tenant access:** Customer-controlled storage does not excuse weak server-side checks for shared operations. Always authenticate tenant *and* object on each request.
- **Model-driven exfiltration:** An AI reading a malicious customer message cannot be allowed to choose destinations, tool permissions or approval status.
- **Local malware and extensions:** Browser locality alone cannot protect against an already compromised endpoint; clients need device security and revocation.

## Milestones before customer data

1. Keep public Lab **fictional-only** and test supply-chain, CSP, exports, input limits and AI-output boundaries.
2. Define customer-owned portable format and documented retention/deletion.
3. Prototype encrypted local storage with independently reviewed cryptography and recovery; use synthetic data only.
4. Add controlled optional sync with explicit keys and revocation; test offline conflicts, account/tenant isolation, restoration and breach response.
5. Add optional model integration after data minimisation, contractual/privacy review and measured cost/energy comparisons.
6. Independent security and privacy review prior to launching real customer workflows.

See also `docs/SECURITY_THREAT_MODEL.md`. The repository's main branch and deployed website are unaffected by this decision until a reviewed PR is merged.
