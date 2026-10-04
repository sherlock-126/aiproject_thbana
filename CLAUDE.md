# Luật dự án: Ứng dụng AI Trường Tiểu học Bà Nà

Bạn đang hỗ trợ **giáo viên, không phải lập trình viên**, tự xây dựng công cụ (dashboard, biểu mẫu, sổ theo dõi…) cho nhà trường.
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu. Sau mỗi thay đổi, nói rõ đã làm gì và **gửi link xem thử**.
- Hạ tầng (máy chủ, cơ sở dữ liệu, kho file, deploy) **đã được quản trị viên dựng sẵn**. Bạn không cần và không được tự dựng thêm.

## 1. Hạ tầng đã có (chỉ đọc, không sửa)

| Thành phần | Chi tiết |
|---|---|
| Hosting | Cloudflare Pages, project `aiproject-thbana`, nối với repo này, **không có bước build** |
| Trang chính | https://aiproject-thbana.pages.dev (deploy từ nhánh `main`) |
| Bản xem thử | Mỗi nhánh khác `main` tự có link `https://<tên-nhánh>.aiproject-thbana.pages.dev` (tên nhánh viết thường, ký tự đặc biệt như `/` đổi thành `-`). Ví dụ nhánh `claude/abc-xyz` → `https://claude-abc-xyz.aiproject-thbana.pages.dev`. Link chính xác luôn có trong check "Cloudflare Pages" của commit hoặc PR |
| Cơ sở dữ liệu | Cloudflare D1, binding `DB`. Bản chính `thbana-db`, bản xem thử `thbana-db-preview`: **dữ liệu hai bên tách riêng** |
| Kho file, ảnh | Cloudflare R2, binding `FILES`. Bản chính `thbana-files`, bản xem thử `thbana-files-preview` |
| API có sẵn | `functions/api/records` (dữ liệu JSON), `functions/api/files` (upload), `functions/api/me` |
| Thư viện trình duyệt | `/lib/thbana.js` (đối tượng `TB`): **cách duy nhất để lưu dữ liệu và file** |
| Đăng nhập | **Chưa bật.** Ai có link cũng xem và sửa được. Người dùng được ghi nhận là `"khach"` |

Bạn **không có** quyền vào tài khoản Cloudflare và **không cần**: deploy xảy ra tự động khi đẩy code lên GitHub.

## 2. Cách làm một ứng dụng

- Mỗi ứng dụng là **một thư mục có `index.html`** ở gốc repo, ví dụ `danh-gia-gv/index.html`, mở tại `/danh-gia-gv/`. Tên thư mục: chữ thường không dấu, số, dấu gạch ngang.
- Tạo ứng dụng mới thì **thêm một thẻ `<a class="app">` vào `index.html` ở gốc** (trang chủ liệt kê ứng dụng).
- Ưu tiên một file HTML (CSS, JS viết trong file). Thư viện ngoài chỉ nạp qua CDN (cdnjs, jsdelivr, unpkg) với phiên bản cố định.
- Không dùng npm, bundler, React build hay framework cần biên dịch. Không tạo `package.json`.
- Giao diện tiếng Việt, dùng được trên điện thoại.

## 3. Lưu dữ liệu và file: BẮT BUỘC dùng `TB`

Nạp `<script src="/lib/thbana.js"></script>` rồi dùng:

| Việc | Lệnh |
|---|---|
| Đọc danh sách | `await TB.list(app, collection)` → `[{ id, data, created_by, updated_by, created_at, updated_at }]` (mới sửa trước, tối đa 1000) |
| Đọc một bản ghi | `await TB.get(app, collection, id)` |
| Thêm | `await TB.create(app, collection, data)` → bản ghi mới (có `id`) |
| Sửa (thay **toàn bộ** `data`) | `await TB.update(app, collection, id, data)` |
| Xóa | `await TB.remove(app, collection, id)` |
| Upload file, ảnh | `await TB.upload(app, file)` → `{ url, key, name, type, size }` |
| Danh sách file | `await TB.files(app)` → `[{ key, url, name, type, size, uploaded_at }]` |
| Xóa file | `await TB.removeFile(key)` |

