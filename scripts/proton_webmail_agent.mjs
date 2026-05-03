#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const secretPath = resolve(root, "secrets/proton-affiliate-webmail.env");
const profileDir = resolve(root, "tmp/proton-affiliate-webmail-profile");
const debugDir = resolve(root, "output/playwright");

function parseEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function required(env, key) {
  const value = env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`${key} is missing in ${secretPath}`);
  }
  return String(value).trim();
}

async function firstVisible(page, selectors, timeout = 20000) {
  const deadline = Date.now() + timeout;
  let lastError = null;
  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      try {
        if ((await locator.count()) > 0 && (await locator.isVisible())) {
          return locator;
        }
      } catch (error) {
        lastError = error;
      }
    }
    await page.waitForTimeout(300);
  }
  throw lastError || new Error(`No visible selector found: ${selectors.join(", ")}`);
}

async function clickByRoleOrSelector(page, role, names, selectors, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const name of names) {
      const locator = page.getByRole(role, { name }).first();
      try {
        if ((await locator.count()) > 0 && (await locator.isVisible())) {
          await locator.click();
          return true;
        }
      } catch {
        // Try the next candidate.
      }
    }
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      try {
        if ((await locator.count()) > 0 && (await locator.isVisible())) {
          await locator.click();
          return true;
        }
      } catch {
        // Try the next candidate.
      }
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function isMailboxOpen(page) {
  const loggedInSignals = [
    'button:has-text("New message")',
    'button:has-text("Neue Nachricht")',
    'button:has-text("Compose")',
    'button:has-text("Verfassen")',
    '[data-testid="sidebar:compose"]',
  ];
  for (const selector of loggedInSignals) {
    const locator = page.locator(selector).first();
    try {
      if ((await locator.count()) > 0 && (await locator.isVisible())) return true;
    } catch {
      // Try the next signal.
    }
  }
  return false;
}

async function loginIfNeeded(page, env) {
  const url = required(env, "PROTON_WEBMAIL_URL");
  const user = required(env, "PROTON_WEBMAIL_USER");
  const password = required(env, "PROTON_WEBMAIL_PASSWORD");

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  if (await isMailboxOpen(page)) return;

  const username = await firstVisible(page, [
    'input[name="username"]',
    'input#username',
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[aria-label*="E-Mail"]',
    'input[aria-label*="Email"]',
  ]);
  await username.fill(user);

  const pass = await firstVisible(page, [
    'input[name="password"]',
    'input#password',
    'input[type="password"]',
    'input[autocomplete="current-password"]',
  ]);
  await pass.fill(password);

  const clicked = await clickByRoleOrSelector(
    page,
    "button",
    [/Anmelden/i, /Sign in/i, /Log in/i],
    ['button[type="submit"]'],
    15000,
  );
  if (!clicked) throw new Error("Could not click Proton sign-in button");

  await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {});
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (await isMailboxOpen(page)) return;
    await page.waitForTimeout(1000);
  }

  const bodyText = await page.locator("body").innerText({ timeout: 10000 }).catch(() => "");
  if (/captcha|two-factor|2fa|authenticator|verification code|bestätigungscode|sicherheitscode|code eingeben/i.test(bodyText)) {
    throw new Error("Proton requires interactive verification/captcha/2FA; stop for manual confirmation");
  }
  if (/incorrect|wrong password|invalid login|falsches passwort|ungültig/i.test(bodyText)) {
    throw new Error("Proton login failed; credentials may be invalid");
  }
  throw new Error("Proton login did not complete; headless browser may be blocked or manual verification may be required");
}

