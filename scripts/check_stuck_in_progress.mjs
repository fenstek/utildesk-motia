#!/usr/bin/env node
import { google } from 'googleapis';
import fs from 'node:fs';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ';
const SHEET_NAME = 'Tabellenblatt1';

async function main() {
  const credentials = JSON.parse(
    fs.readFileSync('/opt/utildesk-motia/secrets/google-service-account.json', 'utf-8')
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Read all rows
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:Z`,
  });

  const rows = response.data.values || [];
  const inProgress = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const slug = row[0]?.trim();
    const title = row[1]?.trim();
    const status = row[6]?.trim();

    if (status === 'IN_PROGRESS') {
      // Check if MD exists
      const mdPath = `content/tools/${slug}.md`;
      const exists = fs.existsSync(mdPath);
      inProgress.push({ rowNumber, slug, title, exists });
    }
  });

  console.log(`Total rows: ${rows.length}`);
  console.log(`IN_PROGRESS: ${inProgress.length}`);

  if (inProgress.length > 0) {
    console.log('\n=== IN_PROGRESS rows ===');
    inProgress.forEach(r => {
      console.log(`Row ${r.rowNumber}: ${r.slug}`);
      console.log(`  Title: ${r.title?.substring(0, 60)}`);
      console.log(`  MD exists: ${r.exists ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
  } else {
    console.log('\n✅ No IN_PROGRESS rows found!');
  }
}

main().catch(console.error);
