// GET /api/me → { email } của người đang đăng nhập
export const onRequestGet = ({ data }) => Response.json({ email: data.email });
