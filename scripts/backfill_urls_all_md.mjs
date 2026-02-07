#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

/**
 * Backfill official_url / affiliate_url into content/tools/*.md
 * Source of truth: Google Sheet (match by slug).
 *
 * Requirements:
 * - service account key at /opt/utildesk-motia/secrets/google-service-account.json
 * - sheet has columns: slug, official_url, affiliate_url
 */

const SPREADSHEET_ID = "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

function parseFrontmatter(md){
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) return { fm:{}, body: md };
  const fmLines = m[1].split("\n");
  const fm = {};
  for(const line of fmLines){
    const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)\s*$/);
    if(mm) fm[mm[1]] = mm[2].replace(/^"(.*)"$/,"$1");
  }
  return { fm, body: md.slice(m[0].length) };
}

function buildFrontmatter(fm){
  const order = ["slug","title","category","price_model","tags","official_url","affiliate_url"];
  const keys = new Set(Object.keys(fm));
  const lines = ["---"];
  for(const k of order){
    if(fm[k] !== undefined){
      // tags may be array-like already (e.g. [ai, audio]) -> keep as-is if it looks like []
      if (k === "tags" && typeof fm[k] === "string" && fm[k].trim().startsWith("[") && fm[k].trim().endsWith("]")) {
        lines.push(`${k}: ${fm[k]}`);
      } else {
        lines.push(`${k}: "${String(fm[k]).replace(/"/g,'\\"')}"`);
      }
      keys.delete(k);
    }
  }
  for(const k of Array.from(keys)){
    lines.push(`${k}: "${String(fm[k]).replace(/"/g,'\\"')}"`);
  }
  lines.push("---\n");
  return lines.join("\n");
}

async function loadSheetMap(){
  if (!fs.existsSync(SA_JSON_PATH)) {
    throw new Error(`Service account key not found: ${SA_JSON_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) return new Map();

  const header = values[0].map(h => String(h || "").trim());
  const idx = Object.fromEntries(header.map((h,i)=>[h,i]));

  if (!("slug" in idx)) throw new Error('Sheet missing column "slug"');
  if (!("official_url" in idx)) throw new Error('Sheet missing column "official_url"');
  // affiliate_url optional; if missing we will fallback to official_url
  const hasAffiliate = ("affiliate_url" in idx);

  const m = new Map();
  for (const r of values.slice(1)) {
    const slug = String(r[idx.slug] || "").trim();
    if (!slug) continue;
    const official_url = String(r[idx.official_url] || "").trim();
    const affiliate_url = hasAffiliate ? String(r[idx.affiliate_url] || "").trim() : "";
    m.set(slug, {
      official_url,
      affiliate_url: affiliate_url || official_url,
    });
  }
  return m;
}

async function main(){
  const sheetMap = await loadSheetMap();

  const toolsDir = path.join(process.cwd(), "content", "tools");
  const files = fs.readdirSync(toolsDir).filter(f => f.endsWith(".md") && !f.startsWith("_"));

  let updated = 0;
  let checked = 0;

  for (const f of files){
    const fp = path.join(toolsDir, f);
    const md = fs.readFileSync(fp, "utf8");
    const { fm, body } = parseFrontmatter(md);
    const slug = (fm.slug || "").trim() || f.replace(/\.md$/,"");

    checked++;

    const rec = sheetMap.get(slug);
    if (!rec) continue;

    const curOfficial = (fm.official_url || "").trim();
    const curAffiliate = (fm.affiliate_url || "").trim();

    const newOfficial = rec.official_url || "";
    const newAffiliate = (rec.affiliate_url || "").trim() || newOfficial;

    // If sheet has no official url, don't overwrite anything
    if (!newOfficial) continue;

    // Update if different (Sheet is source of truth)
    let changed = false;

    if (newOfficial && newOfficial !== curOfficial) {
      fm.official_url = newOfficial;
      changed = true;
    }

    // keep affiliate aligned as well (sheet provides affiliate or falls back to official)
    if (newAffiliate && newAffiliate !== curAffiliate) {
      fm.affiliate_url = newAffiliate;
      changed = true;
    }

    if (!changed) continue;

    const out = buildFrontmatter(fm) + body.trim() + "\n";
    fs.writeFileSync(fp, out, "utf8");
    updated++;
  }

  console.log(JSON.stringify({ ok:true, checked, updated }, null, 2));
}

main().catch(err => {
  console.error("ERROR:", err?.stack || String(err));
  process.exit(1);
});
