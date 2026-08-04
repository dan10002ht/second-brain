---
type: note
title: Digest AWS learning platform — 2026-08-03 (track hạ tầng, blockchain, audit SAA-C03)
summary: CHỈ phần mới — công thức dựng course mới (scaffold + gold lesson + fan-out author→critic đọc job từ file), audit SAA-C03 theo task statements phát hiện 2 lỗi factual, và loạt gotcha khi để agent trong Workflow tự thao tác file.
tags: [aws, certification, learning, ai, tooling]
created: 2026-08-03
source: project "aws" (+ 4 workflow run wf_*) — session history
---

# AWS learning platform — digest 2026-08-03

> CHỈ phần **chưa có** trong [[digest-aws-2026-07-27]] / [[digest-aws-2026-07-28]] /
> [[shipped-aws-2026-07-29]]. SVG dòng-trống, hash link đề thi, dịch đề sang tiếng Anh,
> re-id theo offset, `/search-index.json` force-static đã ghi ở đó.

## Feedback (cách làm việc)

- **"Làm rất tiết kiệm, qua loa trong một lần chat"** là failure mode user nêu đích
  danh → lý do dựng wrapper orchestration thay vì trả lời từng nhịp.
- **Fire-and-forget của Workflow + `/loop` quan sát tiến độ** là cặp bù trừ: workflow
  chạy nền hiệu quả nhưng không báo cáo, loop quét plan file để report realtime.
- Kỷ luật lặp lại: **không tin report của agent/workflow** — verify bằng ground truth
  (`grep -c '<svg'`, đếm file trên đĩa, build thật). Đã cứu ít nhất 3 lần trong đợt này.

## Decisions

- **Hệ thống hoá Kafka/Redis/MQ/k8s thành một track phân tầng**, không phải các bài lẻ:
  Distributed Foundations → Data & Caching → Messaging → Cloud Native/K8s, cộng 2 chương
  mở rộng (SRE Observability sâu, BACKEND Service Communication). Why: học nền trước thì
  các bài sau mới có chỗ bám.
- **Mỗi course mới đi theo đúng một công thức**: (1) plan file **bền trên đĩa**,
  (2) đăng ký course/chapters/lessons vào 3 file data với `available:false`,
  (3) tự tay viết **một bài gold-standard làm style-ref**, (4) fan-out phần còn lại
  bằng workflow author→critic, (5) verify ground-truth → flip `available:true` → build → push.
- **Truyền job cho workflow bằng FILE, không bằng `args`** — args lồng sâu + ký tự đặc
  biệt bị mangle, workflow trả `total:0`. Một agent đọc list từ file rồi mới fan-out.
- **Tách chương "thực chiến" riêng** cho migration IO / index / ảnh hưởng replica thay vì
  nhét vào bài generic — đây là cả một lớp kiến thức vận hành data ở quy mô lớn.

## Bugs (root cause)

- **Đánh số bài lệch**: title ghi "Bài N" theo **số thứ tự file**, còn sidebar sắp theo
  field `order`. CLF-C02 tổ chức theo 4 domain nên order hiển thị là
  1,4,5,8,9,10,11,18,2,3,... → "bài 18 nhưng title là bài 8". Fix: renumber "Bài N" theo
  `order`, không theo tên file. Bài học: **khi group theo domain, số hiển thị phải bám `order`**.
- **2 lỗi factual trong bài SAA-C03** (audit lộ ra): KMS FIPS Level, và Aurora Serverless v2
  scale-to-0 (mâu thuẫn ở 2 chỗ; đúng là có từ 11/2024). Critic của phase enrich còn bắt
  thêm: MACsec chỉ 10/100 Gbps, nghĩa `RestrictPublicBuckets`.
- **Merge agent làm hỏng `generatedQuestions.ts`** (parse failed) dù workflow báo success →
  restore từ git, merge tay từ file `/tmp` đã dịch. Và **dịch sót nhiều đợt**: 754/771 →
  còn 17, rồi còn 6 câu CLF-C02. Chỉ `grep` mới phát hiện, report không.
- **Agent trong Workflow không có Node API** (`require`, `fs`) → template dùng file I/O
  fail. Sửa: cho agent thao tác qua **Bash**, và dùng tham số **`schema`** để ép trả JSON
  có cấu trúc (agent extract trước đó trả text tự do nên parse hỏng).
- **`claude` gõ ra `clang`** — lệnh bị trỏ nhầm sang trình biên dịch C
  (`clang: error: unsupported option '--resume'`). Không phải lỗi Claude Code; là va chạm
  PATH/alias trên máy.
- Gold lesson tự viết cũng dính raw `&` (`Config & Secret`) — gate SVG/entity phải chạy cả
  trên bài do chính mình viết, không chỉ bài của agent.

## Techniques

- **Audit độ phủ theo *task statements* của exam guide**, fan-out **1 agent/domain**, mỗi
  agent đọc **toàn bộ** bài trong domain và chấm từng mục: *phủ tốt / mỏng / thiếu hẳn*,
  trả JSON có `verdict`, `coverageScore`, `wellCovered`, `thin`, `missing` (kèm khuyến nghị
  cụ thể: thêm vào bài nào / tách bài mới). Dặn rõ **"chỉ báo gap THẬT, đừng bịa"**.
  → Kết quả: lộ ra TS5 (Data Ingestion & Analytics) thiếu hẳn → viết `ch2-06`.
- **Enrich bài đã có bằng agent — luật cứng**: đọc full file trước, **CHỈ CHÈN THÊM**
  (dùng Edit), tuyệt đối không xoá/viết lại phần đang có trừ khi task nói rõ "SỬA"; chèn
  đúng section; match style (bảng Markdown cho cặp decision, callout `> 🪤 Bẫy thi:` / `> 💡`).
  Sau đó một agent **kiểm định độc lập** cùng checklist và tự sửa, trả
  `{file, ok, tasksDone, issuesFixed[]}`.
- **Prompt sinh quiz tái dùng được** (đã validate qua ~1.700 câu): mỗi câu là một **tình
  huống**, không định nghĩa khô khan; `single` = đúng 1 index/4 lựa chọn, `multi` = ≥2/5;
  phân bổ ~30/50/20 easy/medium/hard; **`explanation` shuffle-safe** — dòng đầu tóm tắt,
  các dòng sau bắt đầu bằng `✓ `/`✗ ` và tham chiếu lựa chọn **theo NỘI DUNG, tuyệt đối
  không nhắc A/B/C/D** (vì options bị shuffle lúc render). Giữ tên dịch vụ AWS tiếng Anh,
  phần còn lại tiếng Việt có dấu. Luôn có agent **reviewer khó tính** đối chiếu lại bài học.
- **Câu hỏi gắn với bài mới** dùng id scheme riêng (`saa-ext-NNN` + `domain`, `lesson`) và
  merge bằng **insert surgical** (chèn object trước `]`) thay vì rewrite cả file 17k dòng —
  diff gọn hơn nhiều.
- **`⌘K` search index là force-static**, sinh lúc `next build` từ `buildContentIndex()`
  (chỉ lấy bài `available:true`) → thêm bài xong phải flip available **rồi** build lại;
  verify bằng chính file `search-index.json.body`, không phải `.meta`.

## Liên kết

[[aws]] · [[aws-certification]] · [[digest-aws-2026-07-27]] · [[digest-aws-2026-07-28]] ·
[[shipped-aws-2026-07-29]] · [[moc-learning-pkm]] · [[learning-in-public]]
