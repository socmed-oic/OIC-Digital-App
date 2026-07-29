#!/usr/bin/env node
/**
 * Reach calibration for the PR & Exposure module.
 *
 * Fits  log10(monthly_visits) = a - b * log10(rank)  for every rank signal
 * exposed by api.webrank.top, and reports which one actually predicts traffic.
 *
 * Usage:  node tools/calibrate-reach.js
 *
 * To improve the model: add verified (domain, monthly visits) pairs to ANCHORS
 * below and re-run. Three anchors is the bare minimum; ten spread across two
 * orders of magnitude is where the numbers start being worth trusting.
 * Record where each figure came from and when — they go stale.
 */

// ---------------------------------------------------------------------------
// ANCHORS — replace these with figures you have verified yourself.
// The defaults are published Similarweb figures from Nov 2024 and are only
// good enough to establish the shape of the curve, not its absolute level.
// ---------------------------------------------------------------------------
const ANCHORS = [
  { domain: 'kompas.com',       visits:  90_500_000, source: 'Similarweb, Nov 2024' },
  { domain: 'tribunnews.com',   visits: 117_100_000, source: 'Similarweb, Nov 2024' },
  { domain: 'liputan6.com',     visits:  59_100_000, source: 'Similarweb, Nov 2024' },
  { domain: 'cnnindonesia.com', visits:  53_300_000, source: 'Similarweb, Nov 2024' },
  { domain: 'kumparan.com',     visits:  48_000_000, source: 'Similarweb, Nov 2024' },
];

const SIGNALS = ['webrank', 'commoncrawl', 'crux', 'hostio', 'majestic', 'openpagerank', 'radar', 'tranco', 'umbrella'];

/** Least-squares fit on log-log axes. Returns null if the data can't support a fit. */
function fit(points) {
  const n = points.length;
  if (n < 3) return null;

  const xs = points.map(p => Math.log10(p.x));
  const ys = points.map(p => Math.log10(p.y));
  const distinctX = new Set(xs).size;

  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;

  const slope = num / den;
  const intercept = meanY - slope * meanX;

  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - (intercept + slope * xs[i])) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }

  const errors = points
    .map((p, i) => Math.abs(10 ** (intercept + slope * xs[i]) / p.y - 1) * 100)
    .sort((p, q) => p - q);

  return {
    a: intercept,
    b: -slope,
    r2: ssTot === 0 ? NaN : 1 - ssRes / ssTot,
    medApe: errors[Math.floor(errors.length / 2)],
    n,
    distinctX,
  };
}

async function lookup(domain) {
  const res = await fetch(`https://api.webrank.top/rank/${domain}`);
  if (!res.ok) throw new Error(`${domain}: HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log('Fetching current ranks...\n');

  const ranks = {};
  for (const anchor of ANCHORS) {
    ranks[anchor.domain] = await lookup(anchor.domain);
    console.log(`  ${anchor.domain.padEnd(20)} webrank=${String(ranks[anchor.domain].webrank).padStart(7)}`);
  }

  const results = [];
  for (const signal of SIGNALS) {
    const points = [];
    for (const anchor of ANCHORS) {
      const record = ranks[anchor.domain];
      const value = signal === 'webrank' ? record.webrank : record.ranks?.[signal];
      if (value > 0) points.push({ x: value, y: anchor.visits });
    }
    const f = fit(points);
    if (f) results.push({ signal, ...f });
  }

  // A high R^2 means nothing if the signal only takes two or three distinct
  // values across the anchor set — that is a bucketed signal fitting a straight
  // line through its own buckets, not evidence the signal tracks traffic.
  results.sort((p, q) => q.r2 - p.r2);

  console.log('\n=== SIGNAL COMPARISON ===');
  console.log(
    'signal'.padEnd(14), 'R^2'.padStart(7), 'exponent'.padStart(9),
    'medAPE'.padStart(7), 'distinct x'.padStart(11), '  usable?'
  );

  for (const r of results) {
    const usable = r.distinctX >= r.n ? 'yes' : `NO - only ${r.distinctX} buckets`;
    console.log(
      r.signal.padEnd(14),
      r.r2.toFixed(3).padStart(7),
      r.b.toFixed(3).padStart(9),
      (r.medApe.toFixed(0) + '%').padStart(7),
      String(r.distinctX).padStart(11),
      '  ' + usable
    );
  }

  const best = results.find(r => r.distinctX >= r.n);
  if (!best) {
    console.log('\nNo signal has enough distinct values to fit. Add more anchors.');
    return;
  }

  console.log(`\n=== RECOMMENDED: ${best.signal} ===`);
  console.log(`log10(visits) = ${best.a.toFixed(4)} - ${best.b.toFixed(4)} * log10(${best.signal})`);
  console.log(`R^2 = ${best.r2.toFixed(3)}   median error = ${best.medApe.toFixed(0)}%   n = ${best.n}`);
  console.log('\nPaste into js/app.js:');
  console.log(`  const REACH_CURVE = { signal: '${best.signal}', a: ${best.a.toFixed(4)}, b: ${best.b.toFixed(4)} };`);

  if (best.n < 8) {
    console.log(`\nWARNING: ${best.n} anchors is too few to trust the absolute numbers.`);
    console.log('Treat output as order-of-magnitude until you have ~10 anchors.');
  }
}

main().catch(err => {
  console.error('Calibration failed:', err.message);
  process.exit(1);
});
