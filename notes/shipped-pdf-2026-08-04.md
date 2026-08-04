---
type: note
title: Shipped PDF Invoice — commit landed 2026-08-03 (5 MR vào master: campaign unsubscribe, HS code, fix 422)
summary: Commit landed 08-03 — master nhận 5 MR: unsubscribe cho email marketing (HMAC stateless, RFC 8058), HS code/country of origin phủ 102 theme + 113 ngôn ngữ + gate theo plan, fix 422 khi Save Settings (yup 0.29 tự dựng default cho nested object), font DM Sans, quickstart; nhánh còn script gửi bulk resume được; không revert.
tags: [pdf, invoice, shopify, firebase, nodejs, avada]
created: 2026-08-04
source: repo "pdf" — git log (2026-08-03); các hash và số MR dưới đây đã verify
---

# PDF Invoice — shipped 2026-08-03

> Phần *học được* (thiết kế luồng unsubscribe, bẫy Hosting/emulator, kỷ luật gửi
> 27.6k mail) nằm ở [[digest-pdf-2026-08-03]] — **không lặp lại ở đây**.
> Bối cảnh project: [[pdf]].

## Shipped

Master (`628590d7c` = `origin/master`) nhận **5 merge request** trong ngày.
Không có version tag nào trong log — mốc gần nhất vẫn là `v3.1.65`
([[shipped-pdf-2026-08-01]]).

**1. MR !490 — Campaign unsubscribe** (`32a9d6643`)
Email "product news" là **email thương mại đầu tiên** app gửi cho merchant, các mail
sẵn có đều là transactional nên không có gì tái dùng.
- `ff18e4830` — bản đầu: endpoint public `/unsubscribe` tách **GET hiện trang xác
  nhận / POST mới ghi** (để bộ quét email doanh nghiệp tự mở link không hủy nhầm);
  header `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058) cho nút one-click
  của Gmail/Outlook; token **HMAC-SHA256 theo `shopId`, stateless** nên không phải
  ghi sẵn token cho 27k người nhận; tham số đặt tên `sid` **không phải `shop`** vì
  `shop` bị Shopify App Bridge chiếm dụng (tưởng là domain store rồi redirect sang
  admin); `parseBodyOnce` vì Firebase Functions parse body trước Koa, mount
  `koa-bodyparser` thẳng sẽ ném "stream is not readable". Opt-out **chỉ áp cho
  product news**, invoice và mail giao dịch không đọc field này.
- `86ca5634b` — refactor về đúng tầng của app: tách `CampaignUnsubscribeService`,
  route ra `routes/unsubscribe.route.js`, dùng `ViewRes`/`STATUS_CODE` thay
  `ctx.render`/số 400 trần, controller đổi sang `static x = async ctx => {}`.
  (Đúng luật [[controller-service-repository]] — cùng bài học với
  [[digest-pdf-2026-07-21]]: Firestore phải ở repository.)
- `78a0af921` — chuyển comment/message unsubscribe sang tiếng Anh cho đồng bộ
  codebase, không đổi hành vi.

**2. MR !488 — HS code & country of origin** (`628590d7c`)
- `bd8d11f86` — thêm block HS code cho 4 họ theme `aria`/`vela`/`spira`/`skyline`
  (landed master **sau khi nhánh được cắt** nên bị hụt). **Coverage 102 theme**
  (mốc trước là 77/83 ở [[shipped-pdf-2026-08-01]]).
- `894864b46` — refund render `order.line_items_refunds` (bản copy lồng trong
  `refund.refund_line_items[].line_item`) và quote render `draftOrder.line_items`;
  **cả hai đều không phải mảng mà `#transformLineItems` decorate** nên ra trắng.
  Gom về một helper `setItemCustomsFields` dùng cho cả 3 đường in. Helper **gate
  dữ liệu chứ không gate setting** (bỏ populate hẳn dưới Professional) — vì default
  print đi qua `findAllDefaultTemplates` vốn không bao giờ áp `limitSettings`, nên
  shop downgrade vẫn render field. Ref SB-15124, SB-15146.
- `676db483d` — dịch label HS code cho **113 ngôn ngữ** trong
  `storage/translations` — tập **khác** với locale admin đã update trước đó, nên
  `text.hsCode` undefined và mọi ngôn ngữ rơi về default tiếng Anh trong liquid.
  Tiếng Tây Ban Nha sửa tay: máy dịch ra "Pais natal" (nơi sinh) thay vì
  "Pais de origen". Ref SB-15143.
- `d3e1be807` — 2 lệnh translate đều **hardcode API key khác nhau trong source**, cái
  ở `autoTemplateTranslateV2` đã hết hạn nên script chết với 403 mù mờ về
  "unregistered caller". Đọc `GOOGLE_TRANSLATE_API_KEY` từ
  `packages/functions/.env.local` + fail fast. Kèm sửa `autoTranslateV2` resolve path
  theo `__dirname` thay vì `process.cwd()` (chạy `yarn update-label` từ repo root
  chết vì JSON parse error).

