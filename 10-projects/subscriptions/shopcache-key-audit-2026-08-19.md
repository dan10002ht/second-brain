# Audit: cache key scoping (shopCache + homeCardOrderCache) — 2026-08-19

Branch audited: `fix/cls-admin-bfs` @ `c1cce5bea`, `/Users/dantt1002/projects/subscriptions`. Read-only — no files in the repo were touched, no git write commands were run.

## Kết luận ngắn

**Bug thật, nhưng KHÔNG phải rò dữ liệu chéo giữa các shop — chỉ là cache-invalidation của chính shop đó bị vô hiệu hoá.**

- Verifier nói: *"standalone không có `?shop=` nên standalone dùng chung key `default`, rò sang shop khác"*. Đọc code thì thấy **standalone không đọc `shopCache` để render** trong đường đi bình thường — verifier sai ở điểm này (câu 2 bên dưới).
- Vòng audit trước (bản nháp của báo cáo này) từng khẳng định có "rò chéo THẬT" ở standalone qua 1 edge case (`isEmpty(shop)` → `activeShop = null` → rơi vào `readShopCache()`). **Claim đó SAI, đã tự verify lại và gỡ bỏ** — xem câu 3 bên dưới: `standalone.js` luôn bọc `activeShop` trong object literal mới (`{...activeShopWithLocalFormat, shopInfo: ...}`) trước khi truyền cho `StoreProvider`, nên prop này **luôn truthy** dù `shop` API trả rỗng. `storeReducer.js:23` (`if (activeShop)`) luôn nhận nhánh true → `readShopCache()` không bao giờ chạy cho standalone, không có ngoại lệ nào cả.
- Có một bug thật, áp dụng cho **cả embedded lẫn standalone**: `?shop=` trong `window.location.search` **chỉ tồn tại ở lần load trang đầu tiên**. Router nội bộ (`history.js`) không giữ lại query string khi điều hướng SPA (`history.push`/`replace` chỉ ghép `basename + pathname`, bỏ `search`). Sau khi merchant bấm 1 link trong app, `location.search` rỗng — mọi lần gọi `getCacheKey()` sau đó đều rơi về `'default'`.
- Nhưng đã grep **toàn bộ call site** của `writeShopCache`/`readShopCache`/`clearShopCache` trong `packages/assets/src` (câu 5) và xác nhận: **`writeShopCache()` chỉ được gọi bên trong mount effect của `StoreProvider`** (`storeReducer.js:95, 102, 146`) — tức luôn chạy ngay sau lần load trang đầu tiên, trước khi merchant kịp điều hướng đi đâu. Mọi lệnh gọi SAU khi đã điều hướng (`App.js:63`, `storeActions.js:82/108/135`) đều chỉ là `clearShopCache()` — **xoá, không ghi**. Vì vậy không có đường code nào ghi dữ liệu thật của shop A vào key `avada:shop:default` giữa phiên, kể cả ở embedded. Không tìm được cơ chế nào khiến shop B đọc nhầm dữ liệu shop A trong luồng điều hướng bình thường.
- Hệ quả chính là:
  1. **Cache invalidation bị vô hiệu hoá cho shop của chính mình** — `clearShopCache()` gọi sau khi đã điều hướng sẽ xoá nhầm key `avada:shop:default` (rỗng hoặc không liên quan) thay vì key thật `avada:shop:<domain>` đã ghi lúc mount. Key thật bị mồ côi (đứng yên tới 48h) trong khi dữ liệu đã đổi (mutation, đổi locale, subscribe...) không được invalidate.
  2. **`homeCardOrderCache` bị flash sai thứ tự cho chính shop đó** khi Home remount lần 2 trong cùng phiên (điều hướng đi rồi quay lại) — đúng cái CLS mà cache này sinh ra để chống, nay tái diễn qua đường vòng khác.
  3. **Không có rò chéo dữ liệu giữa các shop khác nhau được xác nhận bằng code**, kể cả trường hợp chia sẻ browser (agency/CRM). Điều kiện duy nhất còn lại có thể tạo rò thật — chính lần full-page load ĐẦU TIÊN của một phiên (không phải SPA nav) lại thiếu `?shop=` — nằm ngoài phạm vi source code đọc được (phụ thuộc Shopify Admin/App Bridge dựng URL iframe), vẫn để ở mục "Chưa xác minh" như bản gốc, không phải finding mới.
