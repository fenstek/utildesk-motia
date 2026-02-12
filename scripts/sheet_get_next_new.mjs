import fs from "node:fs";
import process from "node:process";
import { google } from "googleapis";

/**
 * НАСТРОЙКА — МЕНЯЕШЬ ТОЛЬКО 2 СТРОКИ НИЖЕ
 */
const SPREADSHEET_ID = "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = "Tabellenblatt1";

/**
 * Путь к JSON ключу сервисного аккаунта
 */
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

/**
 * Ожидаемые колонки в таблице
 */
const EXPECTED_COLUMNS = [
  "topic",
  "slug",
  "category",
  "tags",
  "price_model",
  "official_url",
  "affiliate_url",
  "status",
  "notes",
];
const HARD_REJECT_SLUGS = new Set([
  "this-person-does-not-exist",
]);

function ensureFilled(value, name) {
  if (!value || value.includes("PASTE_")) {
    throw new Error(`Нужно заполнить ${name} в начале файла`);
  }
}

async function updateStatus(sheets, spreadsheetId, sheetName, rowNumber, newStatus) {
  // Найдём колонку "status" в заголовке (первая строка)
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });

  const header = (headerRes.data.values?.[0] || []).map((h) => String(h).trim());
  const statusColIndex = header.indexOf("status");
  if (statusColIndex === -1) {
    throw new Error('Колонка "status" не найдена в заголовке');
  }

  // Переводим индекс в букву колонки (0=A, 1=B, ...)
  const colLetter = String.fromCharCode("A".charCodeAt(0) + statusColIndex);

  // Пример: H3 (если status в колонке H и строка 3)
  const cell = `${sheetName}!${colLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cell,
    valueInputOption: "RAW",
    requestBody: {
      values: [[newStatus]],
    },
  });

  return { cell, newStatus };
}


async function main() {
  ensureFilled(SPREADSHEET_ID, "SPREADSHEET_ID");
  ensureFilled(SHEET_NAME, "SHEET_NAME");

  if (!fs.existsSync(SA_JSON_PATH)) {
    throw new Error(`Файл ключа не найден: ${SA_JSON_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const range = `${SHEET_NAME}!A1:Z`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const values = res.data.values || [];

  if (values.length < 2) {
    console.log(
      JSON.stringify({ ok: true, found: false, reason: "Таблица пуста" }, null, 2)
    );
    return;
  }

  const header = values[0].map((h) => String(h).trim());
  const rows = values.slice(1);

  const index = Object.fromEntries(header.map((h, i) => [h, i]));

  const missing = EXPECTED_COLUMNS.filter((c) => !(c in index));
  if (missing.length) {
    console.log(
      JSON.stringify(
        { ok: false, error: "MISSING_COLUMNS", missing, header },
        null,
        2
      )
    );
    process.exit(1);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const status = String(row[index.status] || "").trim().toUpperCase();
    const slug = String(row[index.slug] || "").trim().toLowerCase();

    if (status === "NEW") {
      if (HARD_REJECT_SLUGS.has(slug)) {
        console.error(`[hard-reject] skip NEW row ${i + 2}: slug=${slug}`);
        continue;
      }
      const result = {
        row_number: i + 2,
        topic: String(row[index.topic] || "").trim(),
        slug: String(row[index.slug] || "").trim(),
        category: String(row[index.category] || "").trim(),
        tags: String(row[index.tags] || "").trim(),
        price_model: String(row[index.price_model] || "").trim(),
        official_url: String(row[index.official_url] || "").trim(),
        affiliate_url: String(row[index.affiliate_url] || "").trim(),
        status: String(row[index.status] || "").trim(),
        notes: String(row[index.notes] || "").trim(),
      };

      const upd = await updateStatus(sheets, SPREADSHEET_ID, SHEET_NAME, result.row_number, "IN_PROGRESS");
console.log(JSON.stringify({ ok: true, found: true, item: result, sheet_update: upd }, null, 2));
return;

    }
  }

  console.log(
    JSON.stringify({ ok: true, found: false, reason: "Нет строк со статусом NEW" }, null, 2)
  );
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
