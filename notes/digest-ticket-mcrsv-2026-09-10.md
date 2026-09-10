---
type: note
title: Digest ticket-mcrsv — 2026-09-10 (đóng V2 venue 3D, ba kiểu worker chết im lặng)
summary: V2 xong 8 task nhưng ba lần worker chết mà tôi vẫn báo "đang chạy song song" — mỗi lần một nguyên nhân khác (codex tự lên bản mới nuốt prompt, Orca dựng worktree từ `origin/main` trước khi tôi push, terminal bị dựng lại về màn khởi động); cộng một tiêu chí nghiệm thu bất khả thi về toán học do chính tôi viết và một bug legend 5 màu / hàm trả 4 màu có từ F10.
tags: [agent, automation, debug, tooling]
created: 2026-09-10
updated: 2026-09-10
source: project `ticket-mcrsv` — session history (session 72710e0b, F42→F49)
---

CHỈ phần mới so với [[digest-ticket-mcrsv-2026-09-09]] (F39/F40/F41/F46 đã ghi ở đó). Bản đồ chủ đề:
[[moc-ticket-mcrsv]].

## Worker chết im lặng — ba nguyên nhân khác nhau trong một phiên

Cả ba lần tôi đều **báo cáo sai là "đang chạy"** vì không kiểm lại sau khi dispatch. Nguyên nhân khác
nhau, nên không có một phép kiểm nào bao hết — thứ chung duy nhất là *phải kiểm*.

| Dấu hiệu | Nguyên nhân |
|----------|-------------|
| Cả hai worker chết sau 9–23 s, worktree rỗng, không report | `agent_prompt_blocked` ở stage `dispatch_input` — **codex ra bản 0.154.0 giữa phiên** (03:35 UTC), sau khi tôi đã vá 0.153.4 lúc đầu phiên. F42 dispatch 03:34 lọt qua; F43/F47 dispatch 03:43 thì dính. |
| Worker sống nhưng báo thiếu code của task trước | **Orca dựng worktree từ `origin/main`**, mà tôi dispatch **trước khi push** — worktree đứng ở `f9e2388`, trước F42 một commit. |
| 13 phút, chưa có `node_modules`, chưa đổi file nào | codex đứng ở **màn hình khởi động**, prompt chưa hề chạy; banner hiện **hai lần** ⇒ terminal bị dựng lại (Orca runtime đổi ID sau khi app restart). |

Bài học tách được khỏi công cụ: **một tool CLI tự cập nhật là một biến số sống trong phiên**. Bản vá
áp cho version X không còn nghĩa gì sau khi nó tự lên X+1 giữa chừng, và không có tín hiệu nào báo.
→ [[cham-viec-agent-nen]] · [[gui-viec-cho-lane-khong-co-ack]]

**Quên release worker sau khi merge.** F42/F43/F47 merge xong nhưng không release worker, không xoá
worktree — ba pane còn treo với card `in-progress`, user phải hỏi mới phát hiện. Cùng lỗi lặp lại ở
project khác cùng ngày. Dọn worktree là **một bước của việc đóng task**, không phải việc phụ.

## Tiêu chí do tôi viết, và hai lần worker bác đúng

**F48 — tiêu chí bất khả thi về toán học.** Tôi bắt test khẳng định *"5 giá mock ⇒ 5 token màu khác
nhau"*, nhưng giá seed phân bố lệch: `700k` chỉ ở ratio `0,163` nên rơi **cùng bậc** với `350k`. Không
cách nào đạt được. Worker chỉ ra bằng số, không bằng lý lẽ — và đó là lần thứ hai trong đợt (F41 bác
được một phần plan về `elevationScale`).

**F44 — worker báo `failed` đúng theo chữ của tiêu chí.** Đó là hành vi cần giữ (tiền lệ F33); quyết
định là việc của người viết tiêu chí, không phải của worker. Cùng kết luận đã ghi ở
[[digest-ticket-mcrsv-2026-09-09]] — lần này nó tái diễn nên coi như đã xác nhận, không phải ngẫu nhiên.

## Bugs

**Legend vẽ 5 ô màu, `getPriceColor` chỉ trả về 4.** Bậc `mid` không bao giờ đạt tới trừ khi
`max <= min`. Có từ `F10` (`7560b23`) — không phải hồi quy của V2. Bằng chứng heat-map rõ:
`VIP Terrace` 1,8tr và `Premium Seated` 1,425tr (midpoint) ra **cùng vùng màu**.

**Gate hợp nhất bắt được đúng thứ nó sinh ra để bắt.** F43 chạy gate lúc rule ESLint còn ở mức
`warning`; F47 landed đổi rule thành `error`. Hai task cùng PASS, gate hợp nhất sau merge mới đỏ. Vì
thế F47 được **giữ lại chưa push** để chạy gate chung với F43 trước. → [[gate-hop-nhat-truoc-khi-merge]]

**`rake` lật ngược dấu và nhãn form chiếm chỗ hơn cả ô nhập** — nhãn `Chiều cao khối (đơn vị sàn)`
xuống **3 dòng**. F49 sửa đúng 2 dòng code: bỏ `({unit})` khỏi `<Label>`, đẩy đơn vị xuống dòng phụ.

## Techniques

- **Gate mềm = mở ảnh ra nhìn, và nó là việc của main agent** — verifier không làm thay. Nó bắt được
  "khối zone bay lơ lửng", "chồng tường che nhau" ở ca override cực đoan, và xác nhận ca `auto` (dữ
  liệu thật, không ai chỉnh tay) mới là ca phải đạt. Cùng luật với [[so-anh-khong-so-chu]].
- **Đo điều kiện tiên quyết của task trên `main` trước khi giao**, không giả định — F47 cần `0 warning`
  trên main, kiểm rồi mới dispatch.
- **Verifier tự dựng thêm một vi phạm ở chỗ khác để chứng minh rule chặn cả repo**, không chỉ chạy lại
  ca đã biết (F47 thêm vi phạm ở `admin/events/page.tsx`). Đó là hình mẫu verify đúng: chứng minh phạm
  vi, không chỉ chứng minh một điểm.
- **Mô tả sai cho verifier thì verdict vô nghĩa.** Một lần tôi đưa diff `.ts` cho verifier và gọi đó là
  "thay đổi vòng 2", trong khi nó là **tích luỹ so với HEAD** (chưa commit gì).

## Context

- **V2 venue 3D hoàn tất**: 8 task (F39, F40, F41, F46, F42, F43, F47, F44), verifier PASS hết, đã
  push `10b4da0`, worktree dọn sạch. F49 lên `main` (`3f35f77`), F48 còn chạy.
- Sau V2: F48 (heat-map 4 bậc → 5 bậc thật) + F49 (nhãn form), rồi mới viết plan V3 — đúng thứ tự đã
  chốt: V3 làm sau khi biết dữ liệu `threeD` thực tế trông thế nào.

Liên quan: [[moc-ticket-mcrsv]] · [[digest-ticket-mcrsv-2026-09-09]] · [[cham-viec-agent-nen]] ·
[[gui-viec-cho-lane-khong-co-ack]] · [[gate-hop-nhat-truoc-khi-merge]] · [[so-anh-khong-so-chu]]
