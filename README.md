# Ứng dụng AI · Trường Tiểu học Bà Nà

Nơi giáo viên tự xây dựng công cụ bằng Claude Code. Mỗi ứng dụng là một thư mục có `index.html`; trang chủ `index.html` liệt kê các ứng dụng.
Luật cho AI nằm trong `CLAUDE.md`.

## Hạ tầng (quản trị viên)
| Thành phần | Bản chính | Bản xem thử |
|---|---|---|
| Cloudflare Pages | project `thbana`, nhánh `main` | mọi nhánh khác |
| D1 (binding `DB`) | `thbana-db` | `thbana-db-preview` |
| R2 (binding `FILES`) | `thbana-files` | `thbana-files-preview` |
| Đăng nhập | Cloudflare Access (email OTP) | như bản chính |

Biến môi trường trên Pages: `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` (bắt buộc, thiếu thì API từ chối mọi request), `ADMIN_EMAILS` (danh sách email quản trị, phân tách bằng dấu phẩy).

- `functions/_middleware.js`: chặn file nội bộ, xác thực JWT của Access, gắn email người dùng.
- `functions/api/records`: dữ liệu dùng chung (JSON) theo `app/collection`.
- `functions/api/files`: upload file vào R2, tối đa 10 MB, chỉ ảnh và tài liệu văn phòng.
- `lib/thbana.js`: thư viện phía trình duyệt cho giáo viên dùng.
- `schema.sql`: cấu trúc bảng; sửa xong phải tự áp vào cả hai database D1.

## Chạy thử trên máy
```
npx wrangler@3 pages dev . --d1 DB --r2 FILES
```
Lần đầu tạo bảng cục bộ bằng `sqlite3 <file .sqlite trong .wrangler/state> < schema.sql`. Trên `localhost` người dùng là `dev@localhost`.
