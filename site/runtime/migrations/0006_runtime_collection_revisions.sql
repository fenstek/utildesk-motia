-- Collision-free cache identity for aggregate runtime routes.
-- Every material content mutation increments the affected kind/locale revision.
CREATE TABLE IF NOT EXISTS runtime_collection_revisions (
  kind TEXT NOT NULL CHECK (kind IN ('tool', 'ratgeber')),
  locale TEXT NOT NULL CHECK (locale IN ('de', 'en')),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (kind, locale)
);

INSERT OR IGNORE INTO runtime_collection_revisions (kind, locale, revision)
SELECT kind, locale, 1 FROM content_entries GROUP BY kind, locale;

CREATE TRIGGER IF NOT EXISTS content_entries_collection_revision_insert
AFTER INSERT ON content_entries
BEGIN
  INSERT INTO runtime_collection_revisions (kind, locale, revision, updated_at)
  VALUES (NEW.kind, NEW.locale, 1, CURRENT_TIMESTAMP)
  ON CONFLICT(kind, locale) DO UPDATE SET
    revision = runtime_collection_revisions.revision + 1,
    updated_at = CURRENT_TIMESTAMP;
END;

CREATE TRIGGER IF NOT EXISTS content_entries_collection_revision_update
AFTER UPDATE ON content_entries
BEGIN
  INSERT INTO runtime_collection_revisions (kind, locale, revision, updated_at)
  VALUES (NEW.kind, NEW.locale, 1, CURRENT_TIMESTAMP)
  ON CONFLICT(kind, locale) DO UPDATE SET
    revision = runtime_collection_revisions.revision + 1,
    updated_at = CURRENT_TIMESTAMP;
END;

CREATE TRIGGER IF NOT EXISTS content_entries_collection_revision_delete
AFTER DELETE ON content_entries
BEGIN
  INSERT INTO runtime_collection_revisions (kind, locale, revision, updated_at)
  VALUES (OLD.kind, OLD.locale, 1, CURRENT_TIMESTAMP)
  ON CONFLICT(kind, locale) DO UPDATE SET
    revision = runtime_collection_revisions.revision + 1,
    updated_at = CURRENT_TIMESTAMP;
END;
