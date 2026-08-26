---
type: feedback
title: Nhặt đủ lane song song, đừng làm một task rồi dừng
summary: Skill cho tối đa 4 lane mỗi lượt mà tôi chỉ chạy 1 rồi dừng chờ — đó là tự thận trọng quá, không phải cẩn thận, và không cần `/loop` mới chạy song song được.
tags: [feedback, agent, automation, method, skills]
created: 2026-08-26
updated: 2026-08-26
source: project "ticket-mcrsv" — session history 2026-08-26
---

# Nhặt đủ lane song song, đừng làm một task rồi dừng

Nguyên văn user: *"cần làm được những task mà không bị block chứ? sao cứ làm 1 task xong dừng vậy?
hay là tôi phải chạy loop thì mới chạy?"*

Mỗi lượt `/looptasksv2` (và `/looptasks`), sau khi phân tích va chạm, phải nhặt **tối đa số task
rời nhau** trong hạn mức của skill — không dừng ở một task rồi ngồi chờ.

**Why:** hạn mức là 4 lane/lượt; chạy 1 lane rồi dừng cắt thông lượng xuống 1/4 mà **không đổi lại
được an toàn nào** — mỗi lane đã có worktree riêng, verifier riêng, lock riêng. Tôi tự đặt thêm một
ràng buộc không ai yêu cầu, rồi để user phải đi hỏi tại sao. Và `/loop` chỉ là cái đồng hồ; nó
không phải điều kiện để chạy song song — gọi thẳng skill cũng dispatch được đủ lane.

**How to apply:**
- Trước khi nhặt, phân tích va chạm **theo file thật** (`grep` vùng file của từng task), không phỏng
  đoán theo tên task. Task rời nhau → chạy cùng lượt.
- Chỉ giảm số lane khi có **lý do đo được** và nói ra: task đụng cùng file, máy hết chỗ (swap/RAM),
  hoặc verifier sẽ build/jest đè lên file lane khác đang sửa (khi đó verify tuần tự — xem
  [[digest-subscriptions-2026-08-22]]).
- Không cần user gọi `/loop` để có song song. Nếu lượt đó thật sự không nhặt được gì, **nói rõ lý do**
  thay vì im lặng dừng — tick rỗng có chủ đích là hợp lệ, dừng vì thận trọng thì không.

Liên quan: [[feedback-dung-xin-chot-khi-chi-thi-da-co]] · [[feedback-dung-loop-khi-rong]] ·
[[cham-viec-agent-nen]]
