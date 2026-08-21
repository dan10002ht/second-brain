---
type: note
title: Digest ticket-mcrsv 2026-08-21 — bắn thật lòi 3 lỗ P0, và tái cấu trúc doc lộ ra doc đang nói dối theo cả hai chiều
summary: Chạy thật end-to-end (đặt → capture → huỷ/hoàn tiền) lòi ra 3 lỗ nặng hơn mọi thứ đã đóng, gồm bán trùng ghế đã có người trả tiền; `env.example` của ticket-service ghi cổng gRPC trùng event-service nên checkout mới là hỏng; email-worker có HAI hệ config song song cho cùng một cổng; và README/doc vừa nói quá vừa nói thiếu so với code đang chạy.
tags: [debug, backend, java, architecture, system-design, tooling]
created: 2026-08-21
updated: 2026-08-21
source: project "ticket-mcrsv" — session history 2026-08-20/21 (sessions 6315823e, 5c273e28 + tiếp nối)
---

# Digest — ticket-mcrsv (2026-08-21)

Ba mảng trong phiên: (1) chạy thật để tìm lỗ, (2) đóng lỗ bằng `/looptasksv2`, (3) cleanup +
tái cấu trúc toàn bộ `docs/`.

## Bugs

**Bắn thật là thứ duy nhất tìm ra 3 lỗ này.** BRIEF đã hết task, mọi gate xanh, phiên trước
tuyên bố "luồng thông". Bắn một chuỗi thật — đặt vé → webhook Stripe hợp lệ →
`CONFIRMED/CAPTURED` → huỷ → hoàn tiền → đặt lại chính ghế đó — ra **3 lỗ, 2 trong đó P0 nặng
hơn mọi thứ đã đóng ở phiên trước**, nặng nhất là **bán trùng một ghế đã có người trả tiền**.
Đây là lần thứ n repo này chứng minh: gate xanh không nói gì về việc luồng có chạy không.

**Migration chưa từng được áp vào DB dev.** Task 120 thêm bảng `event_cancellation_policies`
nhưng migration 010 chưa chạy trên `dev-postgres-main` ⇒ **mọi** booking chết. Đây là lần thứ
hai repo này vấp đúng kiểu đó (xem [[digest-ticket-mcrsv-2026-08-13]]).

**Tiến trình sống ≠ service sống.** `ticket-service` còn tiến trình trên cổng 50054 nhưng log
ngừng ghi từ **45 giờ trước**, ngay sau một đợt load 100 req/s. Cổng mở là bằng chứng của
"process chưa chết", không phải của "service còn phục vụ".

**`ticket-service` mặc định gRPC port `50053` — trùng `event-service`.** `.env` bị gitignore,
`env.example` ghi `50053`, nên **checkout mới làm đúng theo hướng dẫn sẽ đụng port**. Máy tôi
chạy được chỉ vì `.env` local đã có giá trị đúng. Đây là bug thật, không phải chuyện tài liệu:
`env.example` là **nguồn duy nhất người mới dựa vào** mà không gate nào kiểm nó.

Cùng họ, tìm thêm bằng cách quét hết:

- `user-service/env.example:24` ghi `METRICS_PORT=9092`, code là **9192**.
- `auth-service/env.example` khai `METRICS_PORT` trong khi code đọc `PROMETHEUS_PORT` ⇒ **biến
  chết**: đặt vào không có tác dụng gì, và tệ hơn là nó *trông như* có tác dụng.

**Email-worker có HAI hệ config song song.** `config.go:257` ghi `metrics.port = 9090`,
`loader.go:138` ghi `8085`, doc ghi `9090`, Prometheus scrape `8080` — **ba giá trị khác nhau
cho một cổng**. Tôi đo một hệ, verifier đo hệ kia; verifier đúng. Khi hai bên cùng "đọc code"
mà ra số khác nhau, khả năng cao là **có hai đường code**, không phải một bên đọc ẩu.

