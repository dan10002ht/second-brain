---
type: decision
title: Tool `settings.read` của MCP đổi từ denylist sang allowlist 2 tầng
summary: Joy Subscription bỏ cách "forward cả settings doc trừ 3 key" cho MCP `get_settings` — nay chỉ 6 group được pass-through và `emailNotifications` có allowlist riêng theo field, vì cách cũ đang đẩy host/port/username SMTP (plaintext) và password (ciphertext AES) sang một LLM bên thứ ba.
tags: [subscription, shopify, avada, ai, backend, auth]
created: 2026-08-12
updated: 2026-08-12
review: 2026-11-12
source: repo "subscriptions" — git log 2026-08-11, commit `5ccf2d533` (nhánh `feat/sb-15077-mcp-server`, CHƯA merge master)
---

# `settings.read` của MCP: denylist → allowlist 2 tầng

**Bối cảnh:** tool `get_settings` của MCP server (SB-15077) trả cấu hình shop cho Sidekick /
agent bên ngoài. Cách làm ban đầu là **denylist**: forward nguyên settings doc, trừ 3 key.

Hệ quả đo được trong `5ccf2d533`: doc kéo theo cả `emailNotifications {host, port, username,
password}`. Password là **ciphertext AES** nên client không giải được, nhưng `host` / `port` /
`username` là **plaintext**.

**Quyết định:** đổi sang **allowlist 2 tầng**.

| Tầng | Luật |
|---|---|
| 1 — group | chỉ **6 group** được pass-through; group mới thêm vào settings sau này **không tự động lọt ra** |
| 2 — field | `emailNotifications` có allowlist **riêng theo từng field** |

Cùng commit bổ sung `widgetSettings` (nằm ở collection riêng nên trước giờ **không tool nào đọc
được**, dù mô tả permission có hứa) — tức allowlist không chỉ siết, nó còn buộc phải khai báo
đúng thứ đáng lộ.

## Why

- **Ciphertext vẫn không nên rời khỏi hệ thống.** Không giải được hôm nay ≠ không giải được;
  và nó đi tới một **LLM bên thứ ba**, tức một bề mặt không kiểm soát được log, cache hay
  training. Đây là "bằng chứng vắng mặt" kinh điển ([[bang-chung-phan-biet-duoc]]): "client
  không giải được" không phân biệt được với "an toàn".
- **Denylist hỏng theo thời gian, allowlist thì không.** Denylist đúng tại thời điểm viết và sai
  ngay khi ai đó thêm group mới vào settings doc — sai **im lặng**, không có test nào đỏ. Với
  allowlist, thêm group mới thì nó **không xuất hiện**: hỏng ồn ào, và hỏng về phía an toàn.
- **Cả cụm SB-15077 là một họ lỗi "mô tả hứa một đằng, dữ liệu trả một nẻo"** — payment status
  luôn INVALID, dunning trả rỗng sai, reward campaign chưa bao giờ trả điều kiện. Denylist thuộc
  đúng họ đó: không ai kiểm được tool đang trả ra **cái gì**, chỉ kiểm được nó **không** trả 3
  key. Xem [[shipped-subscriptions-2026-08-12]].

## Tradeoff

- **Được:** bề mặt lộ dữ liệu trở thành **hữu hạn và đọc được bằng mắt**. Thêm group mới vào
  settings không mở thêm lỗ. Field-level allowlist cho `emailNotifications` giữ được phần hữu
  ích (agent vẫn biết shop có bật email notification hay không) mà không kèm credentials.
- **Mất — mọi field mới đều mặc định vô hình với agent.** Ai thêm setting mới rồi thắc mắc "sao
  Sidekick không thấy" sẽ mất thời gian, và triệu chứng giống hệt bug: tool trả về **thiếu**,
  không báo lỗi. Đây đúng là failure mode mà cả phần còn lại của `5ccf2d533` đang đi sửa — ta
  vừa cố ý tạo thêm một chỗ như thế, đổi lấy an toàn.
- **Mất — luật sống ở code, không ở tài liệu permission.** Mô tả permission trong
  `Settings/MCP/MCP.md §4` vẫn là văn bản tự do; allowlist là một mảng trong
  `helpers/agentApi/settingsSummary.js`. Hai thứ vẫn có thể lệch nhau như trước — chỉ khác là
  giờ lệch theo hướng *hứa nhiều hơn cho*, thay vì *cho nhiều hơn hứa*.
- **Chưa chứng minh được là đã đủ.** Commit chỉ rà `settings.read`; 6 permission Read còn lại
  được sửa về **tính đúng của dữ liệu**, không ai rà chúng theo tiêu chí "có kéo theo secret
  nào không".

## Phương án đã bỏ

- **Giữ denylist, thêm `emailNotifications` vào danh sách cấm** — rẻ hơn một dòng, nhưng để
  nguyên cơ chế đã hỏng: group thứ tư mang secret sẽ lọt y như lần này — sửa triệu chứng, không
  sửa cách quyết định cái gì được lộ.
- **Mã hoá / mask thêm trước khi forward** — không giải quyết gì: `host`/`port`/`username` bị
  mask thì vô dụng với agent, không mask thì vẫn lộ.

## Cần theo dõi tới ngày review

1. Nhánh `feat/sb-15077-mcp-server` **đã merge master chưa**. Nếu tới 2026-11-12 vẫn nằm nhánh
   thì quyết định này chỉ mô tả code chưa chạy ở đâu cả.
2. Có group settings nào được thêm sau 08-11 mà **quên khai vào allowlist** không — đó là cái giá
   của quyết định này, cần biết nó đắt bao nhiêu trên thực tế.
3. 6 permission Read còn lại đã được rà theo tiêu chí "có kéo theo secret không" chưa.

→ [[shipped-subscriptions-2026-08-12]] · [[subscriptions]] · [[bang-chung-phan-biet-duoc]] ·
[[2026-08-11-sidekick-gate-message-khong-mang-chi-thi]] · [[chan-agent-bang-cau-hinh]] ·
[[mcp-auth-apikey-vs-oauth]]