- Mức độ: **trung bình, không phải nghiêm trọng** — đây là cache tăng tốc UX (skeleton-first render), không phải nguồn dữ liệu duy nhất (mọi trường luôn được `/shops` fetch lại và ghi đè trong vài trăm ms); và impact thật sự chỉ là cache-invalidation của chính shop đó bị hỏng (dữ liệu cũ tới 48h), không phải rò PII giữa các merchant.

## Trả lời 6 câu hỏi

### 1. Fallback `'default'` có thật không, ở đâu?

Xác nhận, đọc trực tiếp:

- `packages/assets/src/helpers/shopCache.js:14-21` (`getCacheKey`):
  ```js
  function getCacheKey() {
    try {
      const shop = new URLSearchParams(window.location.search).get('shop') || 'default';
      return `avada:shop:${shop}`;
    } catch {
      return 'avada:shop:default';
    }
  }
  ```
- `packages/assets/src/helpers/homeCardOrderCache.js:7-14` — cùng pattern, key `avada:home:metricsFirst:${shop}`.

Grep toàn bộ `packages/assets/src` cho `get('shop')`/`get("shop")` — **chỉ 2 file này** đọc `shop` query param để làm cache key. Không còn helper nào khác cùng pattern. (Đã grep `shop=` rộng hơn — 37 match, còn lại đều là prop `shop={shop}` trong JSX hoặc URL build khác, không liên quan cache key.)

### 2. Standalone THẬT SỰ không có `?shop=`? — Đúng, nhưng không quan trọng như finding gốc nghĩ

Đọc `packages/assets/src/config/app.js:3`, `standalone.js`, `App.js`, `reducers/storeReducer.js`:

- `standalone.js:65-73`: standalone tự fetch `/shops` bằng Firebase ID token (`auth.currentUser`), KHÔNG có bước nào thêm `?shop=` vào URL. Xác nhận đúng như finding.
- Nhưng **quan trọng hơn**: `standalone.js:98-100` truyền `activeShop` như prop thẳng vào `<StoreProvider activeShop={...}>`.
- `reducers/storeReducer.js:22-38` (`initState`):
  ```js
  if (activeShop) {
    window.activeShop = activeShop;
    ...
    return {user: initialUser || null, shop: activeShop, loading: false};
  }
  const cached = readShopCache();   // chỉ chạy khi KHÔNG có activeShop prop
  ```
  → Vì standalone LUÔN truyền `activeShop` như một object truthy (xem câu 3 — kể cả khi `/shops` trả rỗng), nhánh `readShopCache()` **không bao giờ chạy** cho standalone, không có ngoại lệ. `readShopCache()` chỉ thực sự dùng để render ở **embed.js** (dòng `<StoreProvider><App/></StoreProvider>` không truyền `activeShop`, `storeReducer.js:21-38`).
- `applyIntegrations` (`storeReducer.js:75-96`) có 1 chỗ đọc cache dự phòng: `user: user || readShopCache()?.user` (dòng 95) — nhưng với standalone, `user` param luôn truyền `initialUser` là Firebase user object (luôn truthy) → short-circuit, không bao giờ đọc cache ở đây trong thực tế.
- **Standalone vẫn GHI vào `avada:shop:default`** (`storeReducer.js:101-108`, gọi `writeShopCache({shop: activeShop, user: initialUser})`) — ghi write-only, lãng phí storage nhưng bản thân không gây leak-đọc trong đường bình thường.

**Kết luận câu 2**: Verifier đúng về sự kiện (không có `?shop=` ở standalone) nhưng SAI về hệ quả — vì standalone bypass hoàn toàn đường đọc cache trong luồng chuẩn.

### 3. Ở standalone, một người có thể dùng nhiều shop trên cùng browser profile không?

Có 2 câu trả lời khác nhau tuỳ ngữ cảnh:

