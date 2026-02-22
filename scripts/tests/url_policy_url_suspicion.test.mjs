import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isDeniedFinalHost,
  matchDeniedFinalUrlPattern,
} from '../lib/url_policy.mjs';

import { classifyFinalUrl } from '../lib/url_suspicion.mjs';

test('url_policy: dot-tech and dot-attorney are denied final hosts', () => {
  assert.equal(isDeniedFinalHost('dot-tech.org'), true);
  assert.equal(isDeniedFinalHost('www.dot-tech.org'), true);
  assert.equal(isDeniedFinalHost('dot-attorney.org'), true);
  assert.equal(isDeniedFinalHost('www.dot-attorney.org'), true);
});

test('url_policy: denied final URL patterns are detected', () => {
  assert.equal(matchDeniedFinalUrlPattern('https://example.com/domain-for-sale'), 'final_url_matches_denied_pattern');
  assert.equal(matchDeniedFinalUrlPattern('https://dan.com/buy-domain/example.com'), 'final_url_matches_denied_pattern');
  assert.equal(matchDeniedFinalUrlPattern('https://sedo.com/search/details/example-com'), 'final_url_matches_denied_pattern');
});

test('url_suspicion: domain-for-sale URL is deny', () => {
  const r = classifyFinalUrl({ finalUrl: 'https://example.com/domain-for-sale' });
  assert.equal(r.verdict, 'deny');
  assert.ok(r.reasons.includes('final_url_matches_denied_pattern'));
  assert.ok(r.reasons.includes('redirected_to_parking_or_domain_sale'));
});

test('url_suspicion: parking provider is deny', () => {
  const r = classifyFinalUrl({ finalUrl: 'https://dan.com/buy-domain/xxx' });
  assert.equal(r.verdict, 'deny');
  assert.ok(r.reasons.includes('final_host_parking_provider'));
  assert.ok(r.reasons.includes('redirected_to_parking_or_domain_sale'));
});

test('url_suspicion: content-hub style URL is review', () => {
  const r = classifyFinalUrl({ finalUrl: 'https://somehub.com/blog/tool-x' });
  assert.equal(r.verdict, 'review');
  assert.ok(r.reasons.includes('final_url_suspicious_content_hub'));
});

test('url_suspicion: normal product URL is allow', () => {
  const r = classifyFinalUrl({ finalUrl: 'https://snorkel.ai/' });
  assert.equal(r.verdict, 'allow');
  assert.equal(r.reasons.length, 0);
});

