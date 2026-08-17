# Kookut — Báo cáo tổng hợp lỗi (app Joy Subscription)

> **Khách:** Kookut · hello@kookut.com · https://kookut.myshopify.com (Pháp) · gói **Free**, cài **31/05/2025**  
> **Trạng thái:** Crisp `unresolved` · segment `high_risk_don't_ask_for-review` · **nguy cơ 1★ cao**  
> **Phạm vi dữ liệu:** 31/05/2025 → 14/08/2026 (~14,5 tháng, 2 inbox Crisp) · ~3.590 message · 20+ ticket JOY/JSUB  
> **Nguồn Crisp:** [inbox Solar](https://app.crisp.chat/website/4c596ff3-74ec-42aa-a5a6-086556f7cd79/inbox/session_3c64268e-a3f0-4881-b2f5-a7b6a273136f/) · [inbox Avada](https://app.crisp.chat/website/72a663b0-4cda-4e3b-8878-426bdd79364c/inbox/session_32885315-2294-471a-895a-8207729649cf/)  
> **Lưu ý:** status ticket dưới đây **suy luận từ Crisp+Slack** (API helpdesk token hết hạn); cần đối chiếu status chính thức khi có key.

## Tóm tắt nhanh

- **54 lượt báo lỗi** trong 14,5 tháng. Phân loại: **33 fix-rồi-lại-bị (tái diễn)**, 15 không-phải-bug/won't-fix/config, 5 fix-1-lần, **1 đang mở (khủng hoảng)**.
- **Lỗi dày ngay từ tháng đầu** (T7/2025: 7 lỗi/tháng, 1 tháng sau cài). App gần như chưa bao giờ 'êm'. Căng nhất **T7–T8/2026** (T7 đỉnh 205 msg khách, T8 dồn 96 msg/2 tuần + khủng hoảng overcharge).
- **Nguyên nhân gốc lặp lại:** app tự tính/ghi sai **giá & shipping rate vào subscription contract**; sửa tay từng contract rồi lỗi lại.
- **Khủng hoảng hiện tại (#9):** app lấy giá gói 24×70g gán cho SP lẻ 70g → overcharge (€313 thay vì ~€96); root cause chưa xong tính đến 14/08.

## 1. Khách quan tâm lỗi nào nhất (chấm từ 1.398 message của khách)

Xếp theo mức độ khách QUAN TÂM (nhắc lại, cường độ, tự gọi 'main issue', gắn doạ-1★ & thiệt hại kinh doanh) — **khác** với lỗi báo nhiều nhất.

| # | Lỗi | Điểm | Nhắc | Cường độ | Tín hiệu |
|---|-----|:---:|:---:|:---:|------|
| 1 | Giá sai / overcharge khách của họ | **96** | 7× | 5/5 | KH gọi **'the main issue'** · doạ 1★ · thiệt hại KD |
| 2 | Quá nhiều bug / product chưa hoàn thiện | **96** | 16× | 5/5 | *'beta testing for months'* · bền bỉ nhất |
| 3 | Khó tự edit–manage subscription (UI) | **92** | 22× | 5/5 | KH gọi **'second main issue'** · nhắc nhiều nhất |
| 4 | Free shipping áp mọi recurring / phí ship | **92** | 18× | 5/5 | *'going on for months, still happening'* · mất tiền |
| 5 | Payment / billing fail | **92** | 7× | 5/5 | *'losing subscribers'* · tốn thời gian nhất |
| 6 | Discount 5% không áp đúng | **82** | 10× | 4/5 | *'a major flaw'* |
| 7 | Checkout / không ship tới địa chỉ | **82** | 5× | 4/5 | orders don't go through |
| 8 | Uy tín với khách của họ / review | **72** | 4× | 4/5 | *'we are crooks'* |
| 9 | Double order / trigger 2 lần | **58** | 8× | 4/5 | — |
| 10 | Frequency hiển thị sai | **58** | 10× | 3/5 | KH tự bảo *'no need to waste time on it'* |

**Chốt:** khách quan tâm nhất những lỗi **đụng tới business & uy tín của HỌ** (overcharge → 'crooks'/review xấu; free-ship & payment fail → mất tiền/subscriber; không tự sửa sub được → không scale). Hai 'main issue' khách tự nêu 14/08: **(1) giá/overcharge, (2) UI tự-quản-lý subscription**.

## 2. Bảng 15 nhóm lỗi giai đoạn gần (03→08/2026)

Phân loại: 🔴 đang mở · 🟠 fix-rồi-lại-bị/chưa-dứt · 🟢 đã fix · ⚫ không-phải-bug/won't-fix/minor

| # | Lỗi | KH báo | Báo dev | Ticket / thread | Trạng thái | |
|---|-----|:---:|:---:|-----|------|:--:|
| 1 | Free shipping áp cho MỌI đơn recurring (KH chỉ muốn đơn đầu) | 03/04 | 07/04 | [JSUB-260407-C4Pv3B](https://helpdesk.avada.net/t/JSUB-260407-C4Pv3B) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1778263477942079) | Tái diễn ×8; fix cục bộ contract 13/08, root cause chưa xong | 🟠 |
| 2 | Discount 5%/badge không áp khi swap product cùng sellingPlan | 17/03 | 18/03 | [JSUB-260609-6Eaynj](https://helpdesk.avada.net/t/JSUB-260609-6Eaynj) · [JSUB-260624-pgsF3m](https://helpdesk.avada.net/t/JSUB-260624-pgsF3m) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1781050301927949) · [Trello](https://trello.com/c/1ORYkTBI) | Đã fix 16/06 (root cause sellingPlanId); từng tái diễn 3 lần | 🟢 |
| 3 | Checkout fail 'not shipping to this address' (Pisani) | 08/05 | 28/05 | [JSUB-260528-mThrLe](https://helpdesk.avada.net/t/JSUB-260528-mThrLe) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1779960903312909) | Không tái hiện; workaround tạo contract tay 29/05 | 🟢 |
| 4 | Không nhập được pickup location code (Mondial Relay) | 28/05 | 01/07 | [JSUB-260701-hqac4K](https://helpdesk.avada.net/t/JSUB-260701-hqac4K) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1782955208062549) | Won't-fix — cần custom trả phí; KH từ chối | ⚫ |
| 5 | Sai currency: sub tính CHF thay vì EUR | 01/07 | 01/07 | [JSUB-260701-hqac4K](https://helpdesk.avada.net/t/JSUB-260701-hqac4K) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1782955208062549) · MR 2284/2293 | Đã fix 06/07 (chọn currency theo Markets) | 🟢 |
| 6 | Sub trigger 2 lần → double charge #10423/#10424 | 12/07 | 12/07 | [JSUB-260712-NyjRxk](https://helpdesk.avada.net/t/JSUB-260712-NyjRxk) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1783854887894269) · MR 2322 | Root cause fix 13/07 (redis lock); double charge→hoàn tiền | 🟢 |
| 7 | Sai phí ship 7.99€ thay vì 10€ (sub #151147970941) | 14/07 | 15/07 | [JSUB-260715-fY4Ses](https://helpdesk.avada.net/t/JSUB-260715-fY4Ses) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1784114012506859) · [SB-14315](https://space.avada.net/browse/SB-14315) · MR 2344 | Custom về 10€ 24/07; root cause chưa chắc; KH phản đối | 🟠 |
| 8 | Edit company name không lưu; shipping option revert | 22/07 | 22/07 | [JSUB-260722-AuRa7p](https://helpdesk.avada.net/t/JSUB-260722-AuRa7p) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1784714043626069) · MR 2398 | Company name fix 24/07; revert = do config profile | 🟢 |
| 9 | Giá pack 24×70g gán cho SP lẻ 70g → overcharge €313 | 11/08 | 12/08 URGENT | [JSUB-260811-TWjnqq](https://helpdesk.avada.net/t/JSUB-260811-TWjnqq) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786494004579699) | **ĐANG MỞ** — sửa tay 14/08 (€313.69→€95.95); root cause chưa xong | 🔴 |
| 10 | Upcoming order không hiển thị hết | 12/08 | 12/08 | [JSUB-260812-WNwa8Q](https://helpdesk.avada.net/t/JSUB-260812-WNwa8Q) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786524942309849) | Không phải bug — order cũ kẹt filter search bar | ⚫ |
| 11 | Payment declined (thẻ Mastercard hết hạn) | 14/08 | 14/08 | [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786494004579699) | Không phải bug app — thẻ hết hạn 07/2026; KH tranh chấp | ⚫ |
| 12 | Khách của KH không cancel được subscription | 28/05 | 28/05 | [JSUB-260528-mThrLe](https://helpdesk.avada.net/t/JSUB-260528-mThrLe) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1779960903312909) | Team nói config KH nhưng KH phủ nhận; nhắc lại 10/06, 03/07, 15/07 | 🟠 |
| 13 | KH không tag vẫn mua được SP hạn chế (breeders) | 14/07 | 14/07 | [JSUB-260713-Aqmszw](https://helpdesk.avada.net/t/JSUB-260713-Aqmszw) | Won't-fix — Joy không có tính năng chặn mua theo tag | ⚫ |
| 14 | App tiếng Pháp (muốn tiếng Anh) + màu giá tương phản kém | 23/03 | — | — | Minor — hướng dẫn tự đổi ở Dashboard; contrast KH tự rút | ⚫ |
| 15 | Customer portal: khách khó tự edit/manage subscription | 24/04 | — | liên quan JSUB-260722 | Chưa dứt điểm — 'vấn đề chính #2' của KH; nhắc lại nhiều lần | 🟠 |

## 3. Chuỗi tái diễn mãn tính (fix rồi lại bị)

### Giá sản phẩm / variant sai (→#9) — 🔴 fixed rồi thành khủng hoảng
- **17/09/25** — dev 'successfully fixed' (Pacific Tuna variant) · [Trello](https://trello.com/c/tCZTUCVY) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1758100340693899)
- **23/01/26** — OTP hiện giá sub (38 vs 40€)
- **11/08/26** — giá pack gán cho SP lẻ → €313 — **ĐANG MỞ** · [JSUB-260811-TWjnqq](https://helpdesk.avada.net/t/JSUB-260811-TWjnqq)

### Double order / trigger 2 lần (→#6) — 'fixed' ≥3 lần vẫn tái diễn
- **31/05/25** — 'all products are duplicated'
- **23/07/25** — dev fix (JOY1034/1035) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1753326812700099)
- **02/12/25** — 'processed twice, 2 identical orders' · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1764634703900129)
- **02/03/26** — Iris fix (#139674878333) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1772442264468889)
- **12/07/26** — trigger 2 lần → MR 2322 · [JSUB-260712-NyjRxk](https://helpdesk.avada.net/t/JSUB-260712-NyjRxk)

### Frequency hiển thị sai (MỚI) — 'fixed' ≥2 lần, tái diễn
- **01/07/25** — mobile app sai frequency · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1751453237303109)
- **05/10/25** — fix bản dịch frequency
- **16/01/26** — dev fix (list 2 vs 4 tháng) · [Trello](https://trello.com/c/sgtYUuxL) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1768561116531029)
- **02/03/26** — lại sai 3 vs 1 tháng → fix lại · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1772442264468889)

### Customer portal tự edit (→#15) — 'fixed' rồi lại hỏng
- **13/07/25** — cần link portal cho khách
- **06/10/25** — fix nút validate add product · [Trello](https://trello.com/c/q0vTkJZI)
- **18/11/25** — không scroll validate → fix → 'still not working'
- **22/07/26** — customer tried but couldn't see it (sau khi Olivia add block 16/07) · [JSUB-260722-AuRa7p](https://helpdesk.avada.net/t/JSUB-260722-AuRa7p)
- **14/08/26** — 'second main issue' — 'I can't modify anything on my end'

### Checkout 'not shipping to address' (→#3) — tái diễn ≥3 lần
- **05/10/25** — 'cannot be shipped... same address as before'
- **23/01/26** — 'address was invalid' (OTP)
- **08/05/26** — Virginie Pisani → workaround tạo contract tay · [JSUB-260528-mThrLe](https://helpdesk.avada.net/t/JSUB-260528-mThrLe)

### Payment / billing fail (→#11) — tái diễn ≥4 lần
- **07/07/25** — billing failed #JOY1006-1 (Shop Pay) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1751531787346349)
- **16/07/25** — đơn fail không ship, không báo
- **12/11/25** — fail hàng loạt, không có nút retry
- **14/08/26** — thẻ declined (Charbonneau) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786494004579699)

### Free shipping mọi recurring (→#1) — chưa dứt điểm
- **06/12/25** — bị charge ship dù >50 CHF free · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1765043927667719)
- **26/02/26** — free ship áp cả sub
- **03/04/26** — 'fixed then reappeared' · [JSUB-260407-C4Pv3B](https://helpdesk.avada.net/t/JSUB-260407-C4Pv3B)
- **13/08/26** — fix cục bộ contract, root cause chưa xong · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786494004579699)

### Discount không áp / badge (→#2) — tái diễn ≥4 lần → fix 06/26
- **07/06/25** — badge 5% sai bản FR/IT → fix
- **08/10/25** — 5% không áp khi edit đơn
- **22/11/25** — add product admin không auto discount
- **30/12/25** — 50% vẫn áp order 2 sau khi hết sale
- **09/06/26** — root cause sellingPlanId → fix 16/06 · [JSUB-260609-6Eaynj](https://helpdesk.avada.net/t/JSUB-260609-6Eaynj)

### Trang sub 'Page Not Found' / error page (MỚI) — fix rồi bị lại
- **21/11/25** — error page khi edit sub · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1763512667033949)
- **24/11/25** — dev báo fixed
- **01/12/25** — 'still encountering' (dev không repro)

## 4. Nguyên nhân gốc chung (cho dev)

Phần lớn lỗi nghiêm trọng & tái diễn (#1, #2, #5, #7, #9) quy về **app đọc/recalc/ghi đè sai giá & shipping rate vào subscription contract**:
- `autoUpdateShippingRate()` chạy convert currency **ngay cả khi EUR→EUR** → 10€ bị rescale còn 7.99€ (**SB-14315**).
- Product chung **`sellingPlanId`** (plan v2) → swap/edit 1 SP làm hỏng data discount SP khác (#2).
- App **đọc nhầm nguồn giá** (pack 24×70g vs lẻ 70g) và ghi số không khớp bảng giá Markets vào contract (#9).
- Sửa tay trong app **không ăn** vì giá lưu bên Shopify, lần sync sau ghi đè lại (#9).
- Race condition worker billing → **double charge** (#6, đã fix bằng redis lock per-cycle, MR 2322).

## 5. Khuyến nghị

1. **Dứt điểm #9 trước tiên** — fix triệt để việc app ghi giá sai vào contract; **audit toàn bộ contract của Kookut** để quét giá/phí ship còn sai, chủ động sửa trước khi khách phát hiện thêm.
2. **Gom họ lỗi giá/ship thành 1 ticket root-cause hệ thống** — thay vì fix tay từng contract (nguồn gốc của 'fix rồi lại bị').
3. **Trả lời 'vấn đề chính #2': self-service UI (#15)** — đưa việc cho khách/merchant tự edit basket & subscription vào roadmap + phản hồi mốc thời gian.
4. **Chốt rõ các case won't-fix (#4 pickup code, #13 tag-gating)** — ghi nhận thành feature request chính thức, tránh để lơ lửng.
5. **Chỉ định 1 owner duy nhất cho case Kookut** — giảm 'new person every two hours'.
6. **Xác minh lại #11 & #12 bằng log trước khi khẳng định với KH** — khách đang phản biện; tránh đổ lỗi cho khách khi chưa chắc.

## 6. Toàn bộ 54 lượt lỗi theo thời gian

Ký hiệu phân loại: 🔴 mở · 🟠 fix-rồi-lại-bị · 🟢 fix-1-lần · ⚫ không-bug/won't-fix

**2025-05**

- 🟠 `31/05` 'All products are duplicated' (ngày cài app)

**2025-06**

- ⚫ `03/06` PayPal không thanh toán được subscription
- 🟢 `07/06` Badge 5% sai bản tiếng Pháp/Ý → fix

**2025-07**

- 🟠 `01/07` Shopify mobile app hiện sai frequency — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1751453237303109)
- ⚫ `02/07` Existing customer bị tính first-time (sai data acquisition)
- ⚫ `03/07` Merchant không thấy ngày cancel subscription
- 🟠 `07/07` Billing failed #JOY1006-1 (Shop Pay), retry fail — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1751531787346349)
- 🟠 `13/07` Cần link portal cho khách tự edit sub
- 🟠 `16/07` Đơn đến hạn fail không ship + không được báo
- 🟠 `23/07` Duplicate subscription JOY1034/JOY1035 → fix — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1753326812700099)

**2025-08**

- ⚫ `08/08` App tự reset màn hình setup checklist

**2025-09**

- ⚫ `01/09` Channel trống cho subscription order (by design)
- 🟠 `17/09` Giá variant Pacific Tuna sai → 'successfully fixed' — [Trello](https://trello.com/c/tCZTUCVY) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1758100340693899)
- 🟢 `23/09` Upcoming order T10 không tạo sau đổi frequency → fix — [Trello](https://trello.com/c/Ay7GuHml) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1758626692485169)

**2025-10**

- 🟠 `05/10` 'Order cannot be shipped to the selected address'
- 🟢 `05/10` Frequency không dịch theo ngôn ngữ → fix
- 🟠 `06/10` Không add/validate product vào sub (không có nút) → fix — [Trello](https://trello.com/c/q0vTkJZI)
- 🟠 `07/10` OTP product hiện 'delivery every 3 months'
- 🟠 `08/10` 5% không áp cho tất cả SP khi edit đơn
- 🟠 `08/10` Duplicate line SP khi edit sub

**2025-11**

- 🟠 `12/11` Payment fail hàng loạt, không có nút retry
- 🟠 `18/11` Không scroll validate → fix → 'still not working'
- 🟠 `21/11` Trang subscription 'Page Not Found' → fix → bị lại — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1763512667033949)
- 🟠 `22/11` Add product admin không auto áp 5% + SKU mới lỗi
- ⚫ `24/11` Nghi app tự pause sub sau payment fail (không phải bug)

**2025-12**

- 🟠 `02/12` 'Processed twice' — 2 đơn giống hệt → cải thiện UX — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1764634703900129)
- 🟠 `06/12` Bị charge ship dù đơn >50 CHF đủ free shipping — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1765043927667719)
- 🟠 `30/12` Discount 50% vẫn áp order 2 sau khi hết sale
- ⚫ `30/12` Đổi frequency nhưng ngày giao kế không cập nhật (by design)

**2026-01**

- ⚫ `16/01` Store credit không áp được cho recurring (won't-fix) — [Trello](https://trello.com/c/kINnc1y1) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1768522371696189)
- 🟠 `16/01` List hiện sai frequency (2 vs 4 tháng) → fix — [Trello](https://trello.com/c/sgtYUuxL) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1768561116531029)
- 🟠 `23/01` OTP product hiện giá subscription (38 vs 40€)
- 🟠 `23/01` 'Address invalid' không finalize được order OTP
- ⚫ `26/01` Không hide subscription theo customer tag (Btob)

**2026-02**

- 🟠 `25/02` Shipping option không tự update khi đổi sang nước khác
- 🟠 `26/02` Free shipping đơn đầu áp cho toàn bộ sub

**2026-03**

- 🟠 `02/03` Subscription tạo 2 đơn cùng ngày #139674878333 → fix — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1772442264468889)
- 🟠 `04/03` Setting 'update shipping rate' tự revert
- ⚫ `08/03` Không edit được đơn đã thanh toán (Shopify limit)
- 🟠 `17/03` Discount 5%/badge không áp khi swap product — [JSUB-260609-6Eaynj](https://helpdesk.avada.net/t/JSUB-260609-6Eaynj) · [JSUB-260624-pgsF3m](https://helpdesk.avada.net/t/JSUB-260624-pgsF3m)
- ⚫ `23/03` App tiếng Pháp + màu giá tương phản kém

**2026-04**

- 🟠 `03/04` Free shipping áp MỌI đơn recurring ('fixed then reappeared') — [JSUB-260407-C4Pv3B](https://helpdesk.avada.net/t/JSUB-260407-C4Pv3B) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1778263477942079)
- 🟠 `24/04` Khách khó tự edit/manage subscription ('main issue #2')

**2026-05**

- 🟠 `08/05` Checkout fail 'not shipping to address' (Pisani) — [JSUB-260528-mThrLe](https://helpdesk.avada.net/t/JSUB-260528-mThrLe) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1779960903312909)
- ⚫ `28/05` Không nhập được pickup location code (Mondial Relay) — [JSUB-260701-hqac4K](https://helpdesk.avada.net/t/JSUB-260701-hqac4K) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1782955208062549)
- 🟠 `28/05` Khách của KH không cancel được subscription — [JSUB-260528-mThrLe](https://helpdesk.avada.net/t/JSUB-260528-mThrLe)

**2026-07**

- 🟢 `01/07` Sai currency: sub tính CHF thay vì EUR → fix 06/07 — [JSUB-260701-hqac4K](https://helpdesk.avada.net/t/JSUB-260701-hqac4K)
- 🟠 `12/07` Sub trigger 2 lần → double charge → fix — [JSUB-260712-NyjRxk](https://helpdesk.avada.net/t/JSUB-260712-NyjRxk) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1783854887894269)
- 🟠 `14/07` Sai phí ship 7.99€ thay vì 10€ (SB-14315) — [JSUB-260715-fY4Ses](https://helpdesk.avada.net/t/JSUB-260715-fY4Ses) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1784114012506859)
- ⚫ `14/07` KH không tag vẫn mua được SP hạn chế (won't-fix) — [JSUB-260713-Aqmszw](https://helpdesk.avada.net/t/JSUB-260713-Aqmszw)
- 🟢 `22/07` Edit company name không lưu → fix 24/07 (MR 2398) — [JSUB-260722-AuRa7p](https://helpdesk.avada.net/t/JSUB-260722-AuRa7p) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1784714043626069)

**2026-08**

- 🔴 `11/08` Giá pack 24×70g gán cho SP lẻ → overcharge €313 — [JSUB-260811-TWjnqq](https://helpdesk.avada.net/t/JSUB-260811-TWjnqq) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786494004579699)
- ⚫ `12/08` Upcoming order không hiện hết (do filter search bar) — [JSUB-260812-WNwa8Q](https://helpdesk.avada.net/t/JSUB-260812-WNwa8Q) · [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786524942309849)
- ⚫ `14/08` Payment declined (thẻ hết hạn) — KH tranh chấp — [Slack](https://avadaio.slack.com/archives/C07URV6QMJ8/p1786494004579699)

---
*Báo cáo do CS tổng hợp từ Crisp + Slack + ticket helpdesk. Ngày giờ theo giờ VN (UTC+7). Status ticket là suy luận (API helpdesk chưa truy cập được) — cần verify chính thức.*