- **Luồng chuẩn (đăng nhập → xem 1 shop):** Mỗi Firebase account gắn với đúng 1 `shopId` phía backend. `packages/functions/src/controllers/shopController.js:60-67` (`getUserShops`) dùng `getCurrentShop(ctx)` — tức lấy `shopId` từ token, KHÔNG có tham số nào chọn shop. Không tìm thấy UI "đổi shop" nào trong `packages/assets/src` (không có component switcher, không route `/shops/:id`). → Trong một phiên đăng nhập, không có cách nào user tự đổi shop.
- **Nhưng shared-browser case là có thật:** `App.js:38` có `shop?.isCrmLogin` — tồn tại khái niệm login nội bộ/CRM khác biệt user thường. Không đọc được đủ code để biết nó có cho phép xem nhiều shop trong 1 phiên hay không (không mở rộng phạm vi điều tra vì brief giới hạn 2 file cache). **Chưa xác minh được** liệu tính năng CRM login này có bật multi-shop switch hay không.
- **Edge case đã kiểm tra lại và GỠ BỎ (SAI ở vòng audit trước)**: từng nghĩ rằng nếu `/shops` trả `shop` rỗng (`isEmpty(shop)` true), `activeShop = null` sẽ khiến `if (activeShop)` ở `storeReducer.js:23` false và rơi vào `readShopCache()`. **Đọc kỹ lại `standalone.js:88-100` thì thấy sai**: dù `activeShop` cục bộ là `null`, nó không được truyền thẳng cho `StoreProvider` — nó bị bọc lại trong 2 lớp:
  ```js
  // standalone.js:88-100
  const activeShopWithLocalFormat = useGMT7Timezone ? {...activeShop, timezone: 'Asia/Ho_Chi_Minh'} : activeShop;
  root.render(
    <StoreProvider {...{user, activeShop: {...activeShopWithLocalFormat, shopInfo: shopInfoWithLocalFormat}}}>
  ```
  Prop cuối cùng truyền cho `StoreProvider` luôn là **một object literal MỚI** `{...activeShopWithLocalFormat, shopInfo: ...}` — spread của `null`/`undefined` không throw, chỉ đơn giản không thêm field nào, nên kết quả tối thiểu là `{shopInfo: undefined}`, một object **luôn truthy**. Tự verify bằng `node -e` (xem output bên dưới): dù input rỗng, prop cuối cùng vẫn là `{ shopInfo: undefined }`, `!!prop === true`.
  → `storeReducer.js:23` (`if (activeShop)`) **luôn luôn true** cho standalone, kể cả khi `/shops` trả rỗng. `readShopCache()` **không có ngoại lệ nào** để chạy được ở standalone trong toàn bộ mã nguồn hiện tại.

**Kết luận câu 3 (đã sửa)**: Không có rò chéo nào ở standalone — không phải "hẹp", mà là **không tồn tại đường code nào** dẫn tới nó. `readShopCache()` chỉ thực sự được gọi để render ở **embed.js path** (câu 5).

### 4. `shopCache` rò cái gì nếu key đụng nhau?

`shopCache.js:45-52` (`writeShopCache`) lưu toàn bộ object `shop` sau khi lọc:

- `shopCache.js:7-12` (`SENSITIVE_SHOP_FIELDS`) strip: `crispSessionToken`, `storefrontAccessToken`, `accessToken`, `accessTokenHash`.
- Còn lại **không bị strip** — dựa trên field được ghép ở `storeReducer.js:136-148` (`collectActiveShopData(...)` + `shopInfo`) và `shopController.js:79-84` (`presentShop(shop)` + `totalRevenue`): domain, email, `shopInfo` (chủ shop, currency, timezone, locale...), doanh thu ước tính, trạng thái block/theme, plan info. Đây là PII/business data thật, không phải chỉ 1 boolean.
- So với `homeCardOrderCache.js` — chỉ lưu 1 string `'true'/'false'` (dòng 40), hoàn toàn vô hại nếu rò (chỉ ảnh hưởng thứ tự card hiển thị).

→ `shopCache` đúng là chứa nhiều dữ liệu hơn `homeCardOrderCache` nếu bị đọc nhầm — nhưng như câu 2/3/5 chỉ ra, không tìm được đường code nào thực sự khiến nó bị đọc nhầm giữa 2 shop khác nhau: standalone không bao giờ đọc cache để render (câu 2/3), embedded chỉ ghi cache đúng lúc mount với `?shop=` còn nguyên (câu 5). Rủi ro PII của field này vẫn đáng lưu ý nếu điều kiện "chưa xác minh" ở câu 5 (full-page load đầu tiên thiếu `?shop=`) xảy ra trong thực tế, nhưng đó là giả định runtime, không phải bug đã chứng minh bằng code.

