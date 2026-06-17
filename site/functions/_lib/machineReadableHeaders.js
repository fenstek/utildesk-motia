export function withNoindex(response) {
  const nextResponse = new Response(response.body, response);
  nextResponse.headers.set("X-Robots-Tag", "noindex");
  return nextResponse;
}

export async function noindexFromNext(context) {
  return withNoindex(await context.next());
}
