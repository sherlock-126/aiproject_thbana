// Chạy trước mọi request. QUẢN TRỊ VIÊN quản lý file này — AI của giáo viên không được sửa.
// 1) Chặn truy cập các file nội bộ của repo.
// 2) Xác thực người dùng qua Cloudflare Access (kiểm tra chữ ký JWT), gắn email vào ctx.data.email.

const BLOCKED = [/^\/functions(\/|$)/, /^\/schema\.sql$/i, /^\/claude\.md$/i, /^\/readme\.md$/i, /^\/\.github(\/|$)/, /^\/\.git(\/|$)/, /^\/package(-lock)?\.json$/i, /^\/node_modules(\/|$)/, /^\/\.wrangler(\/|$)/];

let certCache = { at: 0, keys: [] };

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function accessKeys(team) {
  if (Date.now() - certCache.at < 3600_000 && certCache.keys.length) return certCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  const { keys } = await res.json();
  certCache = { at: Date.now(), keys };
  return keys;
}

async function verifyAccessJwt(token, env) {
  const [h, p, sig] = token.split(".");
  if (!sig) return null;
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  const jwk = (await accessKeys(env.ACCESS_TEAM_DOMAIN)).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) return null;
  if (payload.exp * 1000 < Date.now()) return null;
  if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
  return payload.email ? String(payload.email).toLowerCase() : null;
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  if (BLOCKED.some(r => r.test(url.pathname))) return new Response("Không tìm thấy", { status: 404 });

  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const accessOn = !!(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD);
  let email = null;
  if (local) email = "dev@localhost";
  else if (accessOn) {
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (token) { try { email = await verifyAccessJwt(token, env); } catch (e) { email = null; } }
  }
  // ponytail: hiện CHƯA bật đăng nhập → ai có link cũng dùng được, người dùng ghi là "khach".
  // Bật Cloudflare Access + đặt ACCESS_TEAM_DOMAIN, ACCESS_AUD là tự chuyển sang bắt đăng nhập.
  ctx.data.email = email || "khach";
  ctx.data.accessOn = accessOn;

  if (accessOn && url.pathname.startsWith("/api/") && !email) {
    return Response.json({ error: "Chưa đăng nhập. Hãy tải lại trang để đăng nhập bằng email trường." }, { status: 401 });
  }
  return ctx.next();
}
