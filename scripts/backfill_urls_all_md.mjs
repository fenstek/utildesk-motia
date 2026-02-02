#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

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

function parseFrontmatter(md){
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) return { fm:{}, body: md };
  const fmLines = m[1].split("\n");
  const fm = {};
  for(const line of fmLines){
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)\s*$/);
    if(mm) fm[mm[1]] = mm[2].replace(/^"(.*)"$/,"$1");
  }
  return { fm, body: md.slice(m[0].length), rawFm: m[1] };
}

function buildFrontmatter(fm){
  const order = ["slug","title","category","price_model","tags","official_url","affiliate_url"];
  const keys = new Set(Object.keys(fm));
  const lines = ["---"];
  for(const k of order){
    if(fm[k] !== undefined){
      lines.push(`${k}: "${String(fm[k]).replace(/"/g,'\\"')}"`);
      keys.delete(k);
    }
  }
  for(const k of Array.from(keys)){
    lines.push(`${k}: "${String(fm[k]).replace(/"/g,'\\"')}"`);
  }
  lines.push("---\n");
  return lines.join("\n");
}

const toolsDir = path.join(process.cwd(), "content", "tools");
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith(".md") && !f.startsWith("_"));

let updated = 0;

for (const f of files){
  const fp = path.join(toolsDir, f);
  const md = fs.readFileSync(fp, "utf8");
  const { fm, body } = parseFrontmatter(md);

  // already ok?
  if (fm.official_url && fm.affiliate_url) continue;

  // try qid from notes in body (если встречается)
  const qid = extractQid(md);
  let official = fm.official_url || "";
  if (!official && qid){
    official = await fetchWikidataOfficialWebsite(qid) || "";
  }

  // fallback affiliate = official
  let affiliate = fm.affiliate_url || "";
  if (!affiliate && official) affiliate = official;

  // if nothing found, skip
  if (!official && !affiliate) continue;

  fm.official_url = official || fm.official_url || "";
  fm.affiliate_url = affiliate || fm.affiliate_url || "";

  const out = buildFrontmatter(fm) + body.trim() + "\n";
  fs.writeFileSync(fp, out, "utf8");
  updated++;
}

console.log(JSON.stringify({ ok:true, updated }, null, 2));
