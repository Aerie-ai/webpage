# Security policy — Aerie prototype

Aerie is an experimental, publicly visible static-site and fictional-data Lab. **It is not yet an authenticated customer-data service.** No real customer credentials, records, payment data or confidential documents should be entered into the public demo, public issues, pull requests, CI logs or the source repository.

## Report a concern responsibly

Please **do not publish** vulnerability details, attack demonstrations, personal information, tokens or secrets in a public GitHub issue.

- If [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) is enabled for this repository, use the private vulnerability-reporting flow under the repository **Security** tab.
- Otherwise, contact the project maintainer privately through an established trusted channel. No public security inbox is currently claimed or guaranteed.
- Provide the affected component and a minimal, non-destructive demonstration using **fictional** information only.
- Do not access other people's accounts, test against third parties, conduct disruptive scanning or exfiltrate data.

Security issues will be assessed case by case; no response-time guarantee is offered for this pre-launch prototype. If real customer information is ever inadvertently exposed, treat it as a potential incident, secure access and assess notification obligations promptly.

## Supported deployment and limits

The current maintained source is the `main` branch and development is reviewed through GitHub pull requests. GitHub Pages hosts a static demo; there is no supported production customer API.

The project's [security threat model](docs/SECURITY_THREAT_MODEL.md) documents existing safeguards, residual risks, and controls required before handling customer information. Passing automated tests is **not** a substitute for security assessment or penetration testing.
