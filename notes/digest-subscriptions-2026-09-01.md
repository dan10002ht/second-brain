---
type: note
title: Digest Joy Subscription — 2026-09-01
summary: Widget volume bundle không cướp được nút ATC của theme Horizon nên theme tự submit quantity=1; và file transaction log của Loop là thứ CHỨNG MINH heuristic đoán payment method đúng, không phải thứ thay nó.
tags: [subscription, shopify, debug, performance]
created: 2026-09-01
updated: 2026-09-01
source: project `subscriptions` — session history (JSUB-260828-tb8zWe, CLS boot, import Loop)
---

CHỈ phần mới so với [[digest-subscriptions-2026-08-24]], [[digest-subscriptions-2026-08-26]],
[[digest-subscriptions-2026-08-28]] và [[2026-08-28-import-loop-chi-contract-song-paused]].

## Bugs

**Bundle add-to-cart chỉ thêm 1 sản phẩm trên alwaysfinley (JSUB-260828-tb8zWe).**
`VolumeBundleSection.js` không có nút ATC riêng — nó **cướp nút ATC của theme**. Trên theme Horizon
việc cướp không ăn, nên theme tự submit form với `quantity=1` và khách nhận 1 chai thay vì cả pack.
Triệu chứng xuất hiện ở **cả mobile lẫn desktop**, tức không phải chuyện responsive.

Fix: đăng ký listener `click` ở pha **capture trên `window`**. Đã kiểm bằng thí nghiệm chứ không suy
luận: listener capture trên `window` **đăng ký muộn vẫn chạy trước** handler của Horizon
(`[ProductForm Debug]` không xuất hiện, cart = 0 ⇒ theme bị chặn thật). Tách thành helper riêng để
test được bằng jsdom. MR !2518 `fix/volume-atc-capture`.

Bẫy trong chính test: `stopImmediatePropagation` chặn listener đăng ký **sau** nó, nên listener rò rỉ
giữa các case làm test sau ăn theo test trước — phải gỡ listener trong teardown.

## Techniques

**Một file export thứ hai đáng giá nhất khi dùng để CHỨNG MINH, không phải để thay.**
Script enrich đoán payment method của contract Loop bằng heuristic "thẻ chưa revoke đầu tiên của
khách". Khi có thêm file `Transaction logs` (18 tháng, 391 dòng) chứa
`gid://shopify/CustomerPaymentMethod/<token>` gắn đúng từng subscription, giá trị thật của nó không
phải là "thay heuristic" mà là **33/33 khớp tuyệt đối** — chứng minh heuristic không sai ở 4 contract
mà file mới không phủ. Bốn cái fallback đó đều là khách chỉ có đúng 1 thẻ ⇒ không còn chỗ chọn nhầm.

**Chạy data qua đúng validator của app, không viết check tự chế.** File import cuối được nạp qua
`validateImportSubscriptions` thật (dùng jest làm loader vì repo không có `@babel/register`), không
phải một hàm kiểm do tôi viết ra. Cùng họ với [[gate-tu-viet-la-nguon-xanh-gia]].

**Đo CLS trên app cần login: dựng profile Chrome riêng trong scratchpad.** Copy profile Chrome thật
bị chặn (đụng cookie store) — đúng, không lách. Cách chạy được là Playwright mở cửa sổ với profile
riêng, user login **một lần** rồi session giữ lại cho mọi lần đo sau. Vòng chờ phải theo dõi *mọi tab
trong cửa sổ* vì OAuth Google đổi tab giữa chừng, và phải chờ đủ lâu (10–15 phút) cho bước 2FA.

## Context

- Shopify chỉ có scope `read_own_subscription_contracts` — **app này không đọc được contract của app
  kia**. Nên migration từ Loop bắt buộc phải đi vòng qua *order* + *transaction log*, không có đường tắt.
- **Dev standalone không tái hiện được CLS của prod.** Đo trên dev chỉ ra 0.0146 trong khi prod cao hơn;
  dưới throttle mạng, bundle dev (không minify) mất >14s để tải nên run đầu còn kẹt ở boot screen,
  chưa kịp shift gì. Số đo dev chỉ dùng để so *trước/sau của chính nó*, không dùng để kết luận về prod.
- Shop TIEL (`snESyJRMSVnlOObfA4sN`) ở plan `starter` — cap 50 subscription chỉ áp cho plan `free`
  nên không chặn import 37 contract.

→ [[subscriptions]] · [[subscriptions-debug-runbook]] · [[gate-tu-viet-la-nguon-xanh-gia]] · [[bang-chung-phan-biet-duoc]]
