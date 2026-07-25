---
type: note
title: AWS study-app digest 2026-07-24 — build-content-loop, gate rẻ trước LLM, Workflow gotchas
summary: Vòng tự nhịp nhiều phần (build-content-loop) + evaluator-optimizer, chạy gate deterministic trước LLM, SVG theme-aware, và loạt gotcha viết Workflow script + bug appender/TS.
tags: [aws, method, tooling, react]
created: 2026-07-24
source: project "aws" (Next.js AWS study-app) session history
---

# AWS study-app digest 2026-07-24 — chỉ phần MỚI

Bổ sung cho [[digest-aws-2026-07-23]]. Chỉ ghi cái chưa có (đã bỏ author→critic scale,
plan bền trên đĩa, SVG blank-line, list-via-file, verify ground-truth).

## Feedback (cách làm việc)
- **Đừng gói việc cho vừa token — loop qua nhiều phiên tới khi xong.** User nhấn nhiều lần
  ("ko gói gọn 1 session"): một tin "làm A" thường nhận lát mỏng + tóm tắt qua loa. Chia phần, làm tới
  hoàn chỉnh, không cắt để fit ngân sách chat.
- **Không tuyên bố "xong" khi cây git chưa sạch** — `git status --porcelain` phải trống trước khi báo done.
- **Verify ở render path THẬT, không chỉ tool cô lập.** Gate `rsvg-convert` PASS nhưng SVG vẫn vỡ in-app
  (blank-line bug) vì rsvg render chuỗi tách rời vẫn tốt → phải kiểm HTML build/app thật.
- **Emoji-text trông "AI" — user dị ứng.** Dùng icon lib (lucide-react) thay emoji; rehype plugin đổi
  blockquote `> 💡`/`> ⚠️` sang callout lucide.

## Decisions (why)
- **Skill cấp project, commit trong repo** (`.claude/skills/`) để cả team dùng, không đặt global.
  (`author-exam-content`, `review-exam-content`, `build-content-loop`, `thorough`, `illustrate`... +
  `_shared/exam-content-conventions.md`.)
- **Muốn "tự động hết, không chờ người": dùng Workflow fire-and-forget thay `/loop`+ScheduleWakeup.**
  Hybrid tối ưu = Workflow chạy nền + `/loop` poll tiến độ.
- **Chạy gate deterministic TRƯỚC evaluator LLM tốn kém:** `check.mjs` (multi-ratio, trùng, format) loại
  sớm; chỉ đưa qua LLM khi gate sạch.
- **Đề thi cố định chia sẻ = hash thứ tự questionId (frontend-only, không BE):** encode thứ tự id → nén →
  base64. Gotcha: `/` an toàn trong query param nhưng KHÔNG trong path segment.
- **Exam UI theo đề thật:** pass/fail dùng `passingScore` thật; 1 item "Mô phỏng thi" tự trộn theo
  blueprint trên toàn ngân hàng; layout 2 cột + palette câu hỏi sticky/drawer; auto-vào thẳng phòng thi.

## Techniques
- **`build-content-loop` — vòng tự nhịp nhiều phần:** mỗi part = 1 Workflow nền → task-notification tự
  gọi lại → checkpoint (ghi file + `plan.mjs mark done`, plan bền trên đĩa) → tự phóng part kế; fallback
  ScheduleWakeup nếu treo; resume được kể cả phiên mới.
- **Evaluator–Optimizer loop** (sinh → đánh giá → lặp tới đạt chuẩn) — pattern chuẩn cho "chạy pipeline
  tới khi đầu ra đảm bảo".
- **Sinh cân blueprint + repartition deterministic:** `DOMAIN_WEIGHTS` course-aware + `pickByBlueprint`;
  rồi rải lại multi-ratio đều qua các mock **type-aware** trong khi giữ kích thước bằng nhau (65/65/65) —
  hai ràng buộc dễ xung đột.
- **Review-gate bắt lệch chuẩn:** gate phát hiện tiếng Việt sinh **không dấu** ("Ung dung") → từ chối +
  regenerate với chỉ thị "CÓ DẤU". User coi đây là gate hoạt động đúng.
- **Inline SVG theme-aware:** `currentColor` cho chữ/viền (kế thừa màu prose → tự đổi light/dark), tint mờ
  cố định (fill-opacity ~0.13–0.16), KHÔNG đặt `color` trên `<svg>`, bắt buộc `viewBox` + `<title>`/`<desc>`.
  Chọn idiom theo ngữ nghĩa: OSI = stacked layers (không phải tháp), CAP = tam giác, handshake = sequence,
  topology = node-edge, lifecycle = state-machine, hierarchy = tree.
- **Fan-out cần guard chống SPOF:** survey mỗi course chỉ 1 agent → agent chết (API "Connection closed
  mid-response") thì course bị bỏ trống âm thầm → guard phát hiện `lessonsIllustrated:0`/failures → retry.

## Gotchas — viết Workflow script (durable)
- Plain JS (không TS); **không** dùng fs / `Date.now` / `Math.random`.
- `args` tới dạng **JSON string** (phải `JSON.parse`); args lồng sâu/nhiều ký tự đặc biệt bị mangle →
  ghi list ra file cho agent đọc thay vì nhét vào args.
- Dùng param `schema` để ép output JSON có cấu trúc; agent cần Bash để làm file I/O.
- Registry `name` không nhận script vừa tạo giữa phiên → gọi bằng `scriptPath`.
- Harness bọc thân script trong async function → top-level await/return hợp lệ, nhưng `node --check` báo
  nhầm "Illegal return statement" (bỏ qua).

## Bugs (root cause)
- **boto3 `Config(retries={'max_attempts': N})`:** `max_attempts` là **tổng số lần thử gồm lần đầu**, nên
  số retry = N−1 (câu bị adversarial audit bắt). *(con số chính xác chưa xác minh lại từ doc.)*
- **TS "union type too complex to represent"** ở mảng literal ~1100+ phần tử → tách file chunked
  (`k1/k2...`, mỗi chunk 400) + **JSON sidecar** làm source of truth, regenerate `.ts`.
- **Appender regex `];` khớp nhầm `];` trong chuỗi câu hỏi** (vd `[1,2,3]`) → parse vỡ; fix bằng scanner
  tôn trọng string literal + chuyển sang JSON sidecar.
- **cwd dính giữa các bash call:** `cd web` để build làm lệnh `plan.mjs` sau chạy sai thư mục → luôn
  prefix đường dẫn tuyệt đối từ repo root.
- **highlight.js không tô màu:** import theme sáng `github.css` trên nền tối → token vô hình; fix bằng
  palette hljs theme-aware (atom-one) scope theo `.dark`. Hộp trắng cạnh tab = scrollbar `overflow-x-auto`
  → đổi flex-wrap.
- **`lesson.order` nhận số thập phân** (1.5 để chèn bài khỏi đánh số lại) render "Bài 1.5" ở 4 chỗ → phải
  dùng số nguyên liên tục.

Liên quan: [[digest-aws-2026-07-23]] · [[shipped-aws-2026-07-25]] (cái gì đã landed từ vòng loop này) ·
[[aws]] · [[aws-certification]] · [[learning-in-public]] · [[digest-moonie-2026-07-24]] (cùng bài học harness/gate).
