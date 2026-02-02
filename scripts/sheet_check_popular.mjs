import 'dotenv/config';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Tabellenblatt1';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const CHECK = [
  'ChatGPT','Claude','Gemini','Perplexity','Microsoft Copilot','GitHub Copilot',
  'Midjourney','DALL·E','Stable Diffusion','Adobe Firefly','Runway','Pika',
  'ElevenLabs','Suno','Udio','Notion AI','Grammarly','Jasper','Copy.ai','DeepL'
];

function die(msg){ console.error('[ERROR] ' + msg); process.exit(1); }

async function main(){
  if(!SPREADSHEET_ID) die('Missing SPREADSHEET_ID');
  if(!GOOGLE_CLIENT_EMAIL) die('Missing GOOGLE_CLIENT_EMAIL');
  if(!GOOGLE_PRIVATE_KEY) die('Missing GOOGLE_PRIVATE_KEY');

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version:'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:A`,
  });

  const col = (res.data.values || []).slice(1).map(r => String(r[0]||'').trim());
  const set = new Set(col.map(x => x.toLowerCase()));

  const out = CHECK.map(name => ({
    tool: name,
    exists: set.has(name.toLowerCase())
  }));

  console.log(JSON.stringify({ ok:true, checked: out.length, found: out.filter(x=>x.exists).length, items: out }, null, 2));
}

main().catch(e=>die(e.stack||String(e)));
