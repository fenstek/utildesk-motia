import fs from "node:fs";
import process from "node:process";
import { google } from "googleapis";

/**
 * ФИКСИРОВАННЫЕ НАСТРОЙКИ (уже заполнены)
 */
const SPREADSHEET_ID = "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = "Tabellenblatt1";

/**
 * Путь к JSON ключу сервисного аккаунта
 */
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";

/**
 * Получаем букву колонки status
 */
async function getStatusColumnLetter(sheets) {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1`,
  });

  const header = (headerRes.data.values?.[0] || []).map((h) =>
    String(h).trim()
  );

  const statusColIndex = header.indexOf("status");
  if (statusColIndex === -1) {
    throw new Error('Колонка "status" не найдена');
  }

  // A, B, C, ...
  return String.fromCharCode("A".charCodeAt(0) + statusColIndex);
}

async function main() {
  const row = Number(process.argv[2]);
  const newStatus = String(process.argv[3] || "").trim();

  if (!row || row < 2) {
    console.error("Использование:");
    console.error("node sheet_set_status.mjs <row_number> <STATUS>");
    console.error("Пример: node sheet_set_status.mjs 3 DONE");
    process.exit(1);
  }

  if (!newStatus) {
    console.error("STATUS не задан (DONE / ERROR / IN_PROGRESS / NEW)");
    process.exit(1);
  }

  if (!fs.existsSync(SA_JSON_PATH)) {
    throw new Error(`Файл ключа не найден: ${SA_JSON_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const colLetter = await getStatusColumnLetter(sheets);
  const cell = `${SHEET_NAME}!${colLetter}${row}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: cell,
    valueInputOption: "RAW",
    requestBody: {
      values: [[newStatus]],
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        updated: {
          cell,
          status: newStatus,
        },
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
