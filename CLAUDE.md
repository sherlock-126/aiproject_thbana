# Luật dự án: Ứng dụng AI Trường Tiểu học Bà Nà

Người dùng của bạn là **giáo viên, không phải lập trình viên**. Hãy trả lời bằng tiếng Việt, dễ hiểu, giải thích mình đã làm gì sau mỗi thay đổi.

## Cấu trúc
- Mỗi ứng dụng là **một thư mục có `index.html`** ở gốc repo, ví dụ `danh-gia-gv/index.html` → mở tại `/danh-gia-gv/`.
- Tên thư mục: chữ thường không dấu, số, dấu gạch ngang.
- Khi tạo ứng dụng mới: **thêm một thẻ `<a class="app">` vào `index.html` ở gốc** (trang chủ liệt kê ứng dụng).
- Ưu tiên một file HTML (CSS và JS viết thẳng trong file). Thư viện ngoài chỉ nạp qua CDN (cdnjs, jsdelivr, unpkg) với phiên bản cố định.
- Trang web chạy trên Cloudflare Pages, không có bước build. Không dùng npm, React build, framework cần biên dịch.

## Lưu dữ liệu và file: BẮT BUỘC dùng `/lib/thbana.js`
Nạp `<script src="/lib/thbana.js"></script>`, rồi dùng:

| Việc | Lệnh |
|---|---|
| Biết ai đang dùng | `await TB.me()` → `{ email }` |
| Đọc danh sách | `await TB.list(app, collection)` → `[{ id, data, created_by, updated_by, created_at, updated_at }]` |
| Thêm | `await TB.create(app, collection, data)` |
| Sửa (thay toàn bộ `data`) | `await TB.update(app, collection, id, data)` |
| Xóa | `await TB.remove(app, collection, id)` |
| Upload file, ảnh (tối đa 10 MB) | `await TB.upload(app, file)` → `{ url, key, name, type, size }` |
| Danh sách file | `await TB.files(app)` |
| Xóa file | `await TB.removeFile(key)` |

- `app` = tên thư mục ứng dụng; `collection` = tên nhóm dữ liệu (ví dụ `phieu`, `giao-vien`). Chỉ chữ thường, số, dấu gạch ngang.
- `data` là object JSON tối đa 100 KB. Lưu file, ảnh bằng `TB.upload` rồi chỉ lưu `url`/`key` vào `data`.
- Mọi lệnh có thể ném lỗi với thông báo tiếng Việt: luôn `try/catch` và hiện lỗi cho người dùng.
- `localStorage` chỉ dùng cho tiện ích cá nhân (nhớ tab, bộ lọc). **Dữ liệu cần dùng chung phải lưu bằng TB.**
- Dữ liệu được dùng chung: mọi người đã đăng nhập đều xem và sửa được. Ghi rõ điều này trên giao diện nếu dữ liệu nhạy cảm.

## TUYỆT ĐỐI KHÔNG (phần hạ tầng do quản trị viên quản lý)
- Không tạo hoặc sửa: `wrangler.toml`, `wrangler.json`, `functions/`, `schema.sql`, `lib/thbana.js`, `.github/`, `package.json`.
- Không tạo bảng, không chạy lệnh database, không dùng `wrangler`, không deploy thủ công. Deploy tự động khi đẩy code.
- Không viết code tắt đăng nhập, không gửi dữ liệu ra dịch vụ bên ngoài (Google Sheets, webhook, API AI…) nếu giáo viên chưa đồng ý rõ ràng và quản trị viên chưa duyệt.
- Không ghi thông tin bí mật (mật khẩu, API key) vào code.
- Không đưa dữ liệu cá nhân thật (họ tên kèm điểm, lương, CCCD, ảnh học sinh) vào dữ liệu mẫu trong code. Dữ liệu mẫu dùng tên giả như "Giáo viên A".
- Không sửa thư mục ứng dụng của giáo viên khác nếu không được yêu cầu.

Nếu yêu cầu của giáo viên cần những việc trên (thêm bảng, thêm API, gửi email, kết nối dịch vụ ngoài), **dừng lại và nói rõ cần quản trị viên hỗ trợ**, không tự làm cách khác.

## Quy trình
1. Làm việc trên nhánh riêng, không đẩy thẳng lên `main`.
2. Đẩy nhánh lên GitHub → Cloudflare tự tạo **link xem thử** (dữ liệu xem thử tách riêng, thoải mái thử).
3. Giáo viên kiểm tra link xem thử. Đạt thì tạo Pull Request vào `main`, quản trị viên duyệt rồi mới lên trang chính.
4. Trước khi báo xong: tự kiểm tra trang không lỗi JavaScript, hiển thị được trên điện thoại, chữ tiếng Việt đúng.
