# Joy Subscription — BRIEF (dropped)

## 2026-08-26 — dantt bỏ khi dọn BRIEF

_Task 1 (landing joyxjoy) dantt nói sẽ tự implement sau; 2 và 3 bỏ hẳn._

- [⏸️] Hiện tại tôi muốn bạn implement tính năng ở theme của khách như sau: 
    - trước mắt tôi muốn bạn xem qua page này https://joyxjoywholefoods.vercel.app/landing (đây là mockup của tính năng mới mà tôi muốn custom cho khách) (mockup này bạn có thể clone về để lấy code và hiểu thêm về context https://gitlab.com/longlv3/jarvis)
    - Bạn hãy giúp tôi clone các thông tin ví dụ như product, category(hay collection tuỳ thuộc vào cách mà page trên build trước mắt là như page là có phần "All", "Fruit & Veg", ... bạn check phần này là lấy từ đâu thì clone về store dev của tôi nhé)
    - Tính năng này base trên tính năng Product Fixed Bundle của app
    - Trước mắt thì hãy lên plan cũng như hiểu rõ về tính năng trên đã, sau đó thì clone về store dev của tôi (dantt-subscription-box.myshopify.com)
    - Sau đó thì có thể lên 1 BRIEF-CUSTOM.md để tôi có thể chạy loop để implement nhé?

   - **BLOCKER 19/08 10:05 — verifier FAIL 2 vòng trên `BRIEF-CUSTOM.md`, chờ dantt quyết.**
     Plan đã sửa đúng 4/5 finding vòng 1. Còn 1 lỗi sự thật làm sai một quyết định kiến trúc.
   - Finding nguyên văn verifier vòng 2:
     *"Mục E của plan sai sự thật — có writer ghi vào cả 2 metafield SHOP `avada_fixed_bundle` và
     `avada_product_handles_bundle_settings` mà plan khẳng định 'không có' —
     `packages/functions/src/services/metafieldService.js:212-221,248-257`, gọi từ
     `packages/functions/src/handlers/pubsub/backgroundHandler.js:291,378`.
     Đặc biệt nghiêm trọng vì `updateProductHandlesBundleMetaFields` được nạp trực tiếp từ
     `productBundleRepository.getAllPlansProductBundle(shopId)` — chính là nguồn dữ liệu Product
     Fixed Bundle mà Section 1 cần — nên phương án 'đọc qua shop metafield' đáng lẽ phải được
     đánh giá lại nghiêm túc... lý do 'không có writer' đã dùng để loại phương án là bịa/kiểm sai."*
   - ⇒ **Section 1 có thể KHÔNG cần route public mới** — dữ liệu đã được bake sẵn vào shop metafield.
     Cần quyết lại: đọc metafield (0 fetch, có sẵn lúc page load, nhưng phụ thuộc job sync)
     vs route public đọc thẳng Firestore (tươi, nhưng thêm 1 round-trip + phải viết route).
   - Hai phản biện của agent đã được verifier xác nhận ĐÚNG (verifier vòng 1 sai):
     `buildStaplesList` chỉ có 1 định nghĩa ở `subscriptionContractCreateService.js:648`;
     `resolveSwapLineKey.js` nằm ở `helpers/subscription/` không phải `services/subscription/`.
   - Đã chốt trong plan: Section 2 dùng **cơ chế mới generic**, không tái dùng `__box_id`/`buildStaplesList`.
   - CÒN CHỜ dantt: (1) page là trang storefront? (2) nơi trang sống (scripttag entry vs theme section)
     (3) section 1 đọc metafield hay route mới.
   - ⏸️ **dantt chốt 19/08 10:07: task này làm ở SESSION KHÁC.** Tách bạch — session này chỉ lo
     task CLS. Loop KHÔNG được nhận task này.
   - Trả lời đã có của dantt cho session sau: **nơi trang sống → để agent đề xuất sau khi đọc
     mockup kỹ hơn** (so 2 phương án scripttag entry Veluma-style vs section/template trong theme
     khách, khuyến nghị một cái kèm lý do, dantt duyệt sau).
   - Còn chờ dantt: (1) page có phải trang storefront không; (2) Section 1 đọc shop metafield
     có sẵn hay tạo route public mới (xem finding metafileService ở trên — có writer thật).
   - Trạng thái `BRIEF-CUSTOM.md`: đã sửa 4/5 finding vòng 1 (verifier xác nhận đúng);
     còn lỗi mục E chưa sửa (khẳng định sai "không có writer" cho 2 metafield SHOP).

