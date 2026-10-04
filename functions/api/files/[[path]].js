// API upload file, ảnh (lưu trong R2). QUẢN TRỊ VIÊN quản lý file này.
//   POST   /api/files/:app            → upload, form-data field "file"; trả về { key, url, name, type, size }
//   GET    /api/files/:app            → danh sách file của app
//   GET    /api/files/raw/<key>       → xem / tải file
//   DELETE /api/files/raw/<key>       → xóa (người upload hoặc quản trị viên)

const NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = {
  "image/jpeg": 1, "image/png": 1, "image/webp": 1, "image/gif": 1, "image/heic": 1,
  "application/pdf": 1, "text/csv": 1, "text/plain": 1,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 1,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": 1,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": 1,
  "application/msword": 1, "application/vnd.ms-excel": 1, "application/vnd.ms-powerpoint": 1
};
const INLINE = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
const err = (status, error) => Response.json({ error }, { status });
const safeName = n => (n || "file").normalize("NFC").replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(-120);
const isAdmin = (env, email) => (env.ADMIN_EMAILS || "").toLowerCase().split(",").map(s => s.trim()).includes(email);

export async function onRequest({ request, env, params, data }) {
  const parts = params.path || [];

  if (parts[0] === "raw") {
    const key = parts.slice(1).join("/");
    if (!key) return err(400, "Thiếu mã file.");
    if (request.method === "GET") {
      const obj = await env.FILES.get(key);
      if (!obj) return err(404, "Không tìm thấy file.");
      const meta = await env.DB.prepare("SELECT name, type FROM files WHERE key=?").bind(key).first();
      const type = meta?.type || "application/octet-stream";
      const disp = INLINE.test(type) ? "inline" : "attachment";
      return new Response(obj.body, { headers: {
        "Content-Type": type,
        "Content-Disposition": `${disp}; filename*=UTF-8''${encodeURIComponent(meta?.name || "file")}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600"
      } });
    }
    if (request.method === "DELETE") {
      const meta = await env.DB.prepare("SELECT uploaded_by FROM files WHERE key=?").bind(key).first();
      if (!meta) return err(404, "Không tìm thấy file.");
      if (meta.uploaded_by !== data.email && !isAdmin(env, data.email)) return err(403, "Chỉ người upload hoặc quản trị viên được xóa file này.");
      await env.FILES.delete(key);
      await env.DB.prepare("DELETE FROM files WHERE key=?").bind(key).run();
      return Response.json({ ok: true });
    }
    return err(405, "Chỉ hỗ trợ GET, DELETE.");
  }

  const app = parts[0];
  if (!NAME.test(app || "") || parts.length > 1) return err(400, "Đường dẫn phải là /api/files/<app>, chỉ dùng chữ thường, số, dấu gạch ngang.");

  if (request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM files WHERE app=? ORDER BY uploaded_at DESC LIMIT 1000").bind(app).all();
    return Response.json(results.map(f => ({ ...f, url: `/api/files/raw/${f.key}` })));
  }
  if (request.method === "POST") {
    let form;
    try { form = await request.formData(); } catch { return err(400, "Gửi file bằng form-data, tên trường là \"file\"."); }
    const file = form.get("file");
    if (!file || typeof file === "string") return err(400, "Thiếu file (tên trường \"file\").");
    if (file.size > MAX_SIZE) return err(413, "File quá lớn, tối đa 10 MB.");
    const type = file.type || "application/octet-stream";
    if (!ALLOWED[type]) return err(415, "Loại file không được phép. Chỉ nhận ảnh (JPG, PNG, WEBP, GIF, HEIC), PDF, Word, Excel, PowerPoint, CSV, TXT.");
    const name = safeName(file.name);
    const key = `${app}/${crypto.randomUUID()}`; // mã file không dấu để URL luôn hợp lệ; tên gốc lưu trong bảng files
    await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: type } });
    const now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO files (key,app,name,type,size,uploaded_by,uploaded_at) VALUES (?,?,?,?,?,?,?)").bind(key, app, name, type, file.size, data.email, now).run();
    return Response.json({ key, url: `/api/files/raw/${key}`, name, type, size: file.size, uploaded_by: data.email, uploaded_at: now }, { status: 201 });
  }
  return err(405, "Chỉ hỗ trợ GET, POST.");
}
