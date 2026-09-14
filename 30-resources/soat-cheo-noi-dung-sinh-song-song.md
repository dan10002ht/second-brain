---
type: resource
title: Soát chéo nội dung sinh song song — lỗi nằm giữa các phần, không nằm trong phần nào
summary: Khi N agent viết N phần của cùng một tài liệu, mỗi phần có thể đúng hoàn toàn mà tổng thể vẫn sai — vì agent không đọc được phần của nhau nên tự bịa hệ số, đặt nhãn khác nhau, và không ai kiểm được tính nhất quán nội bộ của một câu; ba phép kiểm này phải do người điều phối làm, không delegate được.
tags: [agent, method, writing, learning, automation]
created: 2026-09-14
updated: 2026-09-14
source: project `aws` — session history 2026-09-09→14 (course `gameserver` 42 bài, 10 chương, subagent viết song song)
---

# Soát chéo nội dung sinh song song

Áp cho mọi lượt fan-out sinh nội dung: bài học, guide nhiều chương, báo cáo nhiều mục, doc migration
nhiều phần. Không áp cho code (code có gate; văn xuôi thì không — xem [[viet-tai-lieu-day-duoc]]).

## Tiền đề: verify từng phần là chưa đủ

Quy trình mặc định — mỗi agent viết một phần, người điều phối verify từng phần bằng cách tính lại
mọi con số — bắt được lỗi *trong* một phần. Nó **không** bắt được ba lớp lỗi nằm **giữa** các phần
hoặc **giữa hai vế của cùng một câu**. Cả ba lớp dưới đây đều có ca thật trong course 42 bài, và cả
ba đều đi qua sạch mọi gate máy móc (build, type-check, lint, validate SVG, trùng id).

## Ba phép kiểm chỉ người điều phối làm được

**1. Hệ số vay mượn giữa các phần.** Agent viết phần 26 cần trích số của phần 24 mà nó chưa đọc →
nó **tự đặt** một con số nghe hợp lý (`10×`, `×4`, `×2,5`) thay vì nói là không biết. Ca thật: số đo
của phần nguồn là `8,67×`. Phép kiểm: liệt kê mọi con số trong phần X có nguồn ở phần Y, rồi mở
phần Y ra đối chiếu — không hỏi lại agent.

**2. Nhãn và đơn vị lệch giữa các phần.** Cùng một thang ba mức, phần này gọi `A/B/C`, phần kia gọi
`(a)/(b)/(c)`. Cùng một đại lượng, phần này dùng KB, phần kia KiB (lệch 320 vs 328 MB); một phần
suýt trộn ns với ms. Phép kiểm: quét thuật ngữ + đơn vị chuẩn hoá trước khi đóng một chương.

**3. Tính nhất quán nội bộ của một câu.** Hai con số đều đúng, phép tính đều đúng, mà dấu bằng nối
chúng lại thì sai:

- `35,4 MB/s = 297,1 Mbps` — `35,4 × 8 = 283,2`.
- "Chênh đúng **19 lần**" đặt ngay dưới bảng có cột `90` và `630` — `630/90 = 7,0`; số 19 đúng cho
  một đại lượng khác trong cùng bài.

Đây là lớp khó thấy nhất vì "kiểm lại từng con số" vẫn cho kết quả **khớp**. Phải đọc *quan hệ* giữa
các số, không chỉ đọc số.

## Xung đột số ≠ có người sai

Hai phần báo hai con số khác nhau cho cùng hiện tượng (`13,96%` vs `19,92%` cho lệch FMA) — đo độc
lập ra **cả hai đều đúng**, chỉ khác điều kiện đo (phân phối `[0,1)` vs `[-1,1]`, cỡ mẫu khác). Nên
bước đầu khi thấy xung đột là **đọc điều kiện đo của cả hai**, rồi mới tự đo. Hoà giải sai hướng còn
tệ hơn để nguyên: nó xoá mất một điều kiện đúng.

Hệ quả kèm theo: phép đo đối chứng của chính người điều phối cũng hỏng được. Lần đo FMA đầu ra `0%`
vì compiler gộp FMA ở cả hàm đối chứng (`disasm` xác nhận cả hai đều `FMADDD`) — con số 0 vô nghĩa
chứ không phải "không có hiện tượng".

## Hai đòn bẩy rẻ, dùng trước khi soát

- **Chia đợt thay vì bắn hết một lượt.** Đợt sau đọc được file của đợt trước trên đĩa ⇒ triệt thẳng
  lớp lỗi (1). Dùng cho các phần phụ thuộc nhau chặt; các phần độc lập thì cứ song song.
- **Trần độ dài trong brief.** Siết trần 30 KB làm chương sau ra 22–24 KB so với 28–33 KB trước đó,
  **không mất nội dung** — phần cắt đi là phần lặp. Không cắt hồi tố phần đã viết dày bằng output
  chạy thật.

## Việc agent bác lại brief là tín hiệu, không phải lỗi

Trong 42 bài có **năm lần** agent nói ngược chỉ dẫn trong brief kèm số đo, và **cả năm lần agent
đúng**. Cách xử đúng không phải tin agent cũng không phải tin brief, mà là **tự đo lại** — brief là
giả thuyết, phép đo mới là nguồn. Ngược lại, agent tự khai "chỗ này tôi chưa chắc" cũng có lần khai
sai (báo mâu thuẫn mà kiểm ra không có). Cả hai chiều đều phải tự kiểm.

Liên quan: [[viet-tai-lieu-day-duoc]] · [[bang-chung-phan-biet-duoc]] · [[cham-viec-agent-nen]] ·
[[digest-aws-2026-09-14]] · [[graph-engineering]] · [[digest-aws-2026-09-09]] ·
[[phep-kiem-quan-sat-sai-tang]] · [[gate-hop-nhat-truoc-khi-merge]] · [[moc-learning-pkm]]
