---
type: feedback
title: Token/key chỉ đi qua env — không in ra chat, và đừng dò env để tìm nó
summary: Khi user đưa token hoặc chỉ chỗ lấy key, chỉ tham chiếu tên biến và truyền qua env của lệnh; không echo giá trị, không liệt kê danh sách biến khi đang dò tìm, và thiếu token thì tìm đường không cần token chứ không đi moi.
tags: [feedback, auth, avada, method]
created: 2026-08-20
updated: 2026-08-20
source: project "subscriptions" — session history 2026-08-19→2026-08-20 (3 lần nhắc trong 3 session khác nhau)
---

# Token/key chỉ đi qua env — không in ra chat

Trong ba session liên tiếp user nhắc đúng một chuyện, với ba câu khác nhau:

- `ON_PREMISE_GITLAB_TOKEN đây nè` → **`ko được để lộ ra nhé`**
- `dùng serviceAccount.prod.json cũng như ACCESS_TOKEN_KEY_PROD trong .env.local nhé,`
  **`lưu ý ko lộ key ra đoạn chat nhé`**
- `chạy yarn trans bằng GOOGLE_TRANSLATE_KEY trong .env.local nhé,`
  **`lưu ý ko để lộ ra chat nhé`**

**Why:** những token này là **credential prod thật, không hết hạn** — access token
Shopify, khoá giải mã `accessTokenHash`, PAT GitLab on-prem, Slack `xoxp-` chạy dưới
danh nghĩa chính user. Transcript session được lưu ra đĩa và được `brain-digest` đọc lại
mỗi tối, nên một lần in ra chat là nó nằm ở nhiều chỗ vĩnh viễn, không rút lại được.
Khác hẳn [[api-key-cong-khai-khong-phai-secret]]: mấy key này **không** vốn công khai,
rotate được nhưng tốn công và ảnh hưởng người khác.

Có tiền lệ trong chính phiên: classifier chặn đoạn `set -a && source .env.local && set +a`
vì nó trông như đang xuất token ra ngoài — chặn đúng, chỉ là chặn cả lệnh hợp lệ.

**How to apply:**

| ❌ | ✅ |
|---|---|
| `echo $TOKEN`, `env \| grep -i token`, in giá trị vào bảng/tóm tắt | Chỉ nhắc **tên biến**: "lấy từ `ACCESS_TOKEN_KEY_PROD`" |
| Dò `env`/liệt kê tên biến để tìm token khi thiếu | Nói thẳng là thiếu, hỏi user, hoặc tìm đường **không cần token** |
| Paste token vào file/commit/BRIEF | Truyền qua env của đúng lệnh đó: `SA_ENV=prod SHOPIFY_ACCESS_TOKEN_KEY="$ACCESS_TOKEN_KEY_PROD" node …` |

Khi thiếu token, đường không-cần-token thường vẫn có: MR tạo được bằng **git push
options** với credential sẵn có, không cần `GITLAB_PAT` (xem
[[migrate-repo-gitlab-on-prem]]). Với script đọc Firestore prod, in **tên field** để chứng
minh token nằm ở đâu (`accessTokenHash`) là đủ, không cần in nội dung.

Liên quan: [[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]] nói về secret đã lỡ
nằm trong code; note này nói về secret đang đi qua tay tôi trong lúc làm việc.
