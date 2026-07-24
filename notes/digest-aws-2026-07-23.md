---
type: note
title: Digest AWS-course 2026-07-23 — build cả chứng chỉ bằng multi-agent workflow + bẫy SVG-trong-markdown
summary: Dựng course/ngân hàng đề AWS quy mô lớn bằng workflow author→critic + plan bền trên đĩa; root cause SVG vỡ render do dòng trống (CommonMark), và loạt kỹ thuật resume/verify ground-truth.
tags: [aws, certification, method, tooling, nextjs, react]
created: 2026-07-23
source: project "aws" — session history (mined 2026-07-23)
---

# Digest AWS-course — 2026-07-23

App học AWS (Next.js 14 App Router, SSG, react-markdown + rehype-raw): dựng lesson,
ngân hàng đề CLF-C02/SAA-C03/DVA-C02, và cả một course Blockchain 53 bài. *(digest đầu tiên cho [[aws]])*

## Feedback

- **Đừng nhồi việc lớn vào 1 session.** User yêu cầu tách theo nhịp *loop → quality gate → loop* để giữ chất lượng; việc lớn (dựng cả 1 chứng chỉ) phải chia phase, mỗi phase 1 workflow, người ở giữa vẫn nắm được.
- **Khi hỏi cụt "làm việc A" thì hay bị làm qua loa/tiết kiệm.** User nói thẳng điểm này → mặc định phải làm đầy đủ, sâu, và **spawn agent song song** cho phần fan-out được. Cùng một failure-mode với [[digest-moonie-2026-07-17]].

## Decisions

- **Dựng nội dung quy mô lớn = workflow đa agent author→critic, không viết tay tuần tự.** *Why:* 771 câu dịch (~1.58M token), 53 bài blockchain (57 agent, 1.8M token) — một context không kham nổi và chất lượng tụt. *Tradeoff:* tốn token + phải verify ground-truth, đổi lại phủ rộng + song song.
- **Đóng gói quy trình thành project-level skill** (`author-exam` / `review-exam` / `build-content-loop`) trong `.claude/skills/` (commit cùng repo, cả team dùng). *Why:* skill làm-trong-1-session yếu với việc lớn → tách phase + plan bền để resume.
- **Sinh đề theo blueprint chính thức** (CLF-C02 D1/D2/D3/D4 15/30/34/12%…), lấy task statements từ guide AWS làm xương sống; "Mô phỏng thi" là 1 item trộn cả ngân hàng theo trọng số (`pickByBlueprint` course-aware).

## Bugs (root cause)

- **SVG inline vỡ render (hiện trống trơn) do DÒNG TRỐNG bên trong `<svg>`.** CommonMark coi dòng trống là dấu KẾT THÚC khối HTML → rehype-raw tách SVG, shape mồ côi ngoài `<svg>`. 279/483 khối dính lỗi. *Fix:* xoá mọi dòng trống trong khối svg; **gate** bằng regex `/\n[ \t]*\n/` để CI fail sớm. User phát hiện bằng screenshot (in-app), không gate nào bắt được trước đó.
- **`&` thô trong SVG → lỗi XML, render fail.** Escape thành `&amp;` (4 file dính lúc agent bị gián đoạn chưa qua critic).
- **CLF-C02 "Bài N" lệch số hiển thị.** Sidebar dùng field `order` (nhóm theo domain), không phải số trong tên file → renumber theo `order`.
- **Next 14.2 flaky ở bước "Collecting build traces" (`nft.json`)** — bug đã biết của Next, không liên quan code; compile + 52/52 static page vẫn OK.

## Techniques

- **Truyền list qua FILE, không qua `args` workflow.** Args lồng sâu / nhiều ký tự đặc biệt bị mangle → workflow trả rỗng (`total:0`). Ghi danh sách ra `/tmp/*.json`, 1 agent đọc file → bền hơn hẳn (bài học lặp lại nhiều lần).
- **Verify ground-truth, KHÔNG tin report của workflow:** kiểm file tồn tại + SVG gate + build compile + spot-check độ sâu/độ dài bài. Critic (author→critic) bắt bug tốt nhưng vẫn phải verify độc lập.
- **QA SVG nhiều lớp:** `rsvg-convert` render + blank-line gate + **screenshot in-app THẬT** (lớp cuối thiết yếu, ban đầu thiếu). Gate rsvg toàn dự án chậm → chạy riêng 1 thư mục (`lessons/blockchain`) để xác nhận nhanh.
- **Plan bền trên đĩa + ghi memory** để resume build đa phase qua session/restart (workflow GĐ2 bị gián đoạn, đọc ground-truth thấy 19/24 đã viết → chỉ viết nốt 5 bài thiếu).
- **Đề cố định chia sẻ được không cần backend:** hash thứ tự `questionId` → link mở ra đúng đề đã trộn (deterministic seed).
- **Next.js SSG hostable Vercel** (`generateStaticParams`); route `exam` nặng First Load JS hơn phần còn lại → tách bundle nếu cần.

## Liên kết gợi ý

[[aws]] · [[aws-certification]] · [[digest-moonie-2026-07-17]] (cùng pattern harness generator→evaluator) · [[moc-learning-pkm]] · [[learning-in-public]]
