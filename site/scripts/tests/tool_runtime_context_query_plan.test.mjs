import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const migration = readFileSync(
  new URL("../../runtime/migrations/0007_tool_context_lookup_indexes.sql", import.meta.url),
  "utf8",
);
const runtimeSource = readFileSync(
  new URL("../../runtime-src/lib/runtimeContent.ts", import.meta.url),
  "utf8",
);

test("tool context lookup keeps every match branch indexable", () => {
  assert.match(runtimeSource, /queries\.join\("\\nUNION\\n"\)/);
  assert.doesNotMatch(runtimeSource, /conditions\.join\(" OR "\)/);

  const database = new DatabaseSync(":memory:");
  try {
    database.exec(`
      CREATE TABLE content_entries (
        kind TEXT NOT NULL,
        locale TEXT NOT NULL,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        category TEXT,
        price_model TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        route_state TEXT NOT NULL DEFAULT 'active',
        title_match_key TEXT,
        UNIQUE (kind, locale, slug)
      );
      CREATE INDEX idx_content_entries_tool_title_match
        ON content_entries(kind, locale, is_active, route_state, title_match_key);
    `);
    database.exec(migration);

    const insert = database.prepare(`
      INSERT INTO content_entries (
        kind, locale, slug, title, is_active, route_state, title_match_key
      ) VALUES (?, ?, ?, ?, 1, 'active', ?)
    `);
    for (const locale of ["de", "en"]) {
      for (let index = 0; index < 1124; index += 1) {
        insert.run("tool", locale, `tool-${index}`, `Tool ${index}`, String(index));
      }
    }

    const columns = "slug, title, excerpt, metadata_json, category, price_model";
    const baseWhere = "kind = 'tool' AND locale = ? AND is_active = 1 AND route_state = 'active'";
    const sql = `
      SELECT ${columns}
      FROM (
        SELECT ${columns} FROM content_entries
          WHERE ${baseWhere} AND slug IN (?, ?, ?, ?, ?)
        UNION
        SELECT ${columns} FROM content_entries
          WHERE ${baseWhere}
            AND lower(title) IN (SELECT lower(value) FROM json_each(?))
        UNION
        SELECT ${columns} FROM content_entries
          WHERE ${baseWhere}
            AND title_match_key IN (SELECT value FROM json_each(?))
      )
      ORDER BY title ASC
    `;
    const params = [
      "de",
      "tool-1",
      "tool-2",
      "tool-3",
      "tool-4",
      "tool-5",
      "de",
      JSON.stringify(["Tool 1"]),
      "de",
      JSON.stringify(["1"]),
    ];
    const plan = database
      .prepare(`EXPLAIN QUERY PLAN ${sql}`)
      .all(...params)
      .map((row) => String(row.detail));

    assert.ok(plan.some((detail) => detail.includes(
      "idx_content_entries_tool_active_slug (kind=? AND locale=? AND is_active=? AND route_state=? AND slug=?)",
    )));
    assert.ok(plan.some((detail) => detail.includes(
      "idx_content_entries_tool_active_lower_title (kind=? AND locale=? AND is_active=? AND route_state=? AND <expr>=?)",
    )));
    assert.ok(plan.some((detail) => detail.includes(
      "idx_content_entries_tool_title_match (kind=? AND locale=? AND is_active=? AND route_state=? AND title_match_key=?)",
    )));
    assert.equal(database.prepare(sql).all(...params).length, 5);
  } finally {
    database.close();
  }
});