### 5. Embedded mode có an toàn không?

**Cache-invalidation của chính shop đó bị hỏng — thật. Nhưng KHÔNG có đường code nào rò dữ liệu chéo sang shop khác — đã kiểm kỹ, khác với suy đoán ban đầu.**

- `packages/assets/src/history.js:11-43` — `history.push`/`history.replace` chỉ xử lý `pathname` (`to.pathname.replace(basename, '')`, `basename + to`), **không có dòng nào giữ lại `search`/query string** của `to`. Theo hành vi chuẩn của package `history`, `push('/some-path')` thay hoàn toàn location — nếu route link không tự gắn `?shop=...&host=...`, thì SAU navigation đầu tiên trong SPA, `location.search` rỗng.
- Grep toàn bộ 18 file dùng `location.search`/`window.location.search` — **không có nơi nào chủ động re-attach `shop=` vào URL khi điều hướng nội bộ**. Có một pattern tương tự đã biết-là-vấn-đề cho `host` param: `helpers.js:29-40` (`getHost()`) fallback về `localStorage.getItem('avada-dev-host')` — nhưng fallback này CHỈ áp dụng khi `!isProduction` (dev), production strict đọc `location.search` (dòng 31-33). Không có cơ chế tương tự cho `shop`.
- **Sửa mô tả sai ở vòng trước**: `useEmbedPathPrefix.js:14-23` KHÔNG phải "không đụng tới search" — đọc lại code thì dòng 15 lấy cả `search` từ `useLocation()`, và dòng 19 (`history.replace(routePrefix + pathname + search)`) **CÓ forward `search` hiện có** khi tự sửa lại prefix `/embed` bị thiếu (POP/back button). Điều này chỉ có nghĩa: nếu `search` lúc đó ĐÃ mất `shop=` (do `history.js` đã strip từ trước), hook này forward tiếp cái `search` rỗng đó — nó không có cơ chế re-attach lại `shop=` đã mất, nhưng nó cũng không phải nguồn gây mất `search`. Nguồn gây mất search vẫn là `history.js` như mô tả ở trên.
- **Điều tra mới — write path của embedded, KHÔNG được xét ở vòng trước**: grep toàn bộ call site `writeShopCache`/`readShopCache`/`clearShopCache` trong `packages/assets/src` (bỏ qua test) ra đúng những dòng sau:
  - `readShopCache()`: `storeReducer.js:29` (trong `initState`, `useMemo(..., [])` — chỉ chạy 1 lần lúc `StoreProvider` mount, KHÔNG chạy lại khi SPA điều hướng vì component không remount) và `storeReducer.js:95` (fallback `user || readShopCache()?.user` — nằm trong `applyIntegrations`, cũng là 1 phần của mount effect chain, chạy ngay sau mount).
  - `writeShopCache()`: **chỉ 3 chỗ, tất cả đều trong `storeReducer.js`** — dòng 95 (`applyIntegrations`, sau `/shops/integrations` resolve), dòng 102 (standalone ghi ngay khi có `activeShop` prop), dòng 146 (embed tự fetch `/shops` xong thì ghi). Cả 3 đều nằm trong effect `useEffect(..., [])` của `StoreProvider` — tức chạy đúng 1 lần, ngay sau lần mount đầu tiên của app, TRƯỚC KHI merchant có cơ hội bấm bất kỳ link nào.
  - `clearShopCache()`: `storeReducer.js:132/152` (mount effect, khi `/shops` trả rỗng hoặc lỗi — cũng thuộc mount), và **mid-session thật sự**: `App.js:63` (đổi locale), `storeActions.js:82` (`setShop`, mọi mutation), `storeActions.js:108` (logout), `storeActions.js:135` (subscribe/downgrade). **4 chỗ mid-session này ĐỀU LÀ `clearShopCache()` — xoá, không có lệnh `writeShopCache()` nào đi kèm.**
  - → Vì `StoreProvider` chỉ mount 1 lần/phiên (SPA nav không remount root), và toàn bộ `writeShopCache()` chỉ tồn tại trong effect chạy đúng lúc mount đó, **không có đường code nào ghi dữ liệu thật (PII, revenue, shopInfo...) của shop hiện tại vào key `avada:shop:default` sau khi search đã bị SPA nav làm rỗng**. Các lệnh `clearShopCache()` giữa phiên chỉ xoá key `default` (thường rỗng/không liên quan gì) — không "đầu độc" nó bằng dữ liệu thật.
  - Hệ quả đúng của bug này: key THẬT (`avada:shop:<domain>`, ghi lúc mount) không được các mutation giữa phiên invalidate → merchant có thể thấy dữ liệu **cũ tới 48h** ở lần load kế tiếp cho CHÍNH shop của họ — không phải dữ liệu của shop khác.
