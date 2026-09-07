---
type: note
title: Digest game-server — 2026-09-07 (khởi động project học game server bằng Go)
summary: Project mới `~/projects/game-server` học BE game từ số 0 bằng Go; chốt học khái niệm trước rồi mới code (skeleton Phase 0 giữ lại để đối chiếu), và không dùng ảnh sinh bởi model cho sơ đồ kỹ thuật vì chữ/số sai và không sửa được một mũi tên.
tags: [learning, system-design, architecture]
created: 2026-09-07
updated: 2026-09-07
source: project `game-server` — session history 2026-09-06/09-07
---

Project **mới**, chưa có note riêng trong brain: `~/projects/game-server` (ngoài Avada, tự học).
Thư mục trống trước phiên này.

## Context

**Mục tiêu người học:** tự build được một game real-time nhỏ **và** hiểu concept đủ sâu để
design hệ thống. Ngôn ngữ: **Go**. Mức "vận hành cluster game production" để dành sau.

**Kết quả phiên:** `ROADMAP.md` 6 phase (~3 tháng cho mức 1+2), skeleton **Phase 0**
(`cmd/tickloop/`, tick loop + fixed timestep, `go test ./...` xanh, `go vet` sạch), và 2 lesson
đầu (`lessons/01-hai-mo-hinh.md`, `lessons/02-fixed-timestep-va-ba-nhip.md`).

**Khung khái niệm nền** (từ bài viết người dùng mang vào, không phải kết luận tự rút ra —
ghi lại vì nó là bản đồ của cả roadmap):

| | BE App | BE Game |
|---|---|---|
| Mô hình | Stateless, DB ở trung tâm, hỏi–đáp | Stateful, simulation state trong RAM |
| Nhịp | Theo request | Theo **tick** (sim 60Hz · snapshot 20Hz · render 60FPS) |
| DB | Nguồn sự thật trên critical path | Chỉ giữ persistent data (progression, inventory, match result) — **không nằm trên critical path của tick** |
| Latency | Vài trăm ms có thể chấp nhận | Ảnh hưởng trực tiếp cảm giác điều khiển; và latency ≠ desync |
| Bảo mật | authn/authz, SQLi, XSS, CSRF | **Client luôn nói dối** — client gửi *intent*, server quyết *authoritative state* |
| Protocol | JSON/HTTP mặc định | WS+JSON đủ cho game nhỏ; UDP/KCP + binary chỉ đáng khi packet rate/bandwidth/GC thành bottleneck |

Bài toán riêng của game networking mà BE app không có: client prediction, server reconciliation,
interpolation/extrapolation, tick sync, packet loss, state replication.

## Techniques

**Đừng sinh ảnh cho sơ đồ kỹ thuật.** Model sinh ảnh viết sai chữ, sai số, và không sửa được
một mũi tên mà không gen lại cả tấm — với tài liệu học thì đó là tài liệu sai đóng băng.
Sơ đồ phải là thứ **sửa được từng phần**: ASCII/mermaid/SVG viết tay trong chính file lesson.
Áp dụng được cho mọi doc kỹ thuật, không riêng project này.

**Mọi con số trong tài liệu phải là output thật.** `PHASE0.md` chỉ ghi số đo chạy được trên
máy người học, không phải số minh hoạ — cùng kỷ luật với
[[bang-chung-phan-biet-duoc]]: số bịa trong tài liệu học thì không ai phát hiện được.

## Quyết định trong phiên

**Học lesson trước, code sau** — đảo lại thứ tự ban đầu (skeleton Phase 0 đã viết xong rồi mới
đổi hướng). Code không vứt: giữ nguyên tại chỗ để khi học tới thì mở ra đối chiếu.
Lý do: người học muốn hiểu khái niệm trước khi gõ, và code trước làm lesson thành chú thích
cho code thay vì ngược lại. Cùng tinh thần [[learning-in-public]]: thứ viết ra phải bắt người
viết tự trả lời, không chỉ chép lại.

**Tự phê bình đáng giữ:** 2 lesson đầu bị chính tôi đánh giá là *"tài liệu tham khảo giả dạng
bài học"* — đủ nội dung nhưng không dạy được, vì không có chỗ nào bắt người học tự trả lời
hoặc tự đo. Đây là cùng một lỗi hình thức với doc "đã xác minh" ở [[truong-last-verified]]:
đúng nội dung không đảm bảo đúng công dụng. *(Phiên bị cắt ở đây — chưa xác minh lesson đã
được viết lại theo hướng nào.)*

## Liên quan

[[dev-skills]] · [[dong-bo-chan-luong-khong-phai-chuyen-hieu-nang]] · [[bang-chung-phan-biet-duoc]] ·
[[truong-last-verified]] · [[learning-in-public]] · [[atomic-notes-principle]] · [[moc-learning-pkm]]
