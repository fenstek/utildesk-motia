#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import path from "node:path";

const TOOL_JSON = process.argv[2];
if (!TOOL_JSON) {
  console.error("Usage: node finalize_md.mjs </tmp/utildesk_current_tool.json>");
  process.exit(1);
}

if (!fs.existsSync(TOOL_JSON)) {
  console.error("Tool JSON not found:", TOOL_JSON);
  process.exit(1);
}

function readJson(p){
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function extractQid(notes=''){
  const m = String(notes).match(/qid=(Q\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

async function fetchWikidataOfficialWebsite(qid){
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const res = await fetch(url, { headers: { "accept":"application/json" } });
  if(!res.ok) return null;
  const j = await res.json();
  const e = j?.entities?.[qid];
  const p856 = e?.claims?.P856;
  if (!Array.isArray(p856) || !p856[0]) return null;
  const v = p856[0]?.mainsnak?.datavalue?.value;
  if (typeof v === "string" && v.startsWith("http")) return v;
  return null;
}

function upsertFrontmatter(md, kv){
  // Very small frontmatter parser/upserter.
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) {
    // create frontmatter
    const lines = ["---"];
    for (const [k,v] of Object.entries(kv)){
      if (v === null || v === undefined || String(v).trim()==="") continue;
      lines.push(`${k}: "${String(v).replace(/"/g,'\\"')}"`);
    }
    lines.push("---\n");
    return lines.join("\n") + md;
  }

  const fmBody = fmMatch[1];
  const rest = md.slice(fmMatch[0].length);
  const map = new Map();

  for (const line of fmBody.split("\n")){
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)\s*$/);
    if (m) map.set(m[1], m[2]);
  }

  // set / overwrite keys
  for (const [k,v] of Object.entries(kv)){
    if (v === null || v === undefined || String(v).trim()==="") continue;
    map.set(k, `"${String(v).replace(/"/g,'\\"')}"`);
  }

  const outLines = [];
  // keep stable order: slug,title,category,price_model,tags,official_url,affiliate_url then rest
  const preferred = ["slug","title","category","price_model","tags","official_url","affiliate_url"];
  const seen = new Set();

  for (const k of preferred){
    if (map.has(k)){
      outLines.push(`${k}: ${map.get(k)}`);
      seen.add(k);
    }
  }
  for (const [k,v] of map.entries()){
    if (seen.has(k)) continue;
    outLines.push(`${k}: ${v}`);
  }

  return `---\n${outLines.join("\n")}\n---\n` + rest;
}

(async () => {
  const tool = readJson(TOOL_JSON);
  const slug = tool?.slug;
  if (!slug) {
    console.error("TOOL_JSON missing slug");
    process.exit(1);
  }

  const mdPath = path.join(process.cwd(), "content", "tools", `${slug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error("MD file not found:", mdPath);
    process.exit(1);
  }

  // Determine official_url
  let official_url = tool.official_url || "";
  if (!official_url) {
    const qid = extractQid(tool.notes || "");
    if (qid) {
      const fromWd = await fetchWikidataOfficialWebsite(qid);
      if (fromWd) official_url = fromWd;
    }
  }

  // Affiliate fallback: if empty -> official
  let affiliate_url = (tool.affiliate_url || "").trim();
  // Load MD
  let md = fs.readFileSync(mdPath, "utf8");

  // Upsert frontmatter urls so UI can read them
  md = upsertFrontmatter(md, { official_url, affiliate_url });

  // Remove handlebars blocks
  md = md.replace(/{{#if[^}]*}}/g, "");
  md = md.replace(/{{\/if}}/g, "");

  // Replace AFFILIATE placeholder or remove the whole line
  if (affiliate_url) {
    md = md.replace(/{{AFFILIATE_URL}}/g, affiliate_url);
  } else {
    md = md.replace(/^.*{{AFFILIATE_URL}}.*$/gm, "");
    // also remove a "Zum Anbieter:" line if it exists without placeholder
    md = md.replace(/^.*Zum Anbieter:.*$/gmi, "");
  }

  // Remove any remaining {{...}}
  md = md.replace(/{{[^}]+}}/g, "");

  // Clean extra blank lines
  md = md.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  fs.writeFileSync(mdPath, md, "utf8");

  // Also persist urls back into TOOL_JSON for downstream steps if needed
  tool.official_url = official_url || tool.official_url || "";
  tool.affiliate_url = affiliate_url || tool.affiliate_url || "";
  fs.writeFileSync(TOOL_JSON, JSON.stringify(tool, null, 2) + "\n", "utf8");

  console.log(JSON.stringify({
    ok: true,
    mdPath,
    official_url: tool.official_url || "",
    affiliate_url: tool.affiliate_url || "",
  }, null, 2));
})().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