- Test hiện có (`homeCardOrderCache.test.js:24-32`) chỉ verify "shop khác nhau trong CÙNG 1 lần `window.history.replaceState` → đọc key khác nhau" — tức test giả định `?shop=` luôn có mặt tại thời điểm gọi. Test KHÔNG mô phỏng tình huống SPA nav làm mất `?shop=` giữa lúc ghi và lúc đọc/xoá. → gap này chưa từng được test.
- Điểm còn lại CHƯA xác minh được, KHÔNG phải finding mới (đã có ở vòng trước, giữ nguyên): liệu khi Shopify Admin bounce lại app sau full-page refresh (F5) trong embedded context có LUÔN tự động thêm lại `?shop=&host=...` vào URL hay không. Đây là hành vi chuẩn của embedded app OAuth/session flow theo hiểu biết chung, nhưng **không tự verify được bằng code** trong audit read-only này. Đây là điều kiện DUY NHẤT còn lại có thể tạo ra ghi/đọc chéo thật ở key `default` — nếu chính lần full-page load ĐẦU TIÊN (không phải SPA nav) đã thiếu `?shop=`, vì đó là lúc duy nhất `writeShopCache()`/`readShopCache()` thật sự chạy.

### 6. TTL và versioning

- `shopCache.js:1` — `CACHE_TTL_MS = 48 * 60 * 60 * 1000` (48h). Không tìm được đường code nào ghi dữ liệu chéo vào key `default` (câu 3, câu 5), nên TTL 48h ở đây chủ yếu quyết định thời gian key thật bị "mồ côi" (hệ quả 1 ở "Kết luận ngắn") sống bao lâu trước khi tự hết hạn — không phải thời gian rò dữ liệu chéo, vì rò chéo chưa được xác nhận có tồn tại trong luồng bình thường.
- `homeCardOrderCache.js` — **không có TTL nào cả** (đọc toàn file, chỉ có `localStorage.getItem`/`setItem` trực tiếp, không có timestamp check). Về lý thuyết giá trị này tồn tại vĩnh viễn cho tới khi bị ghi đè hoặc user tự xoá storage — rủi ro thời gian dài hơn `shopCache`, dù nội dung rò (1 boolean) vô hại hơn nhiều.

## Nếu là bug thật — đề xuất fix (KHÔNG implement)

Sắp theo phạm vi ảnh hưởng tăng dần:

1. **Fix hẹp nhất — không đổi cache key scheme, chỉ ổn định `?shop=` xuyên suốt phiên.** Thêm 1 chỗ duy nhất (kiểu `getHost()` đã làm cho `host`) lưu `shop` domain vào 1 biến module-level hoặc `sessionStorage` NGAY lúc mount (khi `?shop=` chắc chắn còn), rồi cho `getCacheKey()` của cả 2 file đọc từ nguồn ổn định đó thay vì đọc trực tiếp `location.search` mỗi lần gọi. Rủi ro: thấp — không đổi format key hiện có, không làm mất cache đang có của merchant (`avada:shop:<domain>` giữ nguyên tên, chỉ đổi NGUỒN lấy `<domain>`). Ảnh hưởng: sửa đúng gốc của cả 3 hệ quả ở "Kết luận ngắn". Cần audit thêm: `window.activeShop` đã có sẵn domain thật sau khi `/shops` resolve lần đầu — có thể tái dùng thay vì thêm state mới, giảm diện thay đổi.

