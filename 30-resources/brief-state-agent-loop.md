---
type: resource
title: File task list là state của agent loop — nó thối, và cách giữ nó đúng
summary: `BRIEF.md` là shared state duy nhất sống ngoài mọi context window, nên nó là thứ session sau tin tuyệt đối — và nó thối theo bốn kiểu (checkbox nói dối, lock treo, con số cũ bị đọc như phép đo, doc lạc hậu ở đầu file); dọn nó là một bước của loop chứ không phải việc phụ.
tags: [ai, skills, method, tooling, patterns]
created: 2026-08-16
updated: 2026-08-16
source: tổng hợp tuần 2026-08-09 → 08-15, 3 project — [[digest-subscriptions-2026-08-12]] · [[digest-ticket-mcrsv-2026-08-13]] · [[digest-pdf-2026-08-12]] · [[digest-pdf-2026-08-13]] · [[digest-subscriptions-2026-08-15]]
---

# File task list là state của agent loop — nó thối, và cách giữ nó đúng

## Khái niệm

Trong `/looptasks`, `BRIEF.md` không phải một cái to-do list. Nó là **shared state của
một graph** ([[looptasks-vs-workflow]]): node là subagent, edge là vòng recon → chia
task → spawn → verify → đóng sổ, còn state thì nằm **trên đĩa** — ngoài mọi context
window, ngoài repo code, sống qua nhiều ngày và nhiều session.

Đó chính là ưu thế của nó so với workflow. Và cũng chính là chỗ hỏng: một state bền
mà không ai kiểm thì **session sau đọc nó như đọc sự thật**, kể cả những dòng đã sai
từ hai tuần trước.

## Khi nào áp dụng

Bất kỳ vòng lặp tự động nào giữ trạng thái trên đĩa để agent đọc lại: `BRIEF.md` của
`/looptasks`, spec/plan bền của workflow nhiều phiên, file handoff giữa các session.
Không phụ thuộc repo — tuần 2026-08-09→15 nó xảy ra đồng thời ở `subscriptions`, `pdf`
và `ticket-mcrsv`, ba stack khác nhau hoàn toàn.

## Bốn kiểu thối

| Kiểu | Dấu hiệu | Vì sao nguy hiểm |
|---|---|---|
| **Checkbox nói dối** | task còn `[ ]` nhưng thực ra đã hết hiệu lực từ lâu | `[ ]` bị đọc là "còn phải làm"; thật ra là "chưa ai đóng sổ". Loop không chạy — chứ không phải chạy mà không xong |
| **Lock treo** | `[⏳ HH:MM]` quá ngưỡng, `[⏸️]` chờ người vô hạn | loop fire đều đặn và trả "no pending tasks" hàng chục–hàng trăm vòng liên tiếp, đốt token mà không ai biết |
| **Con số cũ bị đọc như phép đo** | "2 suite fail pre-existing", "phương án A tốt hơn B", tiền đề mô tả hành vi code | nội dung task cũ **không phải phép đo**; đo lại thường ra số khác, đôi khi ngược hẳn |
| **Doc lạc hậu ở đầu file** | file phình vài trăm → vài nghìn dòng, phần mở đầu là bối cảnh cũ | đó đúng là thứ session sau đọc **đầu tiên**, nên sai ở đây lan xa nhất |

Ba kiểu đầu đều dẫn tới cùng một hậu quả: **brief sai mà agent làm theo mù thì fix
đúng cú pháp nhưng vô dụng** — và ở chiều ngược lại, một brief tự mâu thuẫn suýt làm
lọt một test không bắt được lỗi gì.

Bằng chứng đã trả giá: [[digest-subscriptions-2026-08-12]] (8/13 task đóng một lượt
vì hết hiệu lực) · [[digest-subscriptions-2026-08-15]] và
[[digest-ticket-mcrsv-2026-08-12]] (vòng rỗng liên tiếp vì lock treo) ·
[[digest-subscriptions-2026-08-11]] và [[digest-pdf-2026-08-12]] (số cũ trong brief
sai khi đo lại) · [[digest-ticket-mcrsv-2026-08-13]] (tách 3 file, và các tiền đề
trong brief bị agent bác đúng).

## Luật giữ nó đúng

1. **Archive ≠ mark done.** Task hết hiệu lực chuyển sang `BRIEF-done.md` và ghi rõ là
   *chưa làm* (hoặc 🚫 bị việc khác thay thế) **kèm phần root cause đã điều tra được** —
   không đánh ✅ cho gọn mắt. Đánh ✅ là ghi một lời nói dối vào state bền.
2. **Task điều tra không có commit vẫn phải để lại `file:line` + root cause** trong
   brief. Không có commit nghĩa là brief là *nơi duy nhất* kết quả đó tồn tại.
3. **Kết luận chưa qua verifier phải được gắn nhãn.** Ghi theo tầng tin cậy —
   verified / verified-safe / agent-claimed-unverified — thay vì chép nguyên bảng của
   agent; task sau tự verify lại phần chưa chắc. Cùng nguyên tắc
   [[bang-chung-phan-biet-duoc]].
4. **Mọi con số phải kèm mốc: đo lúc nào, bằng lệnh gì, vì sao đổi.** Số không có mốc
   sẽ được copy sang brief kế tiếp và già đi im lặng. Trước khi code thì **đo lại
   baseline trên đúng nhánh sẽ làm**, đừng tin số ghi sẵn.
5. **Uỷ quyền và ranh giới khi user vắng mặt phải ghi vào file, không nói trong chat.**
   Loop chạy nền, context bị tóm tắt; iteration sau chỉ còn file để đọc.
6. **Dọn brief là một bước của loop, không phải việc phụ.** Tách file khi phình
   (`BRIEF.md` chỉ giữ task đang & sẽ làm; `REFERENCES.md`; `BRIEF-done.md`), và dọn
   phần đầu file trước khi bàn giao.

## Gotcha

- **Vòng rỗng không tự dừng.** Luật "im 15 lượt thì huỷ cron"
  ([[feedback-dung-loop-khi-rong]]) đã có, và vẫn bị vi phạm — vì nó là **lời dặn chứ
  không phải cơ chế**. Cùng họ [[chan-agent-bang-cau-hinh]]: ràng buộc chỉ có giá trị
  bằng thứ ép nó.
- **Ngưỡng lock đừng rút vội.** `[⏳]` giữ ~80 phút vẫn dưới ngưỡng 90 và là *đúng* —
  một vòng verifier thật tốn ngần đó. Rút ngưỡng để "loop chạy nhanh hơn" sẽ sinh ra
  hai agent làm cùng một task.
- **Ở brain này, `bin/brain-doctor` đã soi mục ruỗng của BRIEF** (lock ⏳ treo, task
  `[P0]`/`[P1]` nằm lì, tỉ lệ FAIL của verifier) — tức phần phát hiện đã cơ giới hoá,
  phần *đóng sổ* thì vẫn là việc người.

## Liên quan

[[looptasks-vs-workflow]] · [[graph-engineering]] · [[bang-chung-phan-biet-duoc]] ·
[[chan-agent-bang-cau-hinh]] · [[feedback-plan-o-subagent-hoac-ghi-brief]] ·
[[feedback-dung-loop-khi-rong]] · [[2026-08-04-looptasks-verifier-doc-lap]] ·
[[2026-08-07-phan-tang-verifier]] · [[2026-08-13-tach-gate-khoi-cham-tung-bug]] ·
[[2026-08-14-verifier-va-agent-mutation-tach-doi]] · [[shopify-app-dev]] (area chạy các loop này) ·
[[moc-learning-pkm]]
