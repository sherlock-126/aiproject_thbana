// API dữ liệu dùng chung. QUẢN TRỊ VIÊN quản lý file này.
//   GET    /api/records/:app/:collection          → danh sách (mới sửa trước)
//   POST   /api/records/:app/:collection          → tạo mới, body: { data: {...} }
//   GET    /api/records/:app/:collection/:id      → một bản ghi
//   PUT    /api/records/:app/:collection/:id      → thay nội dung, body: { data: {...} }
//   DELETE /api/records/:app/:collection/:id      → xóa
// ponytail: mọi người đã đăng nhập đều sửa được dữ liệu chung; thêm phân quyền theo app khi có nhu cầu.

const NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_BYTES = 100_000;
const err = (status, error) => Response.json({ error }, { status });
const row = r => r && { id: r.id, data: JSON.parse(r.data), created_by: r.created_by, updated_by: r.updated_by, created_at: r.created_at, updated_at: r.updated_at };

async function readData(request) {
  let body;
  try { body = await request.json(); } catch { return [null, "Nội dung gửi lên không phải JSON."]; }
  if (!body || typeof body.data !== "object" || body.data === null) return [null, "Thiếu trường data (object)."];
  const text = JSON.stringify(body.data);
  if (text.length > MAX_BYTES) return [null, `Dữ liệu quá lớn (tối đa ${MAX_BYTES / 1000} KB mỗi bản ghi). Hãy tách nhỏ hoặc dùng upload file.`];
  return [text, null];
}

export async function onRequest({ request, env, params, data }) {
  const [app, collection, id, extra] = params.path || [];
  if (!NAME.test(app || "") || !NAME.test(collection || "") || extra) return err(400, "Đường dẫn phải là /api/records/<app>/<collection>[/<id>], chỉ dùng chữ thường, số, dấu gạch ngang.");
  const db = env.DB, who = data.email, now = new Date().toISOString();

  if (!id) {
    if (request.method === "GET") {
      const { results } = await db.prepare("SELECT * FROM records WHERE app=? AND collection=? ORDER BY updated_at DESC LIMIT 1000").bind(app, collection).all();
      return Response.json(results.map(row));
    }
    if (request.method === "POST") {
      const [text, e] = await readData(request); if (e) return err(400, e);
      const newId = crypto.randomUUID();
      await db.prepare("INSERT INTO records (id,app,collection,data,created_by,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(newId, app, collection, text, who, who, now, now).run();
      return Response.json(row(await db.prepare("SELECT * FROM records WHERE id=?").bind(newId).first()), { status: 201 });
    }
    return err(405, "Chỉ hỗ trợ GET, POST.");
  }

  const find = () => db.prepare("SELECT * FROM records WHERE id=? AND app=? AND collection=?").bind(id, app, collection).first();
  const cur = await find();
  if (!cur) return err(404, "Không tìm thấy bản ghi.");
  if (request.method === "GET") return Response.json(row(cur));
  if (request.method === "PUT") {
    const [text, e] = await readData(request); if (e) return err(400, e);
    await db.prepare("UPDATE records SET data=?, updated_by=?, updated_at=? WHERE id=?").bind(text, who, now, id).run();
    return Response.json(row(await find()));
  }
  if (request.method === "DELETE") {
    await db.prepare("DELETE FROM records WHERE id=?").bind(id).run();
    return Response.json({ ok: true });
  }
  return err(405, "Chỉ hỗ trợ GET, PUT, DELETE.");
}
