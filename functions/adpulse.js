// Cloudflare Pages Function for /adpulse
export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/adpulse.html';
  const assetRes = await context.env.ASSETS.fetch(new Request(url.toString(), context.request));
  return new Response(assetRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}