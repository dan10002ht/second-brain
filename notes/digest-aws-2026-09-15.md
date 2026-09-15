---
type: note
title: Digest aws — 2026-09-15 (nhập 780 câu đề SAA-C03 và đo gap bài học bằng chỉ số chạy lại được)
summary: Bóc 12 bộ đề PDF phải dùng thụt lề của `pdftotext -layout` chứ không dùng marker, "ẩn nguồn" không chỉ là sửa commit message mà là quét dấu vết thương hiệu trong chính dữ liệu, và một skill audit không thread `args` đã trả về báo cáo trông hợp lệ nhưng trả lời câu hỏi khác.
tags: [aws, learning, certification, agent, method, tooling]
created: 2026-09-15
updated: 2026-09-15
source: project `aws` — session history (session 16f96d6d nhập đề + đo gap; các project `wf_*` là subagent của chính session này)
---

# Digest — `aws`, 2026-09-15

Phần course `gameserver` / `system-design` đã ghi ở [[digest-aws-2026-09-14]] và
[[shipped-aws-2026-09-15]]. Note này **CHỈ phần mới**: nhập 12 bộ đề SAA-C03 (224 → 1004 câu),
đo gap bài học, và ba bài mới + một vòng enrich.

## Bugs — parser đề thi sai theo kiểu vẫn "chạy xanh"

**Luật tách stem/option sai mà 678/780 câu vẫn đúng.** Parser v1 lấy "stem = đoạn dài nhất còn lại"
và dựa vào marker `Your answer is correct`; hai nguồn (Dojo, Neal) đặt marker **ngược chiều nhau**,
và 152/780 câu (19%) rơi vào ca mập mờ. Chỉ lộ ra khi **critic đối chiếu bản viết lại với bản gốc** —
critic bắt được lỗi nằm trong parser, không nằm trong bản viết lại.

Cách chữa đáng giữ: **bỏ marker, dùng thụt lề**. `pdftotext -layout` giữ thụt lề nên ranh giới
stem/option rất sạch (xử lý được cả câu có code block), nhưng **mất** ranh giới giữa các option;
bản `pdftotext` thường thì ngược lại. Ghép hai nguồn mới đủ. Một bẫy nữa: `base` thụt lề **không**
lấy được bằng `min`, vì có dòng marker thụt nông hơn cả stem — phải neo theo dòng đầu của stem.

**Đo chênh giữa hai parser thay vì tin parser mới.** 678/780 câu giống hệt nhau (kể cả đáp án) ⇒ chỉ
**102 câu** phải làm lại, không phải làm lại cả bộ. Phép so hai lần chạy độc lập rẻ hơn nhiều so với
niềm tin vào bản mới.

**Option bị ngắt qua trang thành "option" riêng.** 8/9 câu lệch ở vòng validate cuối đều cùng một
gốc: đuôi câu (`'source bucket.'`, `'response times.'`) rơi sang trang sau và thành một option độc
lập. Đếm số option khớp bản gốc là phép kiểm bắt được lớp lỗi này.

**Agent đúng, tôi sai — hai lần trong cùng một pass.** Tôi định ghi "agent sai" cho một câu Macie;
tra AWS docs thì finding type `SensitiveData:S3Object/Health` **không tồn tại**. Tương tự ở vòng
critic bài mới: 2/3 cáo buộc đúng, 1 cáo buộc đúng hướng nhưng **kèm số sai của chính critic** (LAG:
tối đa 4 connection với cổng 1/10 Gbps, **2** với 100 Gbps). Luật rút ra: cáo buộc của critic là
giả thuyết, phải tra nguồn có thẩm quyền trước khi sửa theo.

**Lỗi dạy sai trong bài đang chạy.** Audit chỉ ra ba chỗ trong bài IAM/KMS, cả ba đều đúng khi tra
docs: cross-account **cần CẢ HAI** phía cho phép (bài trả lời "Có" rồi tự mâu thuẫn trong ngoặc);
SCP với root; và KMS rotation "mỗi năm, không đổi được" đã lỗi thời — nay **cấu hình 90–2560 ngày**
(mặc định 365) + on-demand rotation (tối đa 25 lần/key). *Kiến thức sai tệ hơn kiến thức thiếu* —
đó là lý do pass sửa nội dung chạy trước pass viết thêm bài.

