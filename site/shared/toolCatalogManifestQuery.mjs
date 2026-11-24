export const RUNTIME_TOOL_CATALOG_MANIFEST_SQL = `
SELECT revisions.revision AS collection_revision, revisions.updated_at,
       primary_revisions.revision AS primary_collection_revision,
       catalogs.object_key, catalogs.etag, catalogs.generated_at,
       catalogs.item_count, catalogs.policy_hash, catalogs.content_hash
FROM runtime_collection_revisions AS revisions
JOIN runtime_collection_revisions AS primary_revisions
  ON primary_revisions.kind = 'tool' AND primary_revisions.locale = 'de'
LEFT JOIN runtime_tool_catalogs AS catalogs
  ON catalogs.locale = revisions.locale
 AND catalogs.collection_revision = revisions.revision
 AND catalogs.primary_collection_revision = primary_revisions.revision
WHERE revisions.kind = 'tool' AND revisions.locale = ?
`;
