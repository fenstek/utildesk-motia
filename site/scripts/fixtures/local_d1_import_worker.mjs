export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/batch" && request.headers.get("X-Utildesk-Local-Projection") === "1") {
      const payload = await request.json();
      if (!Array.isArray(payload.statements) || payload.statements.length > 20) return Response.json({ error: "invalid batch" }, { status: 400 });
      const statements = payload.statements.map(({ sql, params }) => env.UTILDESK_CONTENT.prepare(sql).bind(...params));
      const results = await env.UTILDESK_CONTENT.batch(statements);
      return Response.json({ success: true, results: results.length });
    }
    if (request.method === "GET" && url.pathname === "/counts") {
      const result = await env.UTILDESK_CONTENT.prepare("SELECT kind, locale, COUNT(*) AS entries, SUM(is_active) AS active FROM content_entries GROUP BY kind, locale ORDER BY kind, locale").all();
      return Response.json(result.results);
    }
    return new Response("Local fixture importer only", { status: 404 });
  },
};