## Techniques

**Skill audit bỏ qua `args` → báo cáo trông hợp lệ nhưng trả lời câu khác.** Audit 4 domain trả về
coverage 78–86, verdict "minor-gaps", danh sách missing hoàn toàn khác chẩn đoán của tôi. Nguyên
nhân: script của skill **không hề dùng `args`** (0 lần xuất hiện trong 63 dòng) nên brief bị bỏ qua,
agent chạy prompt mặc định. Tách riêng ở [[args-khong-toi-prompt-agent]].

**"Ẩn nguồn" không phải việc của commit message.** Yêu cầu là đừng để lộ nguồn đề (Dojo/Neal). Dấu
vết thật nằm rải trong **nội dung câu hỏi** (`api.tutorialsdojo.com`, `tdojo-finance`,
`DirectoryTutorialsDojo1234`), trong nhãn hiển thị của app, và trong comment của chính gate
(`sets.ts`, `check.mjs`). Phép nghiệm thu là `0 lần xuất hiện tên nguồn trong toàn bộ diff`, không
phải "đã sửa message".

**Đo gap bằng chỉ số chạy lại được, và nói rõ chỉ số đo gì.** Biến phép đo thành script:

| Chỉ số | Trước | Sau |
|---|---|---|
| Câu chạm service không có trong bài được gán (đề bài **hoặc** đáp án đúng) | 20,6% | 14,9% |
| Chỉ số chặt (bỏ service chỉ xuất hiện ở phương án nhiễu) | — | 1,0% → **0,1%** (8 → 1 câu) |

Hai cảnh báo đi kèm: cột "số lần bài nhắc service" là **tần suất, không phải độ sâu** (Direct Connect
15 lần trong 55.000 từ có thể chỉ là nhắc tên); và phần lớn mức giảm đến từ việc **gán lại câu về
đúng bài** (41 câu, luật bảo thủ: chỉ chuyển khi bài cũ *không* dạy và bài đích *có* dạy), không
phải từ việc viết thêm.

**Script ghi đè mảng theo định dạng một-câu-một-dòng làm diff `-18.574` dòng.** Không đọc review
được ⇒ phải giữ nguyên format file, diff về đúng `46 dòng đổi / 46 dòng thêm` = đúng số câu gán lại.
Cùng họ với việc script ghi hỏng file vì lỗi slicing (`index('= [')+2` trỏ vào chính `[`) — khôi phục
từ backup trước khi soi, không sửa chồng lên bản hỏng.

**Gate của repo bắt được thứ cả critic lẫn tôi bỏ sót:** dòng trống bên trong khối `<svg>` làm vỡ
render `react-markdown`. Ngược lại, gate không bắt được 2 link `[[slug]]` gãy vì file **có tồn tại
trên đĩa** nhưng chưa đăng ký trong `lessons.ts`.

## Context

- Hook `guard-main-branch.py` chặn commit/push thẳng `main` ở repo `aws`, **trái với ghi nhớ cũ**
  ("repo này push thẳng được"). Xử đúng: theo hook (cấu hình hiện hành) rồi thêm `aws` vào
  `EXEMPT_REPOS` có sẵn, và sửa lại ghi nhớ — xem [[feedback-git-guard-chi-chan-master]].
- Không lấy 392 ảnh PNG của repo nguồn system-design: nội dung không khớp bài đã viết lại, và ảnh
  raster không sửa được — giữ SVG tự vẽ.
- Gate `check.mjs` fail khi tỉ lệ multi-answer > 15%, nhưng đề gốc Dojo có đề tới **24,6%**
  (dojo_2: 16/65). Miễn trừ cho mock 4–15, **giữ nguyên ngưỡng cho mock 1–3** để gate còn đỏ được.
- Ba bài mới: `ch3-05-multi-account-governance`, `ch3-06-operations-iac`, `ch2-07-hybrid-connectivity`
  (18 → 21 bài SAA); một vòng enrich 6 bài cũ, mỗi bài một subagent + một critic độc lập.

Liên quan: [[digest-aws-2026-09-14]] · [[aws]] · [[aws-certification]] · [[soat-cheo-noi-dung-sinh-song-song]] ·
[[bang-chung-phan-biet-duoc]] · [[viet-tai-lieu-day-duoc]] · [[args-khong-toi-prompt-agent]]
