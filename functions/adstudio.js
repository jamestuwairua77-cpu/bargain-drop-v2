export async function onRequest() {
  return new Response("404 — Page Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}