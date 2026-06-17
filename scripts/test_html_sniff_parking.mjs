#!/usr/bin/env node
/**
 * test_html_sniff_parking.mjs
 *
 * Smoke tests for scripts/lib/html_sniff_parking.mjs.
 *
 * Run:
 *   node scripts/test_html_sniff_parking.mjs
 *
 * Tests:
 *   1-4: Positive fixture tests (detectParkingInHtml — no HTTP)
 *   5-6: Negative fixture tests (detectParkingInHtml — no HTTP)
 *   7  : Live HTTP test: coda.ai (should be detected — JS redirect to /lander)
 *   8  : Live HTTP test: coda.io (should NOT be detected — legitimate site)
 */

import {
  detectParkingInHtml,
  sniffHtmlParking,
  MIN_CONFIDENCE,
} from './lib/html_sniff_parking.mjs';

let passed = 0;
let failed = 0;

function assert(name, cond, details = '') {
  if (cond) {
    console.log(`  ✓ PASS  ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL  ${name}${details ? `  →  ${details}` : ''}`);
    failed++;
  }
}

// ── Fixture tests: detectParkingInHtml() ─────────────────────────────────────
console.log('\n── Fixture tests (no HTTP) ──────────────────────────────────────────');

// Test 1 — Positive: JS redirect window.location.href="/lander"
// (exact pattern from coda.ai)
{
  const html = '<!DOCTYPE html><html><head><script>window.onload=function(){window.location.href="/lander"}</script></head></html>';
  const r = detectParkingInHtml(html);
  assert('T1: window.location.href="/lander" → detected',    r.detected === true);
  assert('T1: reason = js_parking_lander_detected',          r.reason === 'js_parking_lander_detected');
  assert('T1: confidence ≥ MIN_CONFIDENCE (0.70)',           r.confidence >= MIN_CONFIDENCE);
  assert('T1: evidence label = js_lander',                   r.evidence.includes('js_lander'));
  console.log(`       evidence: "${r.evidence}"`);
}

// Test 2 — Positive: meta http-equiv="refresh" to /lander
{
  const html = '<html><head><meta http-equiv="refresh" content="0; url=/lander"></head></html>';
  const r = detectParkingInHtml(html);
  assert('T2: meta refresh url=/lander → detected',         r.detected === true);
  assert('T2: reason = js_parking_lander_detected',         r.reason === 'js_parking_lander_detected');
  assert('T2: evidence label contains meta',                r.evidence.includes('meta'));
  console.log(`       evidence: "${r.evidence}"`);
}

// Test 3 — Positive: "buy this domain" copy
{
  const html = '<html><body><h1>Buy This Domain</h1><p>This premium domain is for sale.</p></body></html>';
  const r = detectParkingInHtml(html);
  assert('T3: "buy this domain" text → detected',           r.detected === true);
  console.log(`       evidence: "${r.evidence}"`);
}

// Test 4 — Positive: known parking provider name in body
{
  const html = '<html><body><script src="https://cdn.parkingcrew.net/loader.js"></script></body></html>';
  const r = detectParkingInHtml(html);
  assert('T4: parkingcrew in body → detected',              r.detected === true);
  console.log(`       evidence: "${r.evidence}"`);
}

// Test 5 — Negative: legitimate tool page (no parking signals)
{
  const html = [
    '<html><head><title>Notion – Your connected workspace</title></head>',
    '<body><h1>Notion</h1>',
    '<p>Create docs, wikis, and projects together. Collaborative workspace for teams.</p>',
    '<a href="/pricing">Pricing</a><a href="/blog">Blog</a>',
    '</body></html>',
  ].join('');
  const r = detectParkingInHtml(html);
  assert('T5: legit Notion page → NOT detected',            r.detected === false);
}

// Test 6 — Negative: empty / null input
{
  const r1 = detectParkingInHtml('');
  const r2 = detectParkingInHtml(null);
  assert('T6a: empty string → NOT detected',                r1.detected === false);
  assert('T6b: null → NOT detected',                        r2.detected === false);
}

// ── Live HTTP tests: sniffHtmlParking() ──────────────────────────────────────
console.log('\n── Live HTTP tests ──────────────────────────────────────────────────');

// Test 7 — Live positive: coda.ai (JS redirect to /lander)
try {
  const r = await sniffHtmlParking('https://coda.ai/');
  assert('T7: coda.ai HTTP → detected',                     r.detected === true);
  assert('T7: coda.ai → reason = js_parking_lander_detected', r.reason === 'js_parking_lander_detected');
  assert('T7: coda.ai → confidence ≥ MIN_CONFIDENCE',       r.confidence >= MIN_CONFIDENCE);
  console.log(`       evidence: "${r.evidence}"`);
} catch (e) {
  console.log(`  ~ SKIP  T7: coda.ai (network error: ${e.message})`);
}

// Test 8 — Live negative: coda.io (legitimate product page)
try {
  const r = await sniffHtmlParking('https://coda.io/');
  assert('T8: coda.io HTTP → NOT detected',                 r.detected === false);
} catch (e) {
  console.log(`  ~ SKIP  T8: coda.io (network error: ${e.message})`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ────────────────────────────`);
if (failed > 0) {
  console.error('[FAIL] Some tests did not pass.');
  process.exit(1);
} else {
  console.log('[PASS] All tests passed.');
}