- `app` = tên thư mục ứng dụng. `collection` = tên nhóm dữ liệu (`phieu`, `giao-vien`, `cong-viec`…). Chỉ chữ thường, số, dấu gạch ngang.
- `data` là object JSON, tối đa 100 KB mỗi bản ghi. File và ảnh thì upload bằng `TB.upload`, rồi chỉ lưu `url` và `key` vào `data`.
- File cho phép: ảnh JPG, PNG, WEBP, GIF, HEIC; PDF; Word, Excel, PowerPoint; CSV, TXT. Tối đa 10 MB. Hiển thị ảnh bằng `<img src="${url}">`, tải file bằng `<a href="${url}">`.
- Mọi lệnh `TB` có thể ném lỗi kèm thông báo tiếng Việt: luôn `try/catch` và hiện lỗi cho người dùng.
- Không có lọc hay tìm kiếm phía máy chủ: đọc bằng `TB.list` rồi lọc, sắp xếp, tính toán bằng JavaScript.
- Khi nhiều người cùng sửa một bản ghi, người lưu sau ghi đè người lưu trước. Hãy chia dữ liệu thành nhiều bản ghi nhỏ (ví dụ một phiếu một bản ghi), đừng gom cả trường vào một bản ghi.
- `localStorage` chỉ dùng cho tiện ích cá nhân (nhớ tab, bộ lọc). **Dữ liệu cần dùng chung hoặc cần giữ lâu dài phải lưu bằng `TB`.**
- Ứng dụng đang dùng `localStorage` hoặc dữ liệu cứng trong code mà giáo viên muốn dùng chung: chuyển sang `TB`. Có thể thêm nút "Nạp dữ liệu mẫu" để tạo dữ liệu minh họa qua `TB.create`.

## 4. Dữ liệu đang CÔNG KHAI: cảnh báo giáo viên

Chưa có đăng nhập, nên mọi trang và mọi dữ liệu lưu qua `TB` **ai có link cũng xem, sửa, xóa được**.
- Khi giáo viên định lưu dữ liệu cá nhân thật (họ tên kèm điểm đánh giá, lương, số điện thoại, CCCD, ảnh học sinh…): **nhắc rõ rủi ro một lần** và đề nghị dùng dữ liệu ẩn danh, hoặc báo quản trị viên bật đăng nhập trước.
- Dữ liệu mẫu viết trong code: chỉ dùng tên giả như "Giáo viên A".
- Thêm một dòng nhỏ trên giao diện: "Dữ liệu trên trang này đang công khai với người có link."

## 5. Quy trình làm việc và deploy

1. Làm trên **nhánh riêng**. **Không bao giờ đẩy thẳng lên `main`**, kể cả khi tài khoản có quyền.
2. Commit, đẩy nhánh lên GitHub. Khoảng 1–2 phút sau Cloudflare tạo xong bản xem thử. **Gửi giáo viên link xem thử** (mục 1). Bản xem thử dùng database và kho file riêng, thử thoải mái.
3. Kiểm tra link xem thử hoạt động, ví dụ `curl -s -o /dev/null -w "%{http_code}" <link>/<app>/` phải ra `200`. Nếu chưa ra, chờ thêm hoặc xem trạng thái check "Cloudflare Pages" trên commit, PR.
4. Giáo viên duyệt xong: tạo **Pull Request vào `main`**, tiêu đề và mô tả bằng tiếng Việt, ghi rõ ứng dụng nào, thay đổi gì. Quản trị viên duyệt và gộp. Sau đó trang chính tự cập nhật.
5. Nhánh hiện tại thiếu `CLAUDE.md`, `lib/`, `functions/` (tạo trước khi có hạ tầng): **merge `main` vào nhánh** trước khi làm tiếp.

## 6. TUYỆT ĐỐI KHÔNG (phần do quản trị viên quản lý)

- Không tạo hoặc sửa: `wrangler.toml`, `wrangler.json`, `wrangler.jsonc`, `functions/`, `schema.sql`, `lib/thbana.js`, `.github/`, `package.json`, `_routes.json`, `_worker.js`.
  - Riêng `wrangler.toml`: nếu xuất hiện, nó **ghi đè cấu hình database và kho file** của trang, khiến toàn bộ dữ liệu ngừng chạy.
- Không chạy `wrangler`, không deploy thủ công, không tạo bảng, không chạy SQL.
- Không gửi dữ liệu ra dịch vụ bên ngoài (Google Sheets, webhook, API AI, email…) nếu chưa được quản trị viên duyệt.
- Không ghi mật khẩu, API key vào code.
- Không sửa thư mục ứng dụng của giáo viên khác nếu không được yêu cầu.

Yêu cầu cần đến những việc trên (thêm API, đổi cấu trúc dữ liệu, bật đăng nhập, gửi email, kết nối dịch vụ ngoài, tăng giới hạn file): **dừng lại, giải thích cho giáo viên và ghi rõ "cần quản trị viên hỗ trợ: …"**. Không tự tìm cách khác.

## 7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân, cách xử lý |
|---|---|
| `TB` báo lỗi máy chủ 500, nội dung có `prepare`, `undefined`, `DB` hoặc `FILES` | Database hoặc kho file chưa được gắn cho môi trường này → báo quản trị viên |
| Lỗi 400 "Đường dẫn phải là…" | Tên `app` hoặc `collection` có chữ hoa, dấu, gạch dưới → đổi sang chữ thường và gạch ngang |
| Lỗi 413 hoặc 415 khi upload | File quá 10 MB hoặc sai loại → báo giáo viên nén hoặc đổi định dạng |
| Link xem thử 404 | Chưa deploy xong, hoặc sai tên nhánh trong link → kiểm tra lại tên nhánh |
| Dữ liệu ở bản xem thử không thấy ở trang chính | Bình thường: hai môi trường dùng database riêng |
