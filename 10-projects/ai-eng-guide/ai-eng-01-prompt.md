---
type: note
title: Layer 1 — Prompt
summary: Prompt engineering cho team Avada — prompt là bản giao việc phải có mục tiêu + done-criteria + ràng buộc; cạm bẫy hay gặp là yêu cầu mơ hồ, gộp nhiều việc, và gói việc cho vừa một phiên chat.
tags: [ai, tooling, method, writing]
created: 2026-08-05
---

# Layer 1 — Prompt

## Layer này là gì

Prompt = yêu cầu bạn gõ vào. Vai của bạn: **operator**.

Đây là layer duy nhất ai cũng dùng, nên cũng là layer bị đánh giá thấp nhất.
Cách nghĩ đúng: prompt không phải câu hỏi, mà là **bản giao việc cho một dev mới
vào công ty hôm nay** — giỏi, đọc code nhanh, nhưng không biết gì về app, không biết
convention team, và không dám hỏi lại.

## Khi nào bạn đang ở đây

Bạn đang ở layer 1 khi kết quả sai vì **model hiểu sai việc**, chứ không phải vì nó
thiếu thông tin (đó là layer 2) hay thiếu công cụ kiểm chứng (layer 3).

Dấu hiệu:

- Nó làm đúng thứ nó hiểu, nhưng không phải thứ bạn muốn
- Bạn phải nhắn thêm 3–4 lượt "không, ý tôi là…"
- Nó làm quá tay: bạn nhờ sửa 1 hàm, nó refactor cả file

## Cơ bản

**1. Nói kết quả mong muốn, không nói cách làm** — trừ khi cách làm là ràng buộc thật.

- Đừng: `thêm try catch vào hàm syncOrder`
- Nên: `sync order đang crash cả batch khi 1 order lỗi. Cần: 1 order lỗi thì log rồi chạy tiếp các order còn lại`

Cái thứ hai để model tự chọn cách; cái đầu ép nó dùng cách bạn nghĩ ra trong 5 giây.

**2. Kèm done-criteria kiểm được bằng lệnh.**

- Đừng: `sửa cho nó chạy được`
- Nên: `xong khi: tsc exit 0, yarn test packages/functions pass, không đụng file ngoài packages/functions/src/handlers/`

Không có done-criteria thì model tự định nghĩa "xong" — và nó luôn định nghĩa rộng rãi
với chính nó.

**3. Nêu cả cái KHÔNG được làm.** Ràng buộc âm hiệu quả hơn bạn tưởng:

```
- KHÔNG đổi schema Firestore
- KHÔNG thêm dependency mới
- KHÔNG commit, chỉ implement rồi báo lại
```

Ở team mình: "implement thử" mặc định = làm nhưng **chưa commit**. Cứ ghi rõ ra.

**4. Một prompt một việc.** Gộp "fix bug A, thêm feature B, cập nhật docs" vào một tin
thì thường nhận về 3 lát mỏng thay vì 1 việc xong.

**5. Text hiển thị cho merchant phải là tiếng Anh** — dù mình trao đổi tiếng Việt.
Ghi rõ trong prompt, không thì nó viết tiếng Việt vào order note.

## Nâng cao

**Bảo nó hỏi lại khi thiếu thông tin.** Mặc định model đoán. Thêm một câu
"nếu chỗ nào chưa rõ thì hỏi trước khi code" đổi hẳn hành vi ở task mơ hồ.

**Đừng gói việc cho vừa một phiên chat.** Một tin "làm việc A cho tôi" thường nhận về
bản làm qua loa + tóm tắt. Việc lớn thì chia phần và làm tới hoàn chỉnh qua nhiều phiên
— đây là lỗi lặp lại nhiều lần ở project aws, tới mức phải sinh ra workflow `thorough`
để chống ([[digest-aws-2026-07-27]]).

**Prompt cho subagent khắt khe hơn prompt cho mình.** Subagent không thấy lịch sử chat,
không hỏi lại được giữa chừng. Brief của nó phải tự đứng một mình: mô tả task **nguyên văn**,
file liên quan, done-criteria, convention repo, và danh sách việc cấm.

**Yêu cầu bằng chứng, không phải lời kể.** Thay vì "báo lại kết quả", ghi
"paste output lệnh test kèm exit code". Xem [[ai-eng-03-harness]] — đây là chỗ layer 1
nối vào layer 3.

## Setup — khuôn giao việc

Layer này không có gì để cài. Chỉ có một khuôn để copy khi việc đủ lớn:

```
Bối cảnh: <app nào, đang sai/thiếu ở đâu>
Cần: <kết quả mong muốn — không phải cách làm>
File liên quan: <đường dẫn cụ thể, hoặc "grep <từ khoá> trong packages/functions">

Xong khi:
  - yarn tsc --noEmit → exit 0
  - yarn test packages/functions → pass
  - git status --porcelain → trống

Không được:
  - đổi schema Firestore
  - thêm dependency mới
  - commit (implement rồi báo lại, tôi review)

Chưa rõ chỗ nào thì hỏi trước khi code.
```

Giao cho subagent thì thêm ba thứ nó không tự biết: **mô tả task nguyên văn**
(đừng tóm tắt lại), convention repo, và câu cấm chạy git.

Ví dụ thật, brief `/looptasks` gắn vào mọi subagent:

> Chỉ sửa file và chạy build/test. **KHÔNG chạy git** (add/commit/checkout/stash/branch/merge).
> **KHÔNG sửa file task list.** Không mở rộng scope ngoài task được giao.
> Xong thì report: file nào đã sửa, cách làm, kết quả verify.

## Cạm bẫy

| Đừng | Nên thay bằng |
|---|---|
| `improve cái này` / `optimize hàm này` — không có tiêu chí thì "improve" nghĩa là gì cũng được | `hàm này chạy 8s với 500 subscription, cần dưới 2s; không đổi signature` |
| `fix cái bug tôi vừa nói` sau 40 lượt chat — nó có thể đã trôi khỏi phần model còn nhớ rõ | Nhắc lại 1 dòng: `bug: webhook orders/create bị gọi 2 lần cho cùng orderId` |
| Đưa suy đoán của mình như thể là sự thật: `chắc do cache Redis, sửa cache đi` | `nghi do cache Redis nhưng chưa xác minh — xác nhận trước khi sửa` |
| Khen/động viên thay cho chỉ dẫn: `làm tốt vào nhé` — không mang thông tin nào | Ràng buộc cụ thể |
| Emoji rải trong yêu cầu output — model sẽ trả emoji lại. Text đầy emoji trông "AI" và ra tới khách hàng thì lộ ([[digest-aws-2026-07-24]]) | Ghi thẳng "không dùng emoji trong output"; cần icon thì dùng icon lib (`lucide-react`) |

## Checklist

Trước khi Enter, prompt của bạn có:

- [ ] Kết quả mong muốn, không phải cách làm (trừ khi cách làm là ràng buộc)
- [ ] Done-criteria kiểm được bằng lệnh
- [ ] Ràng buộc âm — cái không được đụng
- [ ] Đúng một việc
- [ ] Nói rõ có được commit hay không
- [ ] Text ra merchant → ghi rõ tiếng Anh

## Liên quan

- [[ai-eng-02-context]] — layer tiếp theo: cho nó thấy đúng thứ cần thấy
- [[ai-eng-guide]] — mục lục
- [[feedback-follow-conventions]]
