---
type: note
title: Digest AWS — 2026-07-28
summary: CHỈ phần mới — phủ sơ đồ inline SVG cho 19 course (idiom catalog + rsvg tự soi), bẫy `order` thập phân hiện ra UI, dịch đề thi sang tiếng Anh giữ giải thích tiếng Việt, hash link đề thi không cần BE, và loạt gotcha workflow/gate.
tags: [aws, learning, tooling, method]
created: 2026-07-28
source: project "aws" — session history
---

# Digest AWS — 2026-07-28

> Chỉ ghi phần **mới** so với [[digest-aws-2026-07-23]], [[digest-aws-2026-07-24]],
> [[shipped-aws-2026-07-25]], [[digest-aws-2026-07-27]].

## Feedback

- **Đừng tuyên bố "xong" khi cây git chưa sạch.** Đã nói "xong hết" trong khi còn
  `.claude/content-plan/OSI.json` chưa commit; user bắt lỗi. Kỷ luật rút ra: chạy
  `git status --porcelain` (phải trống) *trước* khi báo hoàn thành.
  → gần với [[feedback-verification-before-completion]] *(chưa có note này)*.
- **Illustrate "cần có tư duy hơn"** — user phản hồi khi thấy sơ đồ vẽ theo một
  khuôn. Hệ quả: thêm **idiom catalog** vào prompt author + một agent
  `design-critic` ở khâu verify. Chọn đúng idiom quan trọng hơn vẽ cho có.

## Decisions

- **Sơ đồ = inline SVG, không dùng ảnh raster.** Why: môi trường không có tool sinh
  ảnh; renderer đã bật `rehype-raw` nên SVG inline render thẳng trong `.md`, lại
  theme-aware được. Tradeoff: phải tự vẽ bằng tay/agent, không có ảnh chụp thật.
- **Dịch đề thi sang tiếng Anh nhưng GIỮ `explanation` tiếng Việt.** Why: đề thi
  cert thật ra tiếng Anh nên luyện đề phải khớp; còn phần giải thích là để *học*,
  tiếng Việt vẫn hiệu quả hơn. Áp cho `question` + `options` (overwrite, không thêm
  field song ngữ).
- **`/loop` + `ScheduleWakeup` là sai công cụ cho "tự động hết".** Why: loop chỉ tự
  nhịp qua nhiều turn của main context — vẫn có chờ nhân tạo. Workflow là
  fire-and-forget, fan-out thật. Hybrid đã chốt: **workflow chạy nền + loop quét
  plan file để report tiến độ** (bù đúng chỗ workflow yếu là không báo giữa chừng).
  → sinh skill `orchestrate-with-progress` (wrapper, nhận natural language).
  Xem thêm [[digest-aws-2026-07-27]] (workflow `thorough`).

## Bugs (root cause)

- **`order: 1.5` hiện ra UI thành "Bài 1.5".** `lesson.order` chấp nhận số thập phân
  và `lessonsOfCourse` sort đúng → tưởng chèn bài giữa chương mà không phải đánh số
  lại. Nhưng `order` được **render ra số ở 4 chỗ** (header trang learn + 3 component
  nav). → phải đánh số lại về số nguyên liên tục. Bài học: field dùng để *sort* mà
  đồng thời được *hiển thị* thì không có chỗ cho giá trị "kỹ thuật".
- **Số "Bài N" trong H1 lệch với thứ tự sidebar (chỉ CLF-C02, 17 bài).** Root cause:
  CLF-C02 **cố ý nhóm theo 4 Domain thi**, nên thứ tự hiển thị (order 1–19) khác số
  file (01–19); H1 trong `.md` lại ghi theo số file. 164 bài của các course khác
  không lệch → đây là hệ quả của một quy ước riêng, không phải lỗi dữ liệu chung.
- **Gate link gãy báo false-positive.** Checker bắt `[[0, 0, 0]]`, `[["Env"]]`,
  `[[IgnoredVulns]]` — đó là **code trong bài**, không phải wiki-link. Phải strip
  code fence trước khi quét. Gate có false-positive thì workflow sẽ đi sửa nhầm →
  tệ hơn là không có gate. (48 link gãy thật, do slug đổi sang tiền tố `foundations-`.)