async function sendTestEmail(page, env) {
  const to = required(env, "PROTON_WEBMAIL_USER");
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const subject = `Utildesk Proton test ${stamp}`;
  const body = `Automated Utildesk project mailbox test.\nTimestamp: ${stamp}`;

  const composeClicked = await clickByRoleOrSelector(
    page,
    "button",
    [/New message/i, /Neue Nachricht/i, /Compose/i, /Verfassen/i],
    ['[data-testid="sidebar:compose"]', 'button:has-text("New message")', 'button:has-text("Neue Nachricht")'],
    30000,
  );
  if (!composeClicked) throw new Error("Could not open Proton compose window");

  try {
    const toField = await firstVisible(page, [
      '[data-testid="composer:to"] input',
      '[data-testid="composer:to"] [contenteditable="true"]',
      '[aria-label*="To"][contenteditable="true"]',
      '[aria-label*="An"][contenteditable="true"]',
      'input[placeholder*="Email"]',
      'input[placeholder*="E-Mail"]',
      'input[aria-label*="To"]',
      'input[aria-label*="An"]',
    ], 5000);
    await toField.fill(to);
    await page.keyboard.press("Enter");
  } catch {
    // Proton's recipient widget is custom and often focused automatically.
    await page.keyboard.type(to);
    await page.keyboard.press("Enter");
  }

  const subjectField = await firstVisible(page, [
    'input[placeholder*="Subject"]',
    'input[placeholder*="Betreff"]',
    '[data-testid="composer:subject"]',
    'input[aria-label*="Subject"]',
    'input[aria-label*="Betreff"]',
  ], 30000);
  await subjectField.fill(subject);

  try {
    const bodyField = await firstVisible(page, [
      '[contenteditable="true"][role="textbox"]',
      '[aria-label*="Schreibpanel"]',
      '[aria-label*="Message body"]',
      '[data-testid="composer:body"] [contenteditable="true"]',
      '.composer-content [contenteditable="true"]',
    ], 5000);
    await bodyField.fill(body);
  } catch {
    await page.mouse.click(820, 650);
    await page.keyboard.type(body);
  }

  await page.getByRole("button", { name: /Schließen|Close/i }).first().click({ timeout: 1000 }).catch(() => {});

  const sendClicked = await clickByRoleOrSelector(
    page,
    "button",
    [/Send/i, /Senden/i],
    ['[data-testid="composer:send-button"]', 'button:has-text("Send")', 'button:has-text("Senden")'],
    30000,
  );
  if (!sendClicked) throw new Error("Could not click Proton send button");

  await page.waitForTimeout(8000);
  return { to, subject };
}

async function verifyMailVisible(page, subject) {
  await page.goto("https://mail.proton.me/u/0/inbox", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);
  const body = await page.locator("body").innerText({ timeout: 20000 }).catch(() => "");
  if (body.includes(subject)) return "inbox";

  await page.goto("https://mail.proton.me/u/0/sent", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);
  const sentBody = await page.locator("body").innerText({ timeout: 20000 }).catch(() => "");
  if (sentBody.includes(subject)) return "sent";

  return "not-found-yet";
}

async function main() {
  const command = process.argv[2] || "send-test";
  if (command !== "send-test") {
    throw new Error(`Unknown command: ${command}`);
  }
  const headed = process.argv.includes("--headed");

  const env = parseEnvFile(secretPath);
  mkdirSync(profileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: !headed,
    viewport: { width: 1440, height: 1000 },
  });
  const page = context.pages()[0] || await context.newPage();

  try {
    await loginIfNeeded(page, env);
    const result = await sendTestEmail(page, env);
    const location = await verifyMailVisible(page, result.subject);
    console.log(JSON.stringify({
      ok: true,
      command,
      toDomain: result.to.split("@")[1],
      subject: result.subject,
      verified: location,
    }, null, 2));
  } catch (error) {
    mkdirSync(debugDir, { recursive: true });
    await page.screenshot({ path: resolve(debugDir, "proton-webmail-error.png"), fullPage: true }).catch(() => {});
    const text = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    writeFileSync(resolve(debugDir, "proton-webmail-error.txt"), text.slice(0, 6000), "utf8");
    throw error;
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error),
  }, null, 2));
  process.exitCode = 1;
});
