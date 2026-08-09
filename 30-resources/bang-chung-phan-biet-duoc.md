---
type: resource
title: Bằng chứng phân biệt được — cách bác một lời khai "đã ổn" của agent
summary: Mọi kết luận miễn trừ công việc ("gate đỏ là pre-existing", "không thấy log", "đo ra 0", "verifier PASS") đều là bằng chứng vắng mặt hoặc tự chấm; chỉ bằng chứng phân biệt được hai giả thuyết mới kết luận được — và nó luôn rẻ hơn hậu quả.
tags: [ai, tooling, method, skills, debug]
created: 2026-08-09
updated: 2026-08-09
source: [[digest-pdf-2026-08-06]] · [[digest-pdf-2026-08-07]] · [[digest-subscriptions-2026-08-06]] · [[digest-subscriptions-2026-08-07]] · [[digest-aws-2026-08-03]]
---

# Bằng chứng phân biệt được

## Vấn đề

Khi để agent (hoặc chính mình) làm việc rồi tự báo cáo, dạng kết luận nguy hiểm nhất
không phải kết luận sai — mà là kết luận **miễn trừ công việc tiếp theo**:

> *"2 suite fail là lỗi có sẵn."* · *"30 giờ không có dòng log nào ⇒ request không tới."* ·
> *"Đo 10 lần đều ra 0 ⇒ fix ăn."* · *"Verifier PASS."* · *"Workflow báo success."*

Điểm chung: tất cả đều là **bằng chứng vắng mặt** (không thấy lỗi / không thấy log /
không thấy shift) hoặc **báo cáo tự chấm** (agent chấm chính việc nó vừa làm). Cả hai
loại đều tương thích với *hai* giả thuyết cùng lúc — "mọi thứ ổn" và "phép đo hỏng" —
nên tự thân chúng không chọn được cái nào.

Luật:

> Một bằng chứng chỉ đáng tin khi nó cho **kết quả khác nhau** giữa "ổn" và "hỏng".
> Nếu cả hai trường hợp đều ra cùng một quan sát, bạn chưa có bằng chứng, bạn có một sự im lặng.

## Bảng tra

| Lời khai | Vì sao chưa chứng minh gì | Bằng chứng phân biệt được |
|---|---|---|
| "Gate đỏ là pre-existing" | Repo chính cũng đỏ ⇒ lời khai *đúng* mà chẩn đoán vẫn *sai* (thiếu file env gitignored trong worktree) | Chạy lại gate trên **base sạch** (`origin/master` mới fetch) và đối chiếu danh sách file fail với `git diff --name-only` — không giao nhau mới là pre-existing. Rồi vẫn hỏi tiếp **vì sao đỏ** |
| "Không thấy log nào" | Flow có thể **không log định danh** (`shopId`) — đó là thiếu observability, không phải vắng request | Một field mốc thời gian trên chính bản ghi (`updatedAt` không đổi) — nó phân biệt được "save fail" với "request không tới" |
| "Đo A/B ra 0" | Trang vỡ cũng ra 0; tab nền cũng ra 0; harness hỏng cũng ra 0 | **Control test**: cố ý tạo ra hiệu ứng cần đo. Control ra 0 ⇒ vứt cả phép đo. Cộng một assert "màn hình đã render thật" |
| "Verifier PASS" | Verifier trace được đường code, **không** chứng minh được hành vi UI | Ảnh chụp màn hình / probe DOM lúc đang chạy — bằng chứng rẻ nhất lật được một PASS sai |
| "Workflow / agent báo success" | Agent chết âm thầm, merge hỏng file, dịch sót — report vẫn xanh | Ground truth trên đĩa: `grep -c`, đếm file, build thật, `git diff --stat` |
| "Đoạn code này làm X" (agent điều tra nói) | Đọc lướt sai một dấu ngoặc là đủ (`Number(x \|\| 0)` ≠ `Number(x) \|\| 0`) | Đọc lại **chính biểu thức đó**, không nhận nguyên trạng bản tóm tắt |
| "Fix đã verified 0.0141 → 0" | Có thể vừa sửa file **không được serve** | Xác nhận đường phục vụ thật / đọc lại giá trị fix đã ghi ra (storage, DB) để chứng minh code mới **có chạy** |

## Vì sao đáng thành phản xạ

Chi phí một bằng chứng phân biệt được thường là **một lệnh**: một `git diff --name-only`,
một control test 3 dòng, một truy vấn `updatedAt`. Chi phí bỏ qua là miễn trừ một gate
lẽ ra xanh thật, hoặc ship một fix chưa từng chạy — và cả hai chỉ lộ ra ở production.

Đây cũng chính là chỗ **harness khác graph**: graph quyết định *edge nào chạy tiếp*,
harness quyết định *cái gì được phép đi qua* (xem [[looptasks-vs-workflow]]). Thêm agent
mà không thêm gate thì chỉ là trả nhiều token hơn để sai một cách tự tin hơn ở quy mô lớn hơn.

## Áp dụng ở đâu

Bất cứ lúc nào một kết luận **cho phép dừng điều tra**. Ba câu hỏi:

1. Nếu giả thuyết ngược lại đúng, tôi có quan sát được điều gì **khác** không? Không → chưa có bằng chứng.
2. Cái đang báo cáo là *đo được* hay là *lời khai*?
3. Có control nào chứng minh dụng cụ đo còn sống không?

## Liên quan

- [[do-layout-shift-bang-browser-automation]] — bản chuyên sâu của luật này cho một loại phép đo cụ thể (CLS).
- [[2026-08-04-looptasks-verifier-doc-lap]] · [[2026-08-07-phan-tang-verifier]] — verifier context sạch, và phân tầng theo rủi ro.
- [[graph-engineering]] · [[looptasks-vs-workflow]] — gate nằm ở đâu trong 5 lớp.
- Nguồn: [[digest-pdf-2026-08-06]] · [[digest-pdf-2026-08-07]] · [[digest-subscriptions-2026-08-06]] · [[digest-subscriptions-2026-08-07]] · [[digest-aws-2026-08-03]]
