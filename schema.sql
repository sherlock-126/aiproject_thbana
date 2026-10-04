-- Cấu trúc dữ liệu dùng chung cho mọi ứng dụng. CHỈ QUẢN TRỊ VIÊN được sửa file này.
-- Mỗi bản ghi thuộc một ứng dụng (app) và một nhóm (collection); nội dung lưu dạng JSON.
CREATE TABLE IF NOT EXISTS records (
  id          TEXT PRIMARY KEY,
  app         TEXT NOT NULL,
  collection  TEXT NOT NULL,
  data        TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_records_app_col ON records (app, collection, updated_at);

-- Thông tin file đã upload (nội dung file nằm trong R2)
CREATE TABLE IF NOT EXISTS files (
  key          TEXT PRIMARY KEY,
  app          TEXT NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  size         INTEGER NOT NULL,
  uploaded_by  TEXT NOT NULL,
  uploaded_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_files_app ON files (app, uploaded_at);
