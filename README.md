# OIC Marketing & Analytics Dashboard

A comprehensive digital dashboard designed for OIC (encompassing OIC Spa and OIC Gym) to track and analyze marketing efforts, public relations, content strategies, and multi-outlet performance.

## Modules

### Built

1. **Meta Ads & AI** (`ads.html`) — upload a Meta Ads CSV/XLSX export or pull from a
   Google Sheet, then filter by campaign / ad set / ad and date range. Shows spend,
   impressions, CTR and CPC, a day-to-day trend chart, and breakdown charts for
   platform, placement and demographics where the export contains those columns.
   Includes a Gemini-backed chat for data-quality questions, a reporting view with
   per-campaign aggregation, an AI executive summary, and PDF export.

### Planned (hub cards are placeholders, not yet implemented)

2. **PR & Exposure** — PR cost vs earned media value, sentiment, and an exposure
   tracker for media and influencers. Reach estimation groundwork lives in
   `tools/calibrate-reach.js`.
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
- **CSS3**: Custom styling with `Inter` for UI and `Marcellus` for headings.
- **JavaScript**: App logic and interactivity.
- **Chart.js**: Dynamic data visualization.
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

## Known limitations

- The PIN on the login screen is a client-side speed bump, not authentication.
  The value is readable in devtools and in this repo. Do not put anything
  sensitive behind it.
- Pushing to the sheet uses a `no-cors` request, so the browser cannot read the
  response. The app reports rows as *sent*, not *saved* — confirm in the sheet.

## Deployment

The project includes a `vercel.json` configuration file, making it ready for instant deployment on [Vercel](https://vercel.com/).
