-- Minimal local/QA seed for the runtime catalog and Pages cache regression.
-- Apply migrations 0001-0008 first. This fixture is never editorial content.
INSERT INTO content_entries (
  content_key, kind, locale, slug, title, excerpt, metadata_json, markdown,
  source_hash, source_published_at, source_updated_at, revision, is_active,
  route_state, canonical_path, robots_policy, editorial_reviewed, category,
  price_model, popularity
) VALUES
  (
    'tool:de:catalog-fixture', 'tool', 'de', 'catalog-fixture', 'Fixture Karte',
    'Lokale Testkarte für den Katalog.',
    '{"title":"Fixture Karte","description":"Lokale Testkarte für den Katalog.","tags":["AI"],"category":"Testing","price_model":"Free"}',
    '# Fixture Karte\n\nLokale Testkarte für den Katalog.\n\n## Merkmale\n\n- Prüft Cache und Katalog.',
    'fixture-v1-de', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1, 'active',
    '/tools/catalog-fixture/', 'noindex,follow', 1, 'Testing', 'Free', 10
  ),
  (
    'tool:en:catalog-fixture', 'tool', 'en', 'catalog-fixture', 'Fixture Card',
    'Local test card for the catalog.',
    '{"title":"Fixture Card","description":"Local test card for the catalog.","category":"Testing","price_model":"Free"}',
    '# Fixture Card\n\nLocal test card for the catalog.\n\n## Features\n\n- Checks cache and catalog.',
    'fixture-v1-en', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1, 'active',
    '/en/tools/catalog-fixture/', 'noindex,follow', 1, 'Testing', 'Free', 0
  );