- [⏸️] Cache key rơi về `default` ở standalone mode — mọi shop dùng chung một key
   - Nguyên văn finding verifier: *"`homeCardOrderCache.js:7-14` và `shopCache.js:14-21` đều
     fallback về chuỗi `'default'` khi thiếu `?shop=` trong URL. Ở standalone mode
     (`isEmbeddedApp === false`, `packages/assets/src/config/app.js:3`) không có code path nào
     thêm `?shop=` vào URL. Nên trên standalone, mọi shop dùng chung một key
     `avada:home:metricsFirst:default` — quyết định thứ tự của shop này rò sang phiên của shop
     khác trên cùng browser profile."*
   - ⚠️ **Rủi ro KẾ THỪA, không phải do commit `50e4b2fb0` gây ra** — `shopCache.js` đã fallback
     `'default'` y hệt từ trước, và nó cache cả object `shop` chứ không chỉ một boolean thứ tự card.
     Nên vấn đề gốc **rộng hơn** task 6: cần xem lại `shopCache.js` trước, `homeCardOrderCache.js` sau.
   - Chưa rõ mức độ thật: cần xác minh standalone mode có bao nhiêu người dùng, và trên cùng
     browser profile có thực sự xảy ra chuyện 2 shop khác nhau không.

   ### Tóm tắt task 8
   - **XONG** — nhánh `fix/cls-admin-bfs` · commit `c1cce5bea` · đã push origin.
     Diff thuần comment, 1 file (+4/−3): `packages/assets/src/pages/Onboarding/OnboardingV5/Steps/StepActivate/StepActivate.js:23-26`.
   - Verifier **PASS** ngay vòng 1. Kiểm từng khẳng định trong comment MỚI (đây mới là phần đáng
     kiểm — sửa comment nói dối mà thay bằng comment nói dối khác thì vô nghĩa):
     (a) `SET_SHOP` merge — đúng, `storeActions.js:37-45`;
     (b) caller trong file vẫn dựng `{...shopRef.current, ...}` — đúng, `StepActivate.js:45,51-56`;
     (c) cụm "with a stale snapshot" mình nghi là suy diễn thừa — **hoá ra đúng**: `handleRefreshStatus`
     và `handleRefreshBlockStatus` fire cùng lúc không await nhau trong cùng `useEffect`
     (`StepActivate.js:62-65`), closure `shop` sẽ để dispatch sau ghi đè field dispatch trước vừa set.
   - Đã grep xác nhận **không còn** chỗ nào khác trong `packages/assets/src` mô tả sai `SET_SHOP`
     (`"replaces the whole shop"`, `"SET_SHOP replaces"`, `"wholesale"` → 0 match).
   - Gate: `check.mjs` exit 0 · jest assets **16/162** exit 0 · jest functions **212/2053** exit 0.
     Bỏ vite build vì diff không ảnh hưởng bundle — verifier đánh giá lý do này chấp nhận được.

   ### Trạng thái task 9 — BLOCKER 19/08 11:40 (verifier FAIL 2 vòng)
   - Báo cáo: `shopcache-key-audit-2026-08-19.md`. Phần lớn đã được xác minh ĐÚNG qua 2 vòng.
   - **Đã xác minh ĐÚNG**: `getCacheKey()` đọc `location.search` tại call time
     (`shopCache.js:14-21`, `homeCardOrderCache.js:7-14`); `history.push` không mang `?shop=`;
     standalone **không bao giờ** đọc `readShopCache()` (`standalone.js:97-100` luôn bọc prop trong
     object literal mới nên luôn truthy → `storeReducer.js:23` luôn nhánh true — verifier chứng minh
     bằng `node -e`); `shopCache` chỉ có **3 write site** (`storeReducer.js:95,102,146`) và cả 3 đều
     trong `useEffect(..., [])` nên chỉ chạy lúc mount; mọi call giữa phiên (`App.js:63`,
     `storeActions.js:82,108,135`) chỉ `clearShopCache()` — xoá, không ghi.
   - ⇒ **Cả 2 claim rò chéo trước đó đều SAI**: của verifier task 6 (standalone dùng chung key), và
     của agent điều tra (edge case `isEmpty(shop)`).
   - **Bug thật #1 — invalidate bị vô hiệu hoá** (đã xác minh): `clearShopCache()` dùng chung
     `getCacheKey()`, nên khi gọi giữa phiên (SPA nav đã mất `?shop=`) nó xoá `avada:shop:default`
     (thường rỗng) thay vì key thật. Lần load sau `readShopCache()` đọc lại key thật **chưa từng bị
     xoá** → dữ liệu cũ tới 48h.
   - **Bug thật #2 — finding chưa được sửa vào báo cáo, LÝ DO FAIL:**
     Nguyên văn verifier: *"Claim tổng 'KHÔNG có đường rò dữ liệu chéo giữa các shop, xác nhận bằng
     code' — overclaim, không tương thích với chính bằng chứng report tự nêu về `homeCardOrderCache`
     — `Home.js:101-104`, `homeCardOrderCache.js:7-14`, `routes/routes.js:80,94-98`.
     `writeMetricsFirstCache(resolvedMetricsFirst)` chạy trong `useEffect(..., [resolvedMetricsFirst])`
     — chạy lại mỗi lần `Home` remount (SPA nav rời rồi quay lại `/`), dùng `getCacheKey()` fallback
     `'default'` giống hệt `shopCache.js`. Đây là write mid-session, ghi vào key dùng chung, có thể bị
     shop khác đọc trúng — đúng định nghĩa 'rò chéo' mà report dùng cho `shopCache` nhưng lại không
     áp dụng nhất quán cho `homeCardOrderCache`."*
   - ⚠️ **Bug #2 do commit `50e4b2fb0` (task 6) tạo ra** — nhánh `fix/cls-admin-bfs`, đã push.
     Mức độ: chỉ 1 boolean thứ tự card, KHÔNG phải PII, KHÔNG gây CLS (quyết định vẫn trước paint).
     Hệ quả: cá nhân hoá không đáng tin sau SPA nav; shop A có thể thấy thứ tự của shop B.
   - ⏸️ **CHỜ NGƯỜI**: đã FAIL 2 vòng verify → hết quota, thêm vòng phải có dantt duyệt.
     Loop KHÔNG được nhận task này.
   - Phần **fix code** của bug #1 + #2 đã tách sang **task 11** (dantt chốt 19/08 fix cả hai).
     Task 9 chỉ còn lại việc **sửa báo cáo** cho khớp — giá trị thấp hơn hẳn, vì báo cáo đã hoàn thành
     nhiệm vụ của nó là cung cấp đủ thông tin để ra quyết định.
   - Việc còn lại nếu dantt muốn: gỡ overclaim "không có rò chéo, xác nhận bằng code" ở Kết luận ngắn,
     và bổ sung phân tích `homeCardOrderCache` vào câu 5 (nơi duy nhất chứng minh "no leak" nhưng
     không nhắc helper này lần nào).

