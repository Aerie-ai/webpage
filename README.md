# Aerie — EXACT preview website for GitHub

This package is a clean copy of the **self-contained Aerie preview that you approved**.

## Contents
- `index.html` — **byte-for-byte identical** to `Aerie_Standalone_Preview.html`. It includes ALL styling, colour and the logo image inside itself.
- `privacy.html` — matching styled notice accurately describing the pre-launch demo.
- `Job_Quote_Calculator_DEMO.xlsx` — example spreadsheet available via the homepage download link.

**No CSS, JavaScript, logo, `public/` folder or build tools are necessary.**

## Test before uploading
1. Extract the ZIP to a normal folder.
2. Open `index.html` with Chrome or Edge. It should look exactly like the standalone preview.
3. Click "Download calculator demo"; it should download the spreadsheet.
4. Click "Privacy notice"; the styled notice should open.

## GitHub setup (repository root)
1. Keep a backup of any previous files if you want them.
2. Place the website files and README at the repository root. The development-only `agent/`, `sample_data/`, `docs/` and `.github/` folders can sit alongside them.
3. Upload the extracted files **not** the ZIP. You should see `index.html` at the top level of the repository; **do not put it into a `public` folder**.
4. Commit the change to `main`.
5. For a public *pre-launch demonstration only*, GitHub Free users may need to make the repository Public and enable **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Do not upload secrets or private code.
6. GitHub Pages cannot run Python agents or accept customer enquiries by itself. This package is a front-end demo, not a functioning commercial SaaS deployment.

IMPORTANT: Verify GitHub Pages usage terms before using the service for an operating commercial SaaS or ecommerce site. Production payment processing, privacy and backend infrastructure remain future tasks.

## Aerie agent: development/test only

The repository also contains a **rules-based, offline enquiry pilot** under `agent/`.

- Workflow: `.github/workflows/aerie-demo.yml`
- Run unit tests: `python -m unittest discover -s agent -p 'test_*.py' -v` (runs on GitHub Actions; no local installation needed)
- Process synthetic enquiries: `python agent/run.py`
- Run fictional customer acceptance tests: `python agent/mock_client_evaluation.py`
- Download the Actions artifact **aerie-review-report** and open `mock_clients_dashboard.html` for an offline demonstration.
- Read `docs/MOCK_CLIENT_PILOT.md` for tested outcomes and `docs/SERVICES_AND_PRODUCTS.md` for the service roadmap.

**Nothing here sends messages, makes appointments, edits customer accounts or makes payments.** The website's enquiry form is deliberately disabled. All output is fictional and requires review. Do not put real customer details into public GitHub repositories or Actions artifacts.