- **Một agent chết làm cả course bị bỏ trống âm thầm.** `survey:BACKEND` chết vì
  "Connection closed mid-response" → survey rỗng → workflow báo "không bài nào cần
  vẽ" và **pass gate**. Root cause thiết kế: survey mỗi course chỉ có **1 agent**,
  không có guard. Fix: guard `lessonsIllustrated:0 OR có failures` → tự chạy lại.
- **Workflow báo success nhưng file kết quả hỏng.** Bước merge làm `generatedQuestions.ts`
  parse fail → phải `git restore` rồi merge tay. Và sau 2 workflow dịch lớn vẫn sót
  **6 câu**, rồi **17 câu** tiếng Việt. → tiêu chí "xong" phải là ground truth
  (`grep` ký tự tiếng Việt = 0), không phải "workflow completed".
- **`node -e` không nhận env var** khi đặt biến sai vị trí trong lệnh → hardcode path.

## Techniques

- **SVG theme-aware:** chữ/viền dùng `fill|stroke="currentColor"` (KHÔNG đặt `color`
  trên `<svg>` để nó kế thừa màu chữ của bài); nền khối dùng tint mờ màu cố định
  (`fill-opacity ~0.14`); root có `viewBox` + `style="width:100%;max-width:Npx;..."`;
  bắt buộc `<title>` + `<desc>`. Kiểm chứng bằng `rsvg-convert` render ra PNG **cả
  hai theme** (dùng `-b` đổi nền + đổi `color` để mô phỏng light) trước khi đưa user.
  ⚠️ rsvg render OK **không** chứng minh render được in-app — xem bẫy dòng trống ở
  [[digest-aws-2026-07-27]].
- **Idiom catalog cho sơ đồ** (chọn theo *loại quan hệ*, không theo thói quen):
  stacked-layers cho tầng ngang hàng (**OSI vẽ dạng stack, KHÔNG phải tháp** — quy
  ước Cisco/CompTIA), sequence cho handshake/luồng, node-edge cho topology, state
  machine cho vòng đời, tam giác cho đánh đổi 3 chiều (CAP), tree cho phân cấp,
  nested box cho encapsulation, before/after cho tốt-vs-xấu, timeline, grid
  (SELECT chọn cột / WHERE chọn hàng).
- **Re-id quiz khi course đã có câu hỏi:** workflow luôn sinh id từ `-001`, nên phải
  tìm max id hiện có rồi offset trước khi append (`eng-q-078` → bắt đầu `079`;
  SRE offset +78; BACKEND offset +104). Không làm thì trùng id âm thầm.
- **Workflow script gotcha (bổ sung):** registry **không nhận workflow mới tạo giữa
  session** → gọi bằng `scriptPath` thay vì `name`. Script không có Node API
  (`require`/`fs`) — agent muốn đụng file thì phải có Bash. Agent không trả JSON ổn
  định → dùng tham số `schema` để ép structured output. Truyền list qua file thay vì
  `args` (đã ghi ở [[digest-aws-2026-07-23]]).
- **Link đề thi cố định không cần backend:** encode **thứ tự questionId** (không phải
  cả nội dung) → compress → base64 đặt ở **query param** (`?order=...`). Lưu ý dấu
  `/` trong base64: an toàn ở query param, **không** an toàn nếu nhét vào path
  segment → dùng base64url nếu muốn đặt trên path. *(chưa xác minh: chưa implement
  hoàn chỉnh, mới ở mức so sánh phương án)*

## Liên quan

[[aws]] · [[aws-certification]] · [[shipped-aws-2026-07-29]] (cái gì đã landed từ phiên này) ·
[[digest-aws-2026-07-27]] · [[digest-aws-2026-07-24]] ·
[[digest-aws-2026-07-23]] · [[shipped-aws-2026-07-25]] · [[moc-learning-pkm]]
