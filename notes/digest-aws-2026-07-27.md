---
type: note
title: Digest AWS learning site — workflow thorough, phủ SVG toàn catalog, giới hạn TS (2026-07-27)
summary: Chống "làm qua loa trong 1 phiên" bằng workflow thorough thay cho /loop; loạt root cause thật (union type TS >1100 phần tử, hljs theme sáng trên nền tối, search-index force-static, order 1.5) và kỷ luật ground-truth vì report của agent sai liên tục.
tags: [aws, tooling, skills, typescript, nextjs, learning]
created: 2026-07-27
source: project "aws" — session history
---

> CHỈ phần mới so với [[digest-aws-2026-07-23]], [[digest-aws-2026-07-24]], [[shipped-aws-2026-07-25]].

## Feedback (cách làm việc)

- **"Không được làm chỉ để fit token usage"** — 1 phiên chưa đủ thì loop qua nhiều phiên cho tới khi hoàn chỉnh. User nêu đích danh failure mode: *"chat 'làm việc A cho tôi' thì thường bạn làm rất tiết kiệm, rất qua loa"*. Đây là lý do sinh ra workflow `thorough`.
- **Không tuyên bố "xong" khi `git status --porcelain` chưa trống.** User bắt lỗi đúng chỗ này (còn file plan chưa commit) → giờ kiểm tra dứt khoát trước khi báo done.
- **Emoji-text (🌱☁️🛠) trông "như AI"** → dùng icon lib (`lucide-react`) cho header + rehype plugin đổi callout emoji sang icon.
- **Tự thẩm định thay vì plumbing agent** khi dữ liệu nhỏ (32KB) — đọc thẳng và chấm còn rẻ hơn dựng workflow.

## Decisions

- **`/loop` + ScheduleWakeup vs Workflow**: loop hợp khi cần checkpoint cho người xem giữa các phần; muốn *tự động hết, không chờ nhân tạo* thì dùng Workflow — dùng `/loop` cho ca đó là sai công cụ.
- **Hybrid**: Workflow chạy nền (fire-and-forget) + `/loop` quét plan file để báo tiến độ realtime — bù đúng điểm yếu "không thấy gì đang xảy ra" của Workflow.
- **Skill `thorough`** (`.claude/workflows/thorough.js`): spec → scan → decompose → execute(produce→verify) → gate → completeness → report. Gate phải **khách quan** (script tự viết), không dựa vào `npm run build`.
- **State bền trên đĩa** (`.claude/content-plan/<KEY>.json` qua `plan.mjs init|next|mark|status`) là cái làm việc lớn resume được qua nhiều phiên.

## Bugs (root cause)

- **TS "union type too complex to represent"** khi mảng literal vượt ~1.100 phần tử → tách thành file chunked (`const k1/k2...` + spread) và lấy **JSON sidecar làm nguồn sự thật**, `.ts` chỉ là file sinh ra.
- **Appender parse hỏng**: regex bắt `];` khớp nhầm `];` nằm *bên trong chuỗi câu hỏi* (câu có code `[...]`) → thay bằng bracket-matching scanner tôn trọng string literal + bọc `JSON.parse` trong try/catch (dòng `export = [...k1, ...k2]` cũng khớp regex).
- **SVG inline vỡ vì dòng trống trong khối `<svg>`** (CommonMark coi dòng trống là kết thúc HTML block → shape rơi ra ngoài `<svg>`). Đã ghi ở [[digest-aws-2026-07-23]] nhưng lần này **tái phát diện rộng: 279 block / 116 file**. Bài học mới: **gate `rsvg-convert` không bắt được** vì chuỗi SVG tách riêng vẫn render OK → gate phải chạy trên *đường render thật* (verify HTML build), và phải xem in-app ít nhất 1 lần.
- **Code không lên màu**: `highlight.js` import `github.css` (theme **sáng**) trong khi UI nền tối → token gần như vô hình. Fix: bảng màu atom-one khai báo cho cả light/dark, scope trong `.prose-article`.
- **⌘K "không thấy gì"**: `/search-index.json` là `force-static` (sinh lúc build) + worker cache singleton → client cũ thấy index cũ. Index thật hoàn toàn đúng (3.844 record). → **Sau khi thêm/sửa lesson phải rebuild + refresh**, không phải bug index.
- **Chèn lesson nhầm vào mảng `Chapter[]`** (regex target sai) → lỗi TS "'slug' does not exist in type 'Chapter'". Lặp lại 2 lần.
- **Quên đăng ký chapter** (`git-ch3`) → header đếm đủ 9 bài nhưng sidebar chỉ hiện 5.
- **`order: 1.5`** (mẹo chèn bài giữa chừng) bị render thành "Bài 1.5" ở 4 component → phải đánh lại số nguyên liên tục.
- **CLF-C02 lệch số bài**: course cố ý nhóm theo 4 domain thi nên thứ tự hiển thị (`order`) ≠ số file → H1 "Bài N" trong `.md` phải bám `order`, không bám tên file (17 file lệch).
- **Capstone lệch đề** khi 3 bài sinh song song: cap-01/02 dùng "TaskShare", cap-03 dùng "Quicklink" — agent song song không chia sẻ context → phải sinh lại cho liền mạch.

## Techniques / gotchas

- **Không tin report của agent/workflow — dùng ground truth.** Report "added=0"/"needs-attention" sai rất nhiều lần; `grep -c '<svg' <file>` mới là sự thật. Ngược lại cũng có gap thật (clf-c02/09 Well-Architected, sql-01) phải tự vẽ tay.
- **1 agent survey / course là single point of failure**: agent chết vì lỗi API ("Connection closed mid-response") → survey rỗng → workflow im lặng bỏ trắng cả course. Thêm guard tự chạy lại khi kết quả rỗng/có failure.
- **Workflow script gotchas**: `args` có thể tới dạng **chuỗi JSON** (phải `JSON.parse`) hoặc bị mangle khi lồng sâu → bền nhất là **ghi list ra file cho agent đọc**; backtick ``` trong template literal làm vỡ script; `node --check` báo "Illegal return statement" là **false alarm** (harness bọc thân script trong async function); workflow/skill mới tạo chưa vào registry → gọi bằng `scriptPath`.
- **Đặt `effort` thấp cho phase cơ học** trong workflow để giảm token (chỉ nâng cho verify/judge).
- **`cd web` trong lệnh Bash dính sang lệnh sau** → dùng path tuyệt đối từ repo root cho `plan.mjs`, git…
- **`rsvg-convert`** để tự soi SVG trước khi commit; `currentColor` + tint mờ (fill-opacity ~0.13–0.16) cho SVG tự hợp cả light/dark; luôn có `<title>` + `<desc>`.
- **Idiom sơ đồ quan trọng hơn "vẽ cho có"**: OSI vẽ **stacked layers** (không phải tháp), CAP vẽ tam giác, vòng đời vẽ state machine, topology vẽ node-edge — thêm catalog idiom + design-critic vào workflow thì chất lượng nhảy hẳn.
- **Wakeup dự phòng hay nổ muộn** khi việc đã xong → luôn kiểm tra state thật (plan status, git log) trước khi làm lại; thao tác phải idempotent.

## Liên quan

[[aws]] · [[aws-certification]] · [[digest-aws-2026-07-23]] · [[digest-aws-2026-07-24]] · [[shipped-aws-2026-07-25]] · [[moc-learning-pkm]]
