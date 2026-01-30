#!/usr/bin/env node
import 'dotenv/config';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

function die(msg){ console.error(`\n[ERROR] ${msg}\n`); process.exit(1); }

async function sheetsClient(){
  if(!SPREADSHEET_ID) die('Missing SPREADSHEET_ID');
  if(!GOOGLE_CLIENT_EMAIL) die('Missing GOOGLE_CLIENT_EMAIL');
  if(!GOOGLE_PRIVATE_KEY) die('Missing GOOGLE_PRIVATE_KEY');
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version:'v4', auth });
}

async function nextEmptyRow(sheets){
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  });
  const vals = res.data.values || [];
  // scan from row 2
  for (let r = 2; r <= vals.length; r++){
    const v = String(vals[r-1]?.[0] ?? '').trim();
    if(!v) return r;
  }
  return vals.length + 1;
}

async function main(){
  const input = process.stdin.read().toString('utf8') || '';
  if(!input.trim()) die('Provide JSON on stdin: {"rows":[[16 cells],...]}');

  let payload;
  try { payload = JSON.parse(input); } catch { die('Invalid JSON input'); }
  const rows = payload.rows;
  if(!Array.isArray(rows) || rows.length===0) die('rows must be non-empty array');
  for(const r of rows){
    if(!Array.isArray(r) || r.length !== 16) die('each row must have exactly 16 cells (A..P)');
  }

  const sheets = await sheetsClient();
  const start = await nextEmptyRow(sheets);

  const data = rows.map((vals, i) => ({
    range: `${SHEET_NAME}!A${start+i}:P${start+i}`,
    values: [vals],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption:'RAW', data },
  });

  console.log(JSON.stringify({ ok:true, written: rows.length, start_row: start }, null, 2));
}

main().catch(e=>die(e.stack||String(e)));
