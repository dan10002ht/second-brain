---
type: note
title: Digest subscriptions 2026-08-18 — customer-account extension không đọc được query param, deploy đòi extensions_summary, và baseline "9 suite fail" là giả
summary: CHỈ phần mới — `navigation.currentEntry.url` của customer-account extension là route nội bộ chứ không phải URL thanh địa chỉ nên cờ `?joy_preview=1` không tới được extension; `shopify app deploy` giờ bắt buộc `extensions_summary` trong `[sidekick]`; worktree đang khoá của session khác làm `shopify app build` exit 1; và "9 suite fail có sẵn" hoá ra do `node_modules` cũ so với `yarn.lock` merge về.
tags: [avada, subscription, shopify, extensions, debug]
created: 2026-08-18
updated: 2026-08-18
source: project "subscriptions" — session history 2026-08-17/18 (Chatty API + portal preview)
---

# Digest — subscriptions (2026-08-18)

> CHỈ phần MỚI. Cụm gotcha Horizon theme block, hai mode installment, volume discount
> đa tầng, cache Hosting 404 API-có-auth… đã ghi ở [[subscription-installment-horizon-digest]],
> [[subscription-digest-2026-07-11]], [[subscription-digest-2026-07-12]],
> [[digest-subscriptions-2026-08-17]] — không lặp lại.

## Bugs

**Cờ `?joy_preview=1` không bao giờ tới được customer-account extension.** Chuỗi logic
phía sau đúng hết; mắt xích đầu tiên hỏng: `navigation.currentEntry.url` của SDK
`customer-account` là **route nội bộ của extension**, không phải URL trên thanh địa chỉ
trình duyệt. Docs chính thức dùng nó để check `.endsWith(...)` theo route, và type def của
SDK đang cài xác nhận điều đó. Intents API cũng không đọc được query param (chỉ dùng cho
đổi payment method). Kết luận: **không có đường đọc query string từ trong extension** —
phải truyền cờ bằng cơ chế khác. Trước đó tôi chẩn đoán sai một vòng ("preview chưa bật")
rồi phải đính chính khi banner hiện ra.

**Badge analytics luôn `0` trong preview.** `SubscriptionManagement.js` gọi `/analytics`
ngay lúc mount, **chạy đua** với `/subscriptions` của tab con. `/analytics` về trước, đọc
số khi store preview chưa seed xong → `0`, và nó **đứng luôn** chứ không "tự sửa ở request
sau" như báo cáo của agent phỏng đoán.

**Preview sinh contract id dạng chuỗi (`preview-...`) trong khi dữ liệu thật là số**
(`PropTypes.number`). Router chấp nhận cả `\d+` nên không có gì phụ thuộc dạng chuỗi →
cho preview sinh id dạng số là hợp lý nhất. Đổi xong 5 test đỏ vì **hardcode id cũ trong
path** — sửa test tra id theo `scenarioKey` thay vì ghi cứng.

**Sample data thiếu field làm UI rơi vào fallback:** UI đọc `order?.name ?? '...'`, dấu
`...` chính là fallback. Nguy hiểm hơn: gắn `order` vào làm `isFulfillSummary` lật sang
`true`, khiến `collectOrderSummary` chạy `.map` không guard — mock một chuỗi hoá ra đụng
vào đường tính tổng tiền.

## Techniques

**`shopify app deploy` giờ bắt buộc `extensions_summary` trong `[sidekick]`.** Deploy fail
không phải vì code mà vì Shopify vừa thêm field bắt buộc, và **không toml nào trong repo
có nó**. Thủ phạm là extension `sidekick-subscription-tools` (cung cấp 11 tool read-only
cho Sidekick) — summary phải mô tả đúng bộ tool đó. Đọc extension rồi mới viết summary,
đừng bịa.

**Worktree đang `locked` của session khác làm `shopify app build` exit 1.** Mỗi agent tự
chạy build đều exit 0, chỉ trạng thái gộp mới đỏ — đó chính là lý do phải chạy gate trên
bản gộp. CLI đang cài không hỗ trợ `web_directories` nên không né được bằng config; gỡ
worktree là cách duy nhất, và **gỡ worktree không đụng nhánh** (kiểm `0 0` + commit cuối
đã push trước khi gỡ).

**"9 suite fail có sẵn" là baseline giả.** Merge master về nhánh cũ mang theo `yarn.lock`
đổi **1800 dòng**; `node_modules` trên đĩa vẫn là bản cũ → `Cannot find module 'cheerio/slim'`.
Cài lại xong: **232 suite / 2307 test / exit 0**. Nghĩa là mọi gate chạy trước đó đều chạy
trên cây phụ thuộc sai. Cùng họ với [[bang-chung-phan-biet-duoc]] và với ca worktree thiếu
`.env.local` ở [[digest-subscriptions-2026-08-06]]: **trước khi khai "pre-existing", kiểm
xem môi trường có khớp lock không.**

**Nhánh cũ có thể chưa có gate.** `feat/portal-preview` cũ hơn master 73 commit nên không
có `yarn check` lẫn jest cho assets — gate thật chỉ xuất hiện **sau khi merge master**.
Đừng coi "gate xanh" trên nhánh cũ là bằng chứng.

**Hook chặn push đọc subject của merge commit.** Push `feat/portal-preview` →
`feat/portal-preview` (không đụng master) vẫn bị chặn vì subject merge commit có chữ
`master`. False positive — liên quan [[feedback-git-guard-chi-chan-master]].

**Env var không sống qua hai block `!` tách rời.** Người dùng chạy snippet ra 401 còn tôi
chạy ra 200: snippet chỉ đúng khi `KEY`/`TOKEN` và lệnh `curl` **ở cùng một shell**. Lỗi
nằm ở cách chạy lệnh, không phải ở API — kiểm điều này trước khi đi debug backend.

## Context

**Key Google Translate lọt vào transcript.** Xoá file ở máy **không rút lại** việc key đã
gửi lên API — rotate vẫn là thứ duy nhất thực sự đóng lỗ. Sandbox **chặn ghi đè**
`~/.claude/*.jsonl` và `~/.zsh_history`; đây là chặn hợp lý (sửa history file là mẫu hành
vi đáng nghi), không nên tìm cách lách. Quét ra thêm key nằm trong `lib/` của repo khác —
là build output, bị `.gitignore` chặn, **không lọt vào git**. Cùng chủ đề:
[[feedback-xoa-secret-khoi-code-chua-phai-vo-hieu-hoa]].

**API Chatty — hai chi tiết Chatty sẽ làm sai nếu không nói rõ trong doc:**
`nextBillingDate` **không phải field lưu sẵn** mà được `prepareData` suy ra (consumer khác
trong repo cũng không dùng bản thô); `paginateFirestore` tôn trọng `getAll: true`, không
có cap ẩn.

**Mockup app nằm trong chính repo này** (`product-team/`) — tôi từng nói nhầm với coder là
nó ở repo khác. Working tree có thể đang giữ bản mockup **cũ**; chạy so sánh với bản cũ
thì kết luận lệch mockup là vô nghĩa. Fetch đúng ref MR chốt rồi mới chạy.

**12 file `manifest.json` lạ là artifact của `shopify app build`**, không phải agent nào
để lại.

Bối cảnh: [[subscriptions]] · [[subscriptions-debug-runbook]] ·
[[shipped-subscriptions-2026-08-18]] (cái gì đã landed) ·
[[2026-08-18-volume-tier-line-attribute]] (quyết định cùng cụm)