**3. MR !489 — fix 422 khi Save Settings** (`3b1d71c47`, chi tiết ở `134f84361`)
Ticket PDF-260802-ThFASq: MC sửa Company name rồi Save nhận 422 *"Cannot use
undefined as a Firestore value (found in field customCurrency.currencyDisplay)"*.
Company name vô can — **regression của PDF-260730** (chính là dev-zone custom
currency ship ở [[shipped-pdf-2026-08-01]]). `customCurrency` là
`yup.object().shape()` lồng **đầu tiên** trong `settingSchema`, mà yup 0.29 lấy chính
shape đó làm default → payload nào không gửi key `customCurrency` bị cast chèn
`{locale: undefined, currency: undefined, currencyDisplay: undefined}`. Đủ 3 mắt xích
thành lỗi production: `koa-yup-validator` ghi đè body bằng kết quả cast
(`lodash.set(ctx, 'req.body', data)`) → object rác xuống thẳng repository; Firestore
`update()` cấm `undefined`; Settings page GET rồi POST lại nguyên cục nên **gần như
mọi merchant chưa vào Dev zone > Custom currency đều dính**. Fix `.default(undefined)`;
đã quét toàn `src/schemas/`, `customCurrency` là nested `object()` duy nhất.
378 test pass + `settingSchema.test.js` (3 case) cast bằng đúng options của validator.
> Còn nợ, tách MR sau vì đụng middleware dùng chung: `middleware/validator.js` nuốt
> mọi lỗi downstream thành 422 (`koa-yup-validator` bọc cả `next()` trong `.catch`)
> nên lỗi Firestore **đội lốt lỗi validate** — chính vì vậy nhìn response dễ chẩn
> nhầm sang ký tự trong Company name; và `updateOrCreateSettings` nên strip
> `undefined` để chặn cả họ lỗi này.

**4. MR !491 — font picker** (`5768456ae`): thêm DM Sans + DM Serif Display
(`f8b28b53b`), kèm test giữ invariant label/value (`33005b5b2`) và bật env
jest/node cho `assets/__tests__` (`2c31b8ae2`). SB-15118.

**5. MR !482 — quickstart** (`c8673d554`): customize template mở thẳng màn edit và
tick done luôn. (Đã ghi nhận lúc còn trên nhánh ở [[shipped-pdf-2026-07-31]] —
nay đã vào master.)

**Perf** (`adfb6ec97`, đi cùng cụm campaign): dùng **một Pub/Sub client global** thay
vì `new PubSub()` trong thân hàm ở 5 chỗ (webhook 3, export 1, wholeSale 1) —
client tạo trong thân hàm phải dựng lại authorized connection + DNS query thừa ở
lần publish đầu của mỗi instance. Gom tên topic vào `config/pubsub.js` vì **gõ sai
tên topic là lỗi im lặng: publish vẫn thành công mà không ai nhận**.
(Cùng họ với memory-leak PubSub đã gặp bên Joy — [[digest-subscriptions-2026-07-24]].)

## Còn trên nhánh

`feat/campaign-unsubscribe` `73411b03e`/`f566cc627` — script gửi bulk cho vài chục
nghìn mail, thiết kế quanh giả định "kiểu gì cũng đứt giữa chừng": progress file
`.sent.jsonl` (chạy lại đúng lệnh cũ là bỏ qua địa chỉ đã gửi — cách xử lý **mọi**
sự cố đều là chạy lại lệnh đó), lỗi từng địa chỉ ghi riêng `.failed.jsonl` và
**không** ghi vào progress nên lần sau retry đúng cái hỏng, đọc lại opt-out ngay
trước khi gửi từng người (đợt gửi kéo cả tiếng, CSV chỉ là ảnh chụp), pool
connection + rate limit 8/s, SIGINT dừng sau mail đang gửi. Tách
`commands/shared/campaignMailer.js` dùng chung với script gửi test để hai đường
không sinh mail khác nhau — đặt ở `shared/` chứ không `lib/` vì `lib/` nằm trong
`.eslintignore`.

## Reverted

Không có.

## Deploy notes

- **Không** commit nào mang `[deploy-functions]`; không version tag; không migration file.
- ⚠️ **Cần trước khi vận hành**: `CAMPAIGN_UNSUBSCRIBE_SECRET` phải có trong env của
  Functions trước khi gửi campaign; `GOOGLE_TRANSLATE_API_KEY` phải nằm ở
  `packages/functions/.env.local` trước lần chạy translate kế tiếp (key hardcode cũ
  đã hết hạn).
- ⚠️ **Nợ bảo mật**: `d3e1be807` ghi rõ **3 key Google Translate đã từng commit vào
  source và còn trong git history — cần rotate**. Cùng loại với cảnh báo secrets
  hardcode trong `RELEASE_NOTE` đã ghi ở [[pdf]] và bài học env-qua-CI ở
  [[digest-shipping-labels-2026-07-27]].

## Liên quan

[[shipped-pdf-2026-08-01]] · [[shipped-pdf-2026-07-31]] · [[digest-pdf-2026-08-03]] ·
[[digest-pdf-2026-07-31]] · [[controller-service-repository]]
