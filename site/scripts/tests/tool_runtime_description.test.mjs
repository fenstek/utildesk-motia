import assert from "node:assert/strict";
import test from "node:test";
import { runtimeToolDescription } from "../../runtime-src/lib/toolRuntime.ts";

const entry = (markdown, metadata = {}) => ({ markdown, metadata });

test("German runtime descriptions retain frozen static standalone-dash cleaning", () => {
  const description = runtimeToolDescription(entry([
    "# Microsoft Azure Cognitive Services - Text to Speech",
    "",
    "Microsoft Azure Cognitive Services - Text to Speech ist ein Cloud-Dienst.",
  ].join("\n")), "de");
  assert.equal(description, "Microsoft Azure Cognitive Services Text to Speech ist ein Cloud-Dienst.");
});

test("explicit German descriptions remain editorial source text", () => {
  const description = runtimeToolDescription(entry("# Ignored\n\nFallback.", {
    description: "Editorial - punctuation remains.",
  }), "de");
  assert.equal(description, "Editorial - punctuation remains.");
});
