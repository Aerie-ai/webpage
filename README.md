# Aerie — privacy-first business tools (experimental)

Aerie is an early-stage, sustainability-minded business automation project for independent businesses. The site uses the approved navy, maroon, sunset and mountain/nest branding.

**Current status:** Public demonstration code is ready, but the repository's GitHub Pages hosting must be enabled separately. The demo uses entirely fictional customer examples.

## Try Aerie in your browser

Once GitHub Pages is enabled, these will be the site addresses:

- **Homepage:** https://aerie-ai.github.io/webpage/
- **Interactive Aerie Lab:** https://aerie-ai.github.io/webpage/pilot/
- **Quotation builder:** https://aerie-ai.github.io/webpage/pilot/#quote
- **Enquiry analyser:** https://aerie-ai.github.io/webpage/pilot/#enquiries

### First-time publishing step (repository owner)

1. Open **[Settings → Pages](https://github.com/Aerie-ai/webpage/settings/pages)**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/(root)**.
4. Select **Save** and wait for GitHub Pages to finish publishing.
5. Reopen the above site links. Publishing can take a few minutes.

**Do not use a private client dataset here.** The repository is public; the site is static and the Lab is a fictional-data demonstration, not a production service.

If you have not enabled Pages, you can still download the repository ZIP using GitHub's Code → Download ZIP menu and open `index.html` in a browser. Its Lab links work within the extracted folder.

## What is actually available?

| Component | Current stage |
| --- | --- |
| Main website | Static, mobile-responsive, branded page |
| Aerie Lab enquiry analysis | Browser-local keyword rules and synthetic examples |
| Draft review | Edit, mark approved/rejected locally; **nothing gets sent** |
| Quote Ready | Internal, fictional calculator with CSV export |
| Original spreadsheet | `Job_Quote_Calculator_DEMO.xlsx` (downloadable demo) |
| Python enquiry agent | Offline rules-based demonstration, not a production backend |
| AI language model | Optional loopback adapter in `agent/local_model.py`, **not connected** |
| Live enquiries, messaging, payments, bookings | **Not enabled** |
| Follow-Up Assistant | Planned, not implemented |

Aerie's sustainability approach is to do simple operations locally when they are sufficient, rather than defaulting to expensive model inference. We **have not measured actual energy use or carbon emissions**, and we make no carbon-neutrality claim.

## How development is validated

GitHub Actions workflow: `.github/workflows/aerie-demo.yml`. The required `test-demo` check runs Python unit tests, Node tests for the Lab and website, and a fictional-client acceptance suite. It produces a review artifact (JSON and HTML reports) using synthetic inputs.

Local commands for developers (not required to use the browser demos):

```bash
python -m unittest discover -s agent -p 'test_*.py' -v
node --test tests/*.test.cjs
python agent/run.py
python agent/mock_client_evaluation.py
```

The repository's **Aerie Rcubed** ruleset protects `main` against force-push and deletion, and requires a pull request plus successful status checks. This is not a substitute for independent security review.

## Privacy and security boundaries

- No passwords, real customer enquiries, banking details or private contact information should be committed to the repository or entered into the public demo.
- The Lab's redaction is **best-effort only**, not comprehensive protection.
- The browser demo does not send messages, make external model calls, store enquiry histories or process payments.
- GitHub Pages provides static file hosting, not the authenticated backend needed for a real service.
- Human approval, robust authentication, encrypted business data storage, privacy documentation, secure deployment and external testing remain prerequisites for genuine client use.

See `docs/MOCK_CLIENT_PILOT.md` and `docs/SERVICES_AND_PRODUCTS.md` for details.
