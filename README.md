# OIC Marketing & Analytics Dashboard

A comprehensive digital dashboard for Odilia Infinity Corporation (OIC) — covering the Annathaya, Odilia, Nirvaya, Square Gym, and Odelique brands — to track and analyze marketing efforts, public relations, content strategies, and multi-outlet performance.

## Modules

### Built

1. **Meta Ads** (`ads.html`) — upload Meta Ads CSV/XLSX exports (several at once)
   or pull from a Google Sheet, then filter by campaign / ad set / ad and date
   range. Shows spend, impressions, CTR and CPC, a day-to-day trend chart, and
   breakdown charts for platform, placement and demographics where the export
   contains those columns. Reporting view aggregates per campaign and exports PDF,
   with an optional Gemini executive summary.

   **Uploads accumulate.** Each upload merges into the shared dataset rather than
   replacing it, so the team can add one export per week and keep the history.
   Rows are identified by `campaign + ad set + ad + day`, so re-uploading an
   overlapping period updates those rows instead of appending duplicates — without
   that, spend would silently double. The panel reports how many rows were added
   versus updated after each file.

   Parsing and cleaning are fully deterministic (SheetJS): the real header row is
   detected — Meta prefixes exports with title rows — and `TOTAL` summary rows are
   dropped. No AI is involved in reading your files.

2. **PR & Exposure** (`pr.html`) — paste a news URL and get an estimated article
   reach and earned media value. Two tabs:
   - *PR Tracker* — log coverage (URL, headline, brand, placement, sentiment,
     PR cost), see KPIs (coverage, est. reach, EMV, PR ROI), monthly trend,
     sentiment split and top outlets. Sentiment can be auto-rated from the
     headline with Gemini.
   - *News Directory* — the searchable database of past coverage, with
     brand/sentiment filters, XLSX export, bulk import from a spreadsheet
     (loads historical news in one go), and optional Google Sheet push/pull.

   **How reach is estimated:** the outlet's monthly visits come from a verified
   published figure when we have one, otherwise from a rank-to-traffic curve
   (`log10(visits) = a − b·log10(rank)`) against free rank data from
   `api.webrank.top` (no API key, CORS-open). Article views are then
   `visits × article-share% (tier-scaled) × placement multiplier`, and
   `EMV = views ÷ 1000 × CPM` (CPM and share are configurable in-app). Every
   figure is labelled with its basis — Verified, Reported (outlet-supplied),
   Estimated, or Unestimated — and estimates should be read as
   order-of-magnitude. Domain lookups are cached locally for 7 days.

### Planned (hub cards are placeholders, not yet implemented)

3. **Content Planning** — trend radar, strategy mix, content calendar.
4. **Multi-Outlet Report** — regional performance and outlet rankings.

## Reach calibration (`tools/calibrate-reach.js`)

Estimating how many people saw a news article means estimating the outlet's
traffic — no free API returns real visitor counts. The script fits
`log10(visits) = a - b * log10(rank)` against every rank signal from
`api.webrank.top` and reports which one actually tracks traffic, rejecting
signals whose apparent fit is an artifact of coarse bucketing.

```bash
node tools/calibrate-reach.js
```

Add verified `(domain, monthly visits)` pairs to the `ANCHORS` array and re-run.
The committed defaults are only enough to establish the shape of the curve —
treat the output as order-of-magnitude until there are roughly ten anchors.

## Tech Stack

- **HTML5**: Semantic structure.
- **CSS3**: Clean light theme — warm off-white background, white cards, `Plus Jakarta Sans` throughout, OIC brown as the accent color. Design tokens live in `:root` in `css/style.css`. (Class names like `.glass-card` are legacy from the earlier glassmorphism skin.)
- **JavaScript**: App logic and interactivity.
- **Chart.js**: Dynamic data visualization.
- **Supabase (UMD SDK)**: shared team auth + live-synced Postgres storage,
  loaded from the CDN — still no build step.
- **FontAwesome**: Scalable vector icons.

## Getting Started

To run this project locally, simply clone the repository and open the `index.html` file in your preferred web browser. 

```bash
git clone https://github.com/socmed-oic/OIC-Digital-App.git
```

Open `index.html` in your browser. Alternatively, if you use a code editor like VS Code, you can use the Live Server extension.

## Configuration

Both settings live in `localStorage` and are entered in the app under
"Processor Configuration" on the Ads page — nothing is committed to the repo:

- **Gemini API key** — required for the AI chat and executive summary. The model
  id is `GEMINI_MODEL` at the top of the dashboard block in `js/app.js`; check it
  against the current Gemini model list if requests start failing.
- **Google Apps Script webhook URL** — required for master-data sync. Deploy the
  Apps Script as a Web App with "Who has access" set to **Anyone**.

## Auth & team data (Supabase)

Setup lives in [`supabase/schema.sql`](supabase/schema.sql) — run it once in the
Supabase SQL Editor. It creates the tables, enables Row Level Security, and adds
the tables to the realtime publication.

- **Sign-in**: the 6-digit team PIN is the password of one shared Supabase Auth
  account (`team@oic-digital.app`), verified server-side. It does not appear in
  this repository. Rotate it by changing the account password in the Supabase
  dashboard. **Signups must be disabled** — otherwise anyone could register and
  satisfy the RLS policies.
- **Team cloud**: news/PR records (`pr_articles`), the shared estimation config
  (`app_config`), and the current ads dataset (`ads_datasets`) live in Postgres
  with realtime sync — teammates see each other's changes within seconds.
  Records created before the cloud existed migrate from `localStorage`
  automatically on first load.
- The anon key in `js/supabase-init.js` is public by design — it only identifies
  the project. **RLS is the actual protection.** The `service_role` key and the
  database password grant unrestricted access and must never appear in this
  repository or anywhere in the client-side app.
- The app uses camelCase, Postgres uses snake_case; `toRow()` / `fromRow()` in
  `js/pr.js` are the only place that translation happens.

## Known limitations

- One shared account means no per-person attribution and a leaked PIN must be
  rotated for the whole team. Per-user Google sign-in is the natural upgrade.
- Pushing to the sheet uses a `no-cors` request, so the browser cannot read the
  response. The app reports rows as *sent*, not *saved* — confirm in the sheet.

## Deployment

The project includes a `vercel.json` configuration file, making it ready for instant deployment on [Vercel](https://vercel.com/).