**Gate script in `GATE EXIT 0` trong khi 3 check vỡ.** Xanh giả, và vấp **hai lần** trong
cùng phiên. Cách bắt: tiêm lỗi vào rồi đòi gate phải đỏ — thí nghiệm ngược, không phải chạy
gate rồi tin.

**Vùng mù của chính gate.** `check-docs.sh` chỉ quét `docs/**` ⇒ **17 README cấp service** nằm
ngoài, chưa từng được kiểm — bịt xong bắt ngay 4 link chết + 1 tên service sai. Guard đi kèm
cũng bắt hụt: `service-to-service` khớp trọn nên prefix không kết thúc bằng `service-`; luật
tổng quát là tên service thật không bao giờ **bắt đầu** bằng phần khớp đó.

## Techniques / Context

**Doc nói dối theo cả hai chiều, và chiều "nói thiếu" khó thấy hơn.**
`MICROSERVICE_BEST_PRACTICES.md` (747 dòng) mô tả *Device Service port 50052* và *Security
Service port 50053* — hai service **không tồn tại**. Ngược lại, README là design doc từ trước
khi implement: mọi service `🟡 Planning`, kể cả cái tôi smoke test sáng hôm đó;
`payment-service` ghi **20%** trong khi capture lẫn refund đều đã chạy thật. Quét theo **sự
kiện sai cụ thể** (tên service, số cổng, %) rẻ hơn đọc hết 64 file.

**Tái cấu trúc `docs/`**: một ADR chốt luật trước (mọi bước sau bám theo nó), 61 file rename
`git`-verified 0 mất, front-matter `living` vs ảnh-chụp-quá-khứ, index mới, và `check-docs.sh`
làm gate. 100 link chết sau khi dời — 32 chỗ máy không tự chọn được vì **trùng tên file**
(3 file `01_SETUP_COMPLETE.md`, nhiều `README.md`), phải xử theo ngữ cảnh từng file. Chốt
`CHECKED=65 DEAD=0`.

**Tôi tự tạo chứng nhận giả** — đóng dấu `last-verified: 2026-08-21` hàng loạt lên file mình
chưa thật sự kiểm. Verifier lấy mẫu 3 file có dấu thì **2 sai**. Bài học khái quát ở
[[truong-last-verified]].

**Lane base từ trước khi tái cấu trúc** nên nó thấy cây thư mục cũ và báo 21 link chết của cây
đã bị thay. Không phải lane sai — phải đưa worktree của lane lên ngang `main` rồi mới chấm.

**Ba lần tôi và agent mâu thuẫn, ba kết quả khác nhau:** (a) verifier đúng / tôi sai — hai hệ
config; (b) lane đúng / verifier sai — verifier `ls` đường dẫn đã resolve từ root rồi kết luận
"không tồn tại ở đâu trong repo", vượt quá dữ kiện nó có; (c) cả hai đều sót — cùng một lỗi
port còn ở 2 chỗ nữa. Nên: không tin bên nào, tự phân xử bằng dữ kiện thứ ba.
Xem [[bang-chung-phan-biet-duoc]].

**Verifier bắt lỗi tổng quát hay hardcode?** Cách kiểm: tiêm lỗi **vào service khác** với cái
nó vừa sửa. Nếu vẫn bắt được thì generator/checker là tổng quát thật.

**Khi user đã nói "hoàn thiện nhất có thể, không làm qua loa"** thì việc liệt kê 2 lỗ còn lại
rồi hỏi "anh chốt cái nào" là hỏi thừa — user trả lời *"Bạn muốn tôi chốt cái gì chứ?"*. Cùng
họ với [[feedback-khong-khep-viec-khi-con-khe-ho]].

## Liên quan

[[digest-ticket-mcrsv-2026-08-20]] · [[digest-ticket-mcrsv-2026-08-13]] ·
[[digest-ticket-mcrsv-2026-08-17]] · [[truong-last-verified]] ·
[[feedback-khong-dung-vs-chua-lam-toi]] · [[bang-chung-phan-biet-duoc]] ·
[[feedback-khong-khep-viec-khi-con-khe-ho]] · [[2026-08-13-commit-lockfile-ticket-mcrsv]]
