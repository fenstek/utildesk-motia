import assert from "node:assert/strict";
import test from "node:test";

import {
  TOOL_REDIRECTS,
  TOOL_TOMBSTONES,
  getToolRouteAction,
} from "../../shared/toolRoutePolicy.mjs";

test("approved merge mappings point from the retired slug to the current canonical brand", () => {
  assert.equal(TOOL_REDIRECTS.appinventor, "mit-app-inventor");
  assert.equal(TOOL_REDIRECTS["hubspot-sales"], "hubspot-sales-hub");
  assert.equal(TOOL_REDIRECTS.luminar, "luminar-neo");
  assert.equal(TOOL_REDIRECTS["tensorflow-keras"], "keras");
});

test("HTML, JSON and Markdown merge routes preserve locale and return 301", () => {
  for (const path of [
    "/tools/appinventor/",
    "/en/tools/appinventor/",
    "/api/tools/appinventor.json",
    "/en/api/tools/appinventor.json",
    "/markdown/tools/appinventor.md",
    "/en/markdown/tools/appinventor.md",
  ]) {
    const action = getToolRouteAction(path);
    assert.equal(action?.type, "redirect", path);
    assert.equal(action?.status, 301, path);
    assert.match(action.target, /mit-app-inventor/);
    assert.equal(action.locale, path.startsWith("/en/") ? "en" : "de");
  }
});

test("tombstones cover both locales and all public tool representations", () => {
  for (const path of [
    "/tools/xamarin/",
    "/en/tools/xamarin/",
    "/api/tools/xamarin.json",
    "/en/api/tools/xamarin.json",
    "/markdown/tools/xamarin.md",
    "/en/markdown/tools/xamarin.md",
  ]) {
    const action = getToolRouteAction(path);
    assert.equal(action?.type, "tombstone", path);
    assert.equal(action?.status, 410, path);
  }
  assert.ok(TOOL_TOMBSTONES.has("adobe-xd"));
  assert.ok(TOOL_TOMBSTONES.has("play-ht"));
});

test("shared ecosystem products remain outside the redirect policy", () => {
  assert.equal(getToolRouteAction("/tools/tensorflow/"), null);
  assert.equal(getToolRouteAction("/tools/keras/"), null);
  assert.equal(getToolRouteAction("/tools/apache-hadoop/"), null);
  assert.equal(getToolRouteAction("/tools/hadoop-mapreduce/"), null);
});
