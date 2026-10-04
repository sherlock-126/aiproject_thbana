# Sổ tiến độ nhiệm vụ

Trang dùng chung (Claude Artifact) để từng giáo viên cập nhật tiến độ nhiệm vụ hằng tháng và tải minh chứng; BGH theo dõi, duyệt, trả lại và xuất Excel.

- Bản đang chạy: https://claude.ai/artifact/9HxGge7bzfDB3tRVxkNyAo
- `index.html` là mã nguồn của trang; dữ liệu và minh chứng lưu trong kho của Artifact, không lưu trong repo.

Quyền truy cập dữ liệu (khai báo khi đăng):
- `config/*` (thông tin trường, danh sách, nhiệm vụ chung): mọi người đọc, chỉ chủ sổ ghi.
- `reports/<id>/...` (báo cáo của từng người): người đó đọc/ghi phần của mình; chủ sổ đọc tất cả.
- `reviews/<id>/...` (kết quả duyệt): người đó chỉ đọc; chỉ chủ sổ ghi.

Giáo viên cần được mời bằng email với quyền Người chỉnh sửa (Editor) để tải minh chứng lên.
