// Thư viện dùng chung cho mọi ứng dụng: lưu dữ liệu chung (D1) và upload file (R2).
// Cách dùng trong HTML:  <script src="/lib/thbana.js"></script>
//   const me = await TB.me();                                   // { email }
//   const ds = await TB.list("danh-gia", "phieu");              // [{ id, data, created_by, updated_at, ... }]
//   const r  = await TB.create("danh-gia", "phieu", { ten: "A" });
//   await TB.update("danh-gia", "phieu", r.id, { ten: "B" });   // thay toàn bộ data
//   await TB.remove("danh-gia", "phieu", r.id);
//   const f  = await TB.upload("danh-gia", inputEl.files[0]);  // { url, name, type, size, key }
//   const fs = await TB.files("danh-gia");
//   await TB.removeFile(f.key);
// Lỗi được ném ra dạng Error với message tiếng Việt, hiển thị thẳng cho người dùng được.
(function () {
  async function call(method, url, body, isForm) {
    const opt = { method, headers: {}, credentials: "same-origin" };
    if (body !== undefined) {
      if (isForm) opt.body = body;
      else { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    }
    const res = await fetch(url, opt);
    let out = null;
    try { out = await res.json(); } catch (e) { /* không phải JSON */ }
    if (res.status === 401 || res.type === "opaqueredirect") throw new Error("Phiên đăng nhập đã hết. Hãy tải lại trang để đăng nhập lại.");
    if (!res.ok) throw new Error((out && out.error) || ("Lỗi máy chủ (" + res.status + ")."));
    return out;
  }
  const rec = (app, col, id) => "/api/records/" + app + "/" + col + (id ? "/" + id : "");
  window.TB = {
    me: () => call("GET", "/api/me"),
    list: (app, col) => call("GET", rec(app, col)),
    get: (app, col, id) => call("GET", rec(app, col, id)),
    create: (app, col, data) => call("POST", rec(app, col), { data }),
    update: (app, col, id, data) => call("PUT", rec(app, col, id), { data }),
    remove: (app, col, id) => call("DELETE", rec(app, col, id)),
    upload: (app, file) => { const fd = new FormData(); fd.append("file", file); return call("POST", "/api/files/" + app, fd, true); },
    files: (app) => call("GET", "/api/files/" + app),
    removeFile: (key) => call("DELETE", "/api/files/raw/" + key)
  };
})();