2. **Fix rộng hơn — đổi cache key sang định danh ổn định khác** (vd: `shop.shopifyDomain` lấy từ `window.activeShop`/store state thay vì URL). Rủi ro: TẤT CẢ merchant đang có `avada:shop:<currentValueDeriveFromURL>` sẽ cache-miss 1 lần (không phải mất dữ liệu server, chỉ mất lợi ích CLS-prevention 1 lần) — chấp nhận được vì đây đúng là cơ chế "cache tăng tốc UX", nguồn sự thật vẫn là `/shops`. Cách này giải quyết triệt để, không phụ thuộc SPA router có giữ query hay không.

3. **Không nên làm**: đổi hẳn key về không phân biệt gì (bỏ scoping) — sẽ tái tạo đúng lỗi rò rỉ cho MỌI shop, kể cả trường hợp browser không share. Cũng không nên chỉ đơn giản bỏ `|| 'default'` (throw thay vì fallback) — sẽ làm cache toàn bộ ngừng hoạt động (mất luôn phần CLS-fix mà 2 commit `50e4b2fb0`/tương đương vừa build), cần path khác để lấy domain trước khi bỏ fallback.

Lưu ý chung cho mọi phương án: `shopCache` được dùng toàn app (`App.js`, `storeActions.js`, `storeReducer.js` — nhiều call site), đổi key scheme nghĩa là **mọi merchant hiện có sẽ mất cache đang lưu** (không mất dữ liệu, chỉ về lại trạng thái network-first 1 lần) — nên cân nhắc rollout, không phải rủi ro chặn deploy nhưng cần biết trước khi quyết.

## Chưa xác minh

- **Runtime thật — quan trọng nhất còn lại**: có chạy app để xem DevTools Network/URL bar xác nhận Shopify Admin có luôn tự thêm lại `?shop=&host=` khi bounce-back sau full reload embedded hay không. Đây là giả định dựa trên hiểu biết chung về Shopify embedded app OAuth flow, KHÔNG tự verify bằng code trong audit này (không có route/middleware nào trong `packages/assets/src` xử lý việc này phía client — nó phụ thuộc hành vi phía Shopify Admin/App Bridge, ngoài phạm vi source code đọc được). Điểm này giờ quan trọng hơn cả 2 vòng audit trước nghĩ: đã xác nhận (câu 5) rằng `writeShopCache()`/`readShopCache()` CHỈ chạy đúng 1 lần, ở lần full-page mount đầu tiên của phiên — nên đây là điều kiện DUY NHẤT còn treo lại có thể tạo ra rò dữ liệu chéo thật giữa 2 shop share cùng browser. Nếu runtime xác nhận Shopify LUÔN giữ `?shop=` ở mọi lần mount thật (kể cả bounce) → kết luận cuối cùng là KHÔNG có rò chéo nào, chỉ có cache-invalidation hỏng. Nếu không → cần điều tra tiếp ở đúng đường này (full-page mount thiếu `shop=`), không phải ở SPA nav như 2 vòng trước đã đi nhầm.
- **`isCrmLogin` có cho phép xem nhiều shop trong 1 phiên hay không** — chỉ thấy 1 chỗ dùng field này (`App.js:38`), không đủ để kết luận cơ chế đầy đủ; không mở rộng điều tra vì ngoài phạm vi 2 file cache.
- **Có bao nhiêu % traffic là standalone** — không có dữ liệu (BigQuery/analytics) được truy vấn trong audit này (đúng theo giới hạn "không đụng dữ liệu thật").
- **Có thật agency/CRM dùng chung 1 browser cho nhiều shop trong thực tế** — chỉ suy luận hợp lý từ sự tồn tại của `isCrmLogin`, chưa có bằng chứng cụ thể (log, support ticket) được kiểm.
- Chưa grep hết `packages/scripttag` và `extensions/customer-account-ui` — brief chỉ nhắc `packages/assets`, 2 hệ thống kia dùng cơ chế i18n/cache khác (`useStorefrontI18n`), không có cùng pattern `shopCache`, nhưng tôi không grep xác nhận 100% không có bản sao nào ở đó.

## Xác nhận không đụng file

Không có lệnh `Edit`/`Write` nào chạy trên bất kỳ file trong `/Users/dantt1002/projects/subscriptions`. Không chạy git write command nào (chỉ `git log`, `git show`). File duy nhất được tạo là báo cáo này, nằm ngoài repo `subscriptions`, trong `my-brain`.