- [⏸️] https://918ud3-zi.myshopify.com/
check giúp anh store này , trước họ dùng Joy loyalty đc free bên mình, giờ gỡ loyalty rồi về stater pahir trả phí
Mà install date của họ là free forever
hay do mình bật cái toggle trả phí trong dev _zone lên nhỉ

   - **PHẦN PHÒNG NGỪA ĐÃ XONG 19/08** — nhánh `fix/loyalty-sync-free-forever` · commit `017366d16`
     · **MR 2489** (https://git.avada.net/avada/subscriptions/-/merge_requests/2489), base `origin/master`.
     dantt chốt: "nếu store đang ở free forever thì ko sync từ loyalty sang mình".
     Sửa `services/shopService.js` — guard `if (isFreeForever(shop)) return;` đặt sau khi fetch
     integration, TRƯỚC CASE 1. Chặn cả 2 caller (`POST /joy-integrations` và `installationService.js:158`).
     Dùng thẳng `isFreeForever()` được vì shop free-forever chưa bị gift thì `customPricing` còn trống
     → trả `true`. Shop đã lỡ gift trả `false` → guard không bắn → **CASE 2 vẫn dọn được**, đúng ý.
   - ⚠️ Fixture test cũ `installedAt: 2025-01-01` khiến MỌI shop trong `shopServicePartnerStore.test.js`
     vô tình là free-forever → 2 test đỏ ngay khi thêm guard. Đẩy sang `2026-01-01`: sau cutoff
     free-forever (2025-11-04) nhưng trước `GO_LIVE_PRICING_V4` (2026-03-16) nên `getDefaultLoyaltyPlan`
     vẫn trả Advanced → 6 test cũ giữ nguyên ý định. Thêm 4 test mới.
   - Mutation test: gỡ guard trên bản backup → đúng 2 test đỏ. Gate: `yarn check` exit 0 ·
     jest functions exit 0 **212/212 suite, 2057/2057 test** (baseline 2053 + 4 mới).
   - ⚠️ **PHÒNG, KHÔNG CHỮA**: shop `918ud3-zi` đã có `customPricing.enabled=true` + `recurChargeId`
     nên guard không đụng tới. Vẫn cần dantt sửa tay + xử riêng charge `88207425923`.
