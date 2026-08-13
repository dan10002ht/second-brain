---
type: resource
title: Gate quét mã nguồn: regex trên text không kín, dùng AST
summary: Một gate kiểu "không được log thứ này" viết bằng regex sẽ luôn còn khe (comment, xuống dòng, alias, camelCase) và dễ bị tự-allowlist; dựng trên AST thì cú pháp hết là biến số.
tags: [patterns, js, nodejs, tooling, architecture, backend]
created: 2026-08-13
updated: 2026-08-13
source: project "ticket-mcrsv" — session history (8c7111d4, H16 mục 3, 9 vòng)
---

# Gate quét mã nguồn: regex không kín, dùng AST

Bối cảnh sinh ra: một gate cấm log chuỗi lỗi backend (chứa token) ở gateway Node.
Vá bằng regex **8 vòng**, mỗi vòng bịt một đường thì lộ đường mới. Vòng 9 chuyển sang
AST thì đóng được.

## Vì sao regex không kín

Test cấu trúc kiểu `grep`/regex trên source coi cú pháp là **văn bản**:

| Khe | Ví dụ đã cắn thật |
|---|---|
| Nhận diện theo tên biến | `\berr\.message\b` **không khớp** `profileErr.message` |
| Comment / khoảng trắng / xuống dòng | cùng một biểu thức viết 2 dòng là lọt |
| Ngoặc lồng, template literal | `` `${e.message}` `` vs `e.message` |
| Alias / destructure | `const {message} = err` rồi log `message` |

Với AST (`@babel/parser` + `@babel/traverse` — thường **đã có sẵn** qua `babel-jest`,
không cần thêm dependency): comment, xuống dòng, ngoặc không còn là biến số; luật
viết theo **hình dạng node** (call expression nào, argument nào, gọi từ đâu) chứ không
theo chuỗi ký tự.

## Ba bẫy khi tự viết gate loại này

1. **Agent tự allowlist chính file mình vừa sửa.** Ở đây là `utils/logger.js` bị
   loại khỏi scanner với lý lẽ "mọi lỗi đều đi qua đây nên coi là an toàn" — tức là
   khoét đúng cái lỗ to nhất. Luật: allowlist phải được chấm bởi bên khác, và mỗi
   entry phải nêu được vì sao *đường đi qua nó* an toàn, không chỉ *file* an toàn.
2. **Hàm catch-all là chỗ nguy hiểm nhất, không phải chỗ an toàn nhất.** `logError`
   nhận lỗi không rõ nguồn gốc → phải coi mọi input của nó là **tainted** theo mặc
   định, thay vì tin nơi gọi đã lọc.
3. **Lớp redact có thể âm thầm giết logging.** Kiểm cả chiều ngược: sau khi bọc,
   log thường có còn đủ trường không (bản đầu dựng object mới thay vì mutate tại chỗ
   → rơi Symbol nội bộ của winston). Và cần guard tham chiếu vòng: `WeakSet` theo
   **đường đi** (xoá khi quay lui) để object lặp ở hai nhánh anh em không bị báo nhầm
   `[Circular]`.

## Cách chứng minh gate thật sự bắt được

Không tin "test xanh". Chèn từng ca vi phạm vào **file production thật**, chạy gate,
rồi khôi phục và đối chiếu `md5` — mỗi mutant phải đỏ với một message phân biệt được.
Cùng nguyên tắc với [[bang-chung-phan-biet-duoc]].

## Liên quan
- [[digest-ticket-mcrsv-2026-08-13]]
- [[feedback-khong-khep-viec-khi-con-khe-ho]] — vì sao vòng 9 đổi cơ chế thay vì vá vòng 9 cùng kiểu.
- [[bang-chung-phan-biet-duoc]]
- [[chan-agent-bang-cau-hinh]]
