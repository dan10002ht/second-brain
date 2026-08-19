# CLS audit — Joy Subscription EMBEDDED ADMIN APP (BFS) — 2026-08-19

Scope: `packages/assets/` (embedded admin, React 18 + Polaris 12 + App Bridge). KHÔNG phải storefront/theme-app-extension. Không sửa code, không git write. Repo state: branch `master`, no local mutation made.

## Kết luận ngắn

Nguyên nhân chính có độ tin cậy cao nhất (mức: **VỪA-CAO**, có điều kiện — xem chi tiết mục 1 dưới): commit `448653907` (2026-08-13, tác giả Tuan Dang, **6 ngày trước "hôm nay"**) thêm logic `metricsFirst` vào `Home.js` — trang landing sau khi mở app, khả năng traffic cao nhất. Logic này **đổi thứ tự toàn bộ 4 card lớn** (ReportSummary / setup-guide / WidgetShowcase / AppExtensions) sau khi 2 API call (`subscriptionActiveCount`, `shops/integrations`) trả về, thay vì chỉ ẩn/hiện — loại shift nặng nhất theo định nghĩa CLS (nhiều block cao đổi vị trí trong viewport). Nhưng đây **không** xảy ra với mọi shop có subscription: nó chắc chắn flip ở nhóm shop cache-miss (mở lần đầu / cache quá 48h / localStorage bị chặn), và ở nhóm cache-hit thì chỉ flip khi setup guide **chưa hoàn thành** (`allSetupTasksDone` vẫn `false`) — nhóm cache-hit đã hoàn thành setup (thường là merchant mở app đều đặn nhất) **không flip ở phần này**, vì `metricsFirst` đã `true` sẵn từ render đầu. Thời điểm commit trùng khớp với "gần đây" mà user nêu.

Bối cảnh quan trọng: đã có một đợt fix CLS lớn, có chủ đích, trước đó (2026-08-03 → 2026-08-05) — sửa boot screen, home cards, crisp widget, 4 trang list (Subscriptions/Plans/Subscribers/SubscriptionProducts). **Đợt đó thật ra có 2 hướng kế tiếp nhau trên cùng 4 trang list, không phải 1 hướng liền mạch:**
- Hướng 1, commit `24605a2b0` (2026-08-03, "perf - fe - reserve list table height while the first page loads") — reserve trước chiều cao 1 trang bảng, đo được **CLS 0.0432 → 0.0065** (số ghi trong commit message của chính hướng này).
- Hướng 1 **bị revert 2 ngày sau** bởi `fd214c920` (2026-08-05, "revert - fe - drop list table height reservation") — đã tự xác minh `fd214c920` nằm trong lịch sử `HEAD` hiện tại (`git merge-base --is-ancestor` → true), tức bản reserve-height **không còn sống trong code** dù số đo 0.0432→0.0065 vẫn là số thật của chính đợt đó.
- Ngay sau đó cùng ngày, `8408dfcb8` + `b48349ee1` (2026-08-05, cách nhau 30 phút với `fd214c920`) thêm hướng thay thế: `hasFetched`/`fullWidth` (narrow-then-full-width) — **đây mới là cách đang sống trong code hôm nay**, không phải cách reserve-height sinh ra số 0.0432→0.0065.

Vậy con số `0.0432 → 0.0065` là bằng chứng thật nhưng thuộc về một cách tiếp cận **đã bị revert**, không phải bằng chứng cho cách `hasFetched`/`fullWidth` đang áp dụng ở 4 trang list hiện tại (số CLS thật của cách `hasFetched`/`fullWidth` chưa được đo lại trong audit này).

Đợt fix 08-03→08-05 dừng ở 4 trang, và **8 ngày sau khi đợt fix đó xong, một commit khác lại thêm một bug CLS mới, nặng hơn, trên đúng trang Home** mà đợt fix trước không đụng tới. Đồng thời 4 tab trong trang Orders vẫn mang y hệt pattern mà đợt fix 08-05 đã sửa ở 4 trang kia — chưa được áp dụng.

## Số đo thật (BigQuery `webVitals`, prod, tự chạy 2 lần xác nhận khớp)

Lệnh: `cd packages/functions && DAYS=7 ENV=prod node src/commands/misc/queryWebVitalsCls.js` — read-only (`.get()`/`.count().get()`), user đã duyệt. Đo ngày 2026-08-19, cửa sổ 7 ngày, `total in window=1565` (dưới `LIMIT=5000` của script → **không bị cắt** ở `DAYS=7`; xem cảnh báo sampling bias cuối mục này trước khi dùng `DAYS=30`).

- **CLS n=1529, p50=0.027, p75=0.129, p90=0.236, p95=0.325, max=2.801**
- Phân bố rating: `good=1072 (70%), needs-improvement=315 (21%), poor=142 (9%), undefined=36`
- Trigger: `timer=1197, hidden=368`

**p75 = 0.129 > ngưỡng BFS 0.1** — app hiện KHÔNG đạt mandatory 2.1.2 nếu đo đúng 28 ngày prod với phân bố tương tự.

Theo path (n, p75, p95) — chỉ liệt path có n đáng kể:

| path | n | p75 | p95 |
|---|---|---|---|
| `/embed/` | 964 | 0.164 | 0.385 |
| `/embed/subscriptions-history` | 61 | 0.1 | 0.136 |
| `/embed/volume-bundle/create` | 60 | 0.012 | 0.046 |
| `/embed/settings` | 37 | 0.017 | 0.055 |
| `/embed/dev_zone` | 17 | 0.013 | 0.304 |
| `/embed/plans` | 16 | 0.081 | 0.103 |
| `/embed/order` | 13 | 0.099 | 0.174 |
| `/embed/subscription-products` | 12 | 0.08 | 0.149 |
| `/embed/plans/create` | 11 | 0.02 | 0.179 |
| `/embed/customer-portal` | 7 | 0.478 | 0.635 |

**`/embed/` (Home) chiếm 964/1529 mẫu CLS = 63% tổng traffic đo được**, và p75 riêng của nó (0.164) cao hơn hẳn ngưỡng — đúng với giả định "Home là trang traffic cao nhất" nêu ở mục Kết luận ngắn, giờ có số thật xác nhận. Vì p75 tổng (0.129) chủ yếu do khối 63% mẫu này kéo lên, **fix riêng Home gần như đủ để đưa p75 tổng xuống dưới hoặc sát ngưỡng 0.1** — các path còn lại phần lớn đã dưới hoặc quanh 0.1 (trừ `/embed/customer-portal` n=7 quá nhỏ để tin).

Top `clsTarget` (n, avg, p75) — phần tử gây shift nhiều nhất:

| clsTarget | n | avg | p75 |
|---|---|---|---|
| `div.Polaris-Page>...>div.Polaris-ShadowBevel` | 176 | 0.172 | 0.236 |
| `...ShadowBevel>div.Polaris-Box>div.Polaris-Box` | 155 | 0.077 | 0.122 |
| `html.p-theme-light>body>::after` | 68 | 0.164 | 0.155 |
| (no target) | 70 | 0.146 | 0.221 |
| `#AppFrameMain>...>div.Avada-Frame>div.Polaris-Page` | 37 | 0.234 | 0.231 |
| `#AppFrameMain>...>div.Avada-Frame` | 41 | 0.205 | 0.205 |
| `#AppFrameMain` | 28 | 0.249 | 0.363 |
| `#PreLoading>img.PreLoading-Logo` | 255 | 0.012 | 0.017 |

**Cảnh báo sampling bias (đọc từ chính comment trong script, dòng ~30):** script chỉ có index tăng dần trên `createdAt` nên walk xuôi và cap ở `LIMIT=5000` → lấy mẫu ở **ĐẦU** cửa sổ thời gian, không phải mẫu ngẫu nhiên đều trong 7 ngày. Ở `DAYS=7` lần này `total=1565 < LIMIT=5000` nên không bị cắt — số trên đáng tin cho cửa sổ 7 ngày. Nếu chạy `DAYS=28` (đúng chuẩn BFS) hoặc `DAYS=30` mà `total > 5000`, số sẽ lệch về phía các mẫu cũ hơn trong cửa sổ — cần lưu ý khi so sánh.

## Yêu cầu BFS — trích nguyên văn

Nguồn: `shopify-dev-mcp` → `search_docs_chunks` (api: app-store-review), trang `https://shopify.dev/docs/apps/launch/built-for-shopify/requirements` và `https://shopify.dev/docs/apps/build/performance/admin-installation-oauth`.

> "2.1 Admin performance — Shopify uses Web Vitals to determine the performance of your app in the Shopify admin. To enable Shopify to gather Web Vitals metrics, your app needs to use the latest version of App Bridge. ... When your app loads in the Shopify admin, it needs to meet Web Vitals targets for the following metrics, **at the 75th percentile of page loads**: ... **2.1.2 Minimize Cumulative Layout Shift (CLS)** Your app's Cumulative Layout Shift (CLS) is **0.1 or less**. Your app needs to have a **minimum of 100 calls for CLS over the last 28 days** to be assessed."

> "Cumulative Layout Shift Cumulative Layout Shift (CLS) measures your app's visual stability. ... **Mandatory: 75% of the time, your app should have a Cumulative Layout Shift of 0.1 or less, measured over a 28 day period.**"

Đo bằng gì: Shopify tự thu thập Web Vitals qua **App Bridge** khi app load trong Shopify admin ("Shopify's Web Vitals package measures your app's performance each time a merchant launches your app through any route" — chạy trong runtime riêng tách khỏi app, để chuẩn hoá số đo qua các iframe). App cần dùng bản App Bridge mới nhất để được đo. Số 0.1 threshold và percentile 75% là nguyên văn từ doc. **App tự thu thập song song 1 bản telemetry riêng vào collection `webVitals`** (không phải số Shopify dùng để đánh giá BFS chính thức, nhưng cùng cơ chế Layout Instability API nên đáng tin làm proxy) — xem mục "Số đo thật" ngay trên đây, đã chạy thật và có số.

## Nguyên nhân đã xác minh

### 1. Home.js — `metricsFirst` đảo toàn bộ thứ tự card sau khi data async về (MỨC ĐỘ: CAO)

- File: `packages/assets/src/pages/Home/Home.js:64-76` và `:128-142` (tự đọc bằng Read tool, số dòng khớp file hiện tại trên `master`).
- Đoạn code (đọc thật từ file, không chép từ agent khác):

```js
// line 64
const {data: contractCountData} = useFetchApi({
  url: '/subscription-contract/subscriptionActiveCount',
  defaultData: {totalSubscriptionActive: 0}
});
const hasContract = (contractCountData?.totalSubscriptionActive || 0) > 0;
...
const allSetupTasksDone = useMemo(
  () => isWidgetStatusKnown && Object.values(isCompleteGuide(shop, () => {})).every(Boolean),
  [shop, isWidgetStatusKnown]
);
const metricsFirst = hasContract || allSetupTasksDone;
```

```js
// line 128
{metricsFirst ? (
  <>
    <ReportSummary />
    {setupGuideBlock}
    <WidgetShowcase />
    <AppExtensions />
  </>
) : (
  <>
    {setupGuideBlock}
    <AppExtensions />
    <ReportSummary />
    <WidgetShowcase />
  </>
)}
```

- Cơ chế gây shift: `useFetchApi` mặc định `initLoad: true` nên `loading` bắt đầu `true`, nhưng `contractCountData` khởi tạo bằng `defaultData` (`totalSubscriptionActive: 0`) → `hasContract` = `false` ở lần render đầu tiên **luôn luôn**, bất kể shop có subscription hay không, bất kể cache gì.
  `isWidgetStatusKnown` (`Home.js:42`, `typeof shop?.blockWidgetStatus === 'boolean'`) phụ thuộc `state.shop` từ `StoreProvider`. Vòng verify này **đã sửa lại kết luận về cache-hit của bản trước** — bản trước cho rằng cache-hit thì `isWidgetStatusKnown` giữ `true` suốt vòng đời render. Đọc lại toàn bộ `packages/assets/src/reducers/storeReducer.js` cho thấy điều đó **sai**:
  - **`useMemo` init (`storeReducer.js:21-38`)** chỉ quyết định state ở **lần render đầu tiên**: cache-hit → `state = {shop: cached.shop, loading: false}` ngay lập tức (đúng như bản trước mô tả) → `isWidgetStatusKnown = true` từ đầu **nếu** `cached.shop.blockWidgetStatus` đã có.
  - Nhưng **`useEffect` ở dòng 43-166 chạy KHÔNG ĐIỀU KIỆN** trên mọi lần mount của `StoreProvider`, kể cả cache-hit — nhánh embed (không có prop `activeShop`) luôn gọi `/shops` rồi `/shops/integrations` lại từ đầu (dòng 110-161), bất kể `initState` lấy từ cache hay network. Cache chỉ tránh màn hình "chưa biết" ở paint đầu tiên, **không** tắt việc refetch.
  - **`SET_SHOP` là full-replace, không phải merge** — tự đọc `packages/assets/src/actions/storeActions.js:29-30`: `case storeTypes.SET_SHOP: return {...state, shop: payload};`. Ở `shops:fetch-end` (`storeReducer.js:148`), `payload` là `shopWithInfo` dựng từ `collectActiveShopData({shop, ...})` (`packages/assets/src/services/shopService.js:7-31`) — hàm này spread `...shop` (field `shop` lấy từ response `/shops`) và KHÔNG có field `blockWidgetStatus` ở đâu trong return object.
  - Backend xác nhận field đó chỉ tồn tại ở `/shops/integrations`: `packages/functions/src/controllers/shopController.js:147` (`blockWidgetStatus: blocksStatus?.blocks?.subscription`) nằm trong `getShopIntegrations` (dòng 108-165). Hàm `getUserShops` (`/shops`, dòng 60-93) **không** trả field này — chính docblock của nó (dòng 40-59) ghi rõ: *"Anything derived from a live Shopify call is simply absent here — see `getShopIntegrations` for the contract the client must treat as 'not known yet'"*.
  - Vậy trình tự thật trên **CẢ 2 nhóm shop, kể cả cache-hit đã có `blockWidgetStatus` từ trước**:
    1. Render 1 (t=0): `isWidgetStatusKnown` = `true` nếu cache-hit có sẵn field, `false` nếu cache-miss.
    2. Tại `shops:fetch-end` (~1-2s theo mẫu thật, xem bảng dưới): `SET_SHOP` **ghi đè toàn bộ `state.shop`** bằng `fetchedShop` không có `blockWidgetStatus` → `isWidgetStatusKnown` **luôn flip về `false`** tại đây — kể cả cache-hit đang là `true`.
    3. Tại `integrations:fetch-end` (~1s sau đó): `MERGE_SHOP` (`storeReducer.js:90`, merge không replace — đúng bản trước mô tả) thêm lại `blockWidgetStatus` → `isWidgetStatusKnown` flip về `true`.
  - Kết quả: **cache-hit không hề miễn nhiễm** — nó chỉ khác cache-miss ở chỗ có thêm 1 cú flip `true → false` ngay tại render 1 → `shops:fetch-end` mà cache-miss không có (vì cache-miss vốn đã `false` từ đầu). Nếu lúc `shops:fetch-end` mà `allSetupTasksDone` đang dựa trên `isWidgetStatusKnown=true` (từ cache) khiến `metricsFirst=true`, và `hasContract` lúc đó vẫn `false` (contract count chưa fetch xong) → `metricsFirst` flip `true → false` NGAY TẠI `shops:fetch-end`, rồi flip lại `false → true` tại `integrations:fetch-end` nếu `allSetupTasksDone` quay lại `true` — tức **2 cú reorder liên tiếp trên cùng 1 lần load**, nặng hơn cache-miss (vốn thường chỉ 1 cú, trừ phi cũng rơi đúng khung thời gian tương tự). Bằng chứng thật KHÔNG khớp mạnh với cơ chế này như từng khẳng định ở bản trước — đã tự chạy lại `queryWebVitalsCls.js` (fresh, `DAYS=7 ENV=prod`) và tự tính lại chênh lệch `clsLargestAtMs - integrations:fetch-end` cho toàn bộ "worst 8 samples": trong **6/8 mẫu có `shopSource: cache`** (`clsValue` 0.72–2.801), chỉ **2/6 mẫu** rơi sát mốc `integrations:fetch-end` (chênh 485ms và 41ms); **4/6 mẫu còn lại lệch 4-25 giây** (4039ms, 5042ms, 13890ms, 25320ms) — không hề "sát mốc". Cộng thêm 1 mẫu `shopSource: network` chênh 87ms cũng khớp gần, và 1 mẫu `network` khác (`clsValue=0.72`) shift xảy ra TRƯỚC cả `shops:fetch-end`, không liên quan `integrations:fetch-end`. Tổng cộng chỉ **~3/8 mẫu** có timing khớp rõ với dự đoán "flip tại `integrations:fetch-end`" — đây là **tương quan yếu**, không đủ làm bằng chứng định lượng độc lập cho cơ chế `SET_SHOP`/`MERGE_SHOP`. 4 mẫu lệch xa được liệt kê ở mục "Nghi ngờ nhưng CHƯA xác minh được" — nguyên nhân của chúng chưa xác định.
- Trang bị ảnh hưởng: **Home** (`/embed/`) — đã có số thật: 964/1529 mẫu CLS (63%), p75=0.164, cao nhất trong mọi path đo được (xem mục "Số đo thật").
- Above/below-fold (suy luận theo vị trí DOM, CHƯA đo trên viewport thật): `setupGuideBlock` và phần đầu `ReportSummary`/`AppExtensions` nằm ngay dưới các banner đầu trang (`GrowSubscriptionsCard`, `BannerNewVersion`, `ActiveBanner`, `LimitReachBanner`) nên nhiều khả năng nằm trong viewport ban đầu ở màn hình admin phổ biến → đóng góp CLS thật. Số thật củng cố suy luận này: `clsTarget` phổ biến nhất trong toàn bộ tập dữ liệu (`n=176`, `total=30.32`) là `div.Polaris-Page>...>div.Polaris-ShadowBevel` — chính là wrapper `Card` (Polaris v12 bọc mọi `Card` trong `ShadowBevel`), đúng loại phần tử `ReportSummary`/`WidgetShowcase`/`AppExtensions`/setup-guide dùng.
- Mức độ: **NÂNG LẠI TỪ VỪA-CAO LÊN CAO**, nhưng dựa trên lập luận code + traffic share, KHÔNG dựa vào timing của 8 mẫu (xem sửa ở trên — timing chỉ là tương quan yếu). Lý do đảo ngược lập luận hạ mức của bản trước: bản trước giả định cache-hit "đã biết `blockWidgetStatus` từ render đầu → không flip", nhưng thực tế `SET_SHOP` full-replace tại `shops:fetch-end` xoá field đó khỏi state bất kể nguồn gốc render đầu là gì — **mọi lần load, cache-hit hay cache-miss, đều đi qua giai đoạn `isWidgetStatusKnown=false` tạm thời** giữa `shops:fetch-end` và `integrations:fetch-end`. Cache-hit + setup đã xong không "miễn nhiễm" như bản trước nói — nó chỉ tránh được màn hình rỗng ban đầu, không tránh được cú flip giữa chừng. Căn cứ giữ mức CAO: (a) chuỗi lập luận code đã verify đúng hoàn toàn — `SET_SHOP` full-replace (`storeActions.js:29-30`), `useEffect` fetch vô điều kiện kể cả cache-hit, `collectActiveShopData` thiếu `blockWidgetStatus`, và theo mẫu thật 2 dispatch `shops:fetch-end`/`integrations:fetch-end` cách nhau ~900-1900ms — đủ để browser paint 1 frame trung gian và ghi nhận layout shift ở đó; (b) traffic share: `/embed/` (Home) chiếm 63% tổng traffic đo được, p75 riêng (0.164-0.165) cao hơn hẳn ngưỡng 0.1. **KHÔNG** dùng tuyên bố "6/8 mẫu cache khớp sát mốc `integrations:fetch-end`" làm căn cứ mức độ — tự tính lại cho thấy chỉ ~3/8 mẫu (2 cache + 1 network) khớp thật sự, còn 4 mẫu cache khác lệch 4-25 giây; đây là tương quan yếu, không phải bằng chứng định lượng mạnh.
- Mới thêm 6 ngày trước "hôm nay" (2026-08-13, commit `448653907`), khớp thời điểm "gần đây" user nêu; diff xác nhận code TRƯỚC đó không hề reorder — chỉ show/hide `BusinessGuide` theo `isWidgetStatusKnown`.
- Xác minh nguồn gốc: `git log -S"metricsFirst" --oneline -- packages/assets/src/pages/Home/Home.js` → chỉ 1 commit `448653907`. `git show -s --format='%h %ad %an %s' --date=short 448653907` → `448653907 2026-08-13 Tuan Dang fix - fe - onboarding v5 boot tips, preview scroll & dashboard card order`. Đọc full diff bằng `git show 448653907 -- packages/assets/src/pages/Home/Home.js` xác nhận đây chính là commit thêm đoạn code trên.

### 2. 4 tab trong Orders page — filter bar (IndexFilters) và pagination xuất hiện/biến mất theo `loading` chưa được sửa (MỨC ĐỘ: VỪA)

- Files (tự đọc bằng Grep + Read, số dòng khớp file hiện tại):
  - `packages/assets/src/pages/Orders/Tabs/TableSuccessOrder.js:80` (`initLoad: false`), `:289` (`const isEmptyOffer = dataOrders.length === 0 && !loading;`), `:290-291` (`isEmptyState`), `:438` (`{!isEmptyState && (` bọc `<IndexFilters .../>`), `:518` (`{!isEmptyOffer && (` bọc block pagination).
  - `packages/assets/src/pages/Orders/Tabs/TableFailureOrder.js:78` (`initLoad: false`), `:443` (`isEmptyOrder`), `:444` (`isEmptyState`), `:448` (`{!isEmptyState && (`).
  - `packages/assets/src/pages/Orders/Tabs/TableUpcomingOrder.js:78` (`initLoad: false`), `:322` (`isEmptyOrder`), `:323` (`isEmptyState`), `:449` (`{!isEmptyState && (`).
  - `packages/assets/src/pages/Orders/Tabs/TableSkipOrder.js:77` (`initLoad: false`), `:292` (`isEmptyOffer`), `:293` (`isEmptyState`), `:409` (`{!isEmptyState && (`).
- Cơ chế gây shift: cả 4 file gọi `useFetchGrid({..., initLoad: false})`. Vì `useFetchApi` khởi tạo `loading = useState(initLoad)`, `loading` bắt đầu **`false`** — khác hẳn các trang đã fix (Subscriptions/Plans/Subscribers/SubscriptionProducts, xem mục "Đã loại trừ") vốn cũng dùng `initLoad: false` nhưng có thêm biến `hasFetched` để phân biệt "chưa fetch" và "fetch xong nhưng rỗng". 4 file Orders **không có `hasFetched`** — `isEmptyState`/`isEmptyOffer`/`isEmptyOrder` chỉ dựa `dataOrders.length === 0 && !loading`, nên ở lần render đầu tiên (trước khi fetch chạy) điều kiện này **đúng** (length=0, loading=false) → `IndexFilters` (thanh search/sort/tab, ước lượng ~50-60px) bị ẩn ở đầu Card, và block pagination ở cuối Card cũng bị ẩn. Khi data load xong, `loading` chuyển `true` rồi `false`, `dataOrders.length` đổi — `IndexFilters` xuất hiện phía trên bảng, đẩy toàn bộ bảng xuống; pagination xuất hiện phía dưới đẩy nội dung sau nó.
- Trang bị ảnh hưởng: Orders (4 tab: Success/Failure/Upcoming/Skip order). Đây không phải trang landing nhưng là 1 trong các trang chính (nav menu), vẫn đóng góp vào p75 tổng của app nếu merchant hay xem lịch sử đơn.
- Above/below-fold (suy luận theo vị trí DOM, CHƯA đo trên viewport thật): `IndexFilters` (thanh search/sort/tab) nằm ngay đầu Card, ngay dưới page header/tab switcher của Orders — nhiều khả năng nằm trong viewport ban đầu ở hầu hết màn hình admin → đóng góp CLS thật khi nó xuất hiện và đẩy bảng xuống. Block pagination thì nằm ở CUỐI Card, sau toàn bộ bảng dữ liệu — với bảng có nhiều dòng hoặc màn hình admin thấp, khối này nhiều khả năng đã NGOÀI viewport ban đầu → xuất hiện/biến mất của riêng nó không đóng góp CLS (không có gì bên dưới nó trong viewport để bị đẩy). Vậy trong 2 phần tử report gộp chung ("IndexFilters + pagination"), phần đóng góp CLS đáng tin hơn là IndexFilters; phần pagination cần xem cụ thể số dòng bảng mặc định (đủ dài để đẩy pagination xuống dưới fold hay không) mới kết luận được — chưa đo.
- Mức độ: **VỪA**. Lý do: root cause đúng là loại bug mà đợt fix 08-05 đã xử lý ở 4 trang khác (list narrow/empty flash) nhưng KHÔNG lan sang Orders — tần suất mở Orders có thể thấp hơn Home/Subscriptions/Subscribers nên đóng góp vào p75 tổng thấp hơn phát hiện #1, nhưng đây là 4 file cùng lỗi, không phải 1 lần lẻ. Phần đóng góp CLS thật có thể thấp hơn mức "VỪA" nếu pagination thường ở ngoài viewport ban đầu (xem above/below-fold) — IndexFilters là phần chắc chắn hơn.
- Xác minh: `git log -S"hasFetched" --oneline -- packages/assets/src/pages/Orders` không trả kết quả nào (lệnh chạy, output rỗng) — xác nhận pattern `hasFetched` chưa từng được áp dụng vào thư mục Orders.

## Nghi ngờ nhưng CHƯA xác minh được

- **Vì sao hướng "reserve list table height" (`24605a2b0`) bị revert** — KHÔNG còn là câu hỏi mở: đã tự đọc `git show --stat fd214c920`, lý do nằm ngay trong message của chính commit revert: reserve trước 1 trang chiều cao khiến shop có list **rỗng hoặc ngắn** render ra 1 khối trống cao ("No subscriptions found" bên trong) rồi mới collapse — bị report là regression thấy được từ production, và "CLS win (0.0432 → 0.0065) is not worth that". Ràng buộc quan trọng cho mọi fix CLS sắp tới (đặc biệt đề xuất #1 ở `Home.js`, vốn cũng cân nhắc kiểu "chờ/giữ chỗ trước khi biết chắc"): **không nên tái tạo lại cách "reserve chiều cao cố định trước khi biết dữ liệu"** — team đã thử và revert vì gây regression khác (khối trống to trên shop ít dữ liệu), thay vào đó hướng đang sống là "chỉ đổi hiển thị/ẩn tại cùng vị trí, không đoán trước kích thước" (`hasFetched`/`fullWidth`). Đề xuất #1 trong báo cáo này đã đúng hướng đó, không dính hướng bị revert.
- ~~Tỉ lệ cache-hit thật của `shop` cache~~ — **đã hết cần thiết**: verify vòng này đọc lại toàn bộ `StoreProvider` và xác nhận cache-hit KHÔNG miễn nhiễm với cú flip (xem phát hiện #1 đã nâng lên CAO). Biến còn lại đáng đo (chưa đo): tỉ lệ shop rơi đúng vào khung "`allSetupTasksDone` đang dựa cache=true nhưng `hasContract` chưa kịp trả lời" tại thời điểm `shops:fetch-end` — đây mới là điều kiện quyết định có 1 hay 2 cú reorder trên mỗi lần load, nhưng dù chỉ 1 cú thì flip vẫn xảy ra ở `integrations:fetch-end` trên mọi shop (không riêng gì nhánh này), nên không còn ảnh hưởng đến việc xếp mức độ tổng thể.
- `packages/assets/src/components/molecules/LimitReachBanner/LimitReachBanner.js` (đọc toàn bộ file): banner này show/hide dựa trên `limitPlanCal(shop)` với `shop = {...activeShop, ...subscription?.shop}`. Đã xác minh bằng `packages/assets/src/reducers/storeReducer.js:169` (`if (state.shop) getSubscription(handleDispatch).then();`) rằng `state.subscription` được fetch **sau** khi `state.shop` đã có, tức là async, sau lần render đầu của Home. Nếu field doanh thu dùng trong `limitPlanCal` chỉ có trên `subscription.shop` chứ không có trên `activeShop` ban đầu, banner này có thể bật lên SAU khi Home đã paint, đẩy `ReportSummary`/setup-guide xuống — cộng dồn với phát hiện #1. **Thiếu để kết luận**: chưa so sánh field trả về thực tế giữa `/shops` (nạp `activeShop`) và `/subscription` (nạp `subscription.shop`) để biết field revenue có mặt ở request nào.
- `WidgetInlineBannerV2`, `WidgetWhatNews` từ package ngoài `@avada/app-widget-hook` (dùng ở `Home.js:102-109,119`) — không đọc được source (nằm ngoài repo này, trong `node_modules`), không thể verify cơ chế loading/kích thước. Không loại trừ, không xác nhận.
- `1489b085a` (2026-08-14, Tuan Dang, "revert the Overview card wrap on the dashboard metrics") sửa `ReportSummary.js` — đã đọc diff, đây là revert 1 lần đổi cấu trúc card "Overview" trong `ReportSummary`, nhưng chưa đọc kỹ state hiện tại của `ReportSummary.js` để biết bản thân component này có tự gây CLS nội bộ hay không (vd. skeleton height khác thật). Chưa xác minh.
- ~~Script BigQuery có sẵn để lấy số CLS thật~~ — **đã chạy**: `packages/functions/src/commands/misc/queryWebVitalsCls.js` (`DAYS=7 ENV=prod`, read-only, user đã duyệt) — xem mục "Số đo thật" đầu file.
- **4 mẫu cache lệch xa mốc `integrations:fetch-end` (4-25 giây) — nguyên nhân KHÁC, chưa biết là gì.** Tự chạy lại `queryWebVitalsCls.js` (fresh) và tự tính `clsLargestAtMs - integrations:fetch-end` cho toàn bộ "worst 8 samples": 4/6 mẫu `shopSource: cache` không khớp cơ chế "flip tại `integrations:fetch-end`" nêu ở phát hiện #1:

  | clsValue | path | clsLargestAtMs | integrations:fetch-end | chênh lệch |
  |---|---|---|---|---|
  | 1.077 | `/embed/subscriptions-history` | 7886 | 2844 | 5042ms |
  | 0.822 | `/embed/translations/de` | 16276 | 2386 | 13890ms |
  | 0.723 | `/embed/` | 27954 | 2634 | 25320ms |
  | 0.721 | `/embed/` | 7109 | 3070 | 4039ms |

  Shift ở mốc ~28 giây (mẫu `clsValue=0.723`) gần như chắc chắn KHÔNG phải cơ chế boot (`shops`/`integrations` fetch chỉ diễn ra trong ~2-3s đầu) — ở mốc này trang gần như chắc chắn đã qua giai đoạn boot, có thể merchant đã cuộn trang hoặc tương tác. Nguyên nhân khả dĩ, CHƯA xác minh: nội dung load muộn (banner ngoài repo — `WidgetInlineBannerV2`/`WidgetWhatNews`, xem mục ngay dưới), lazy image, hoặc chính hành vi cuộn/click của người dùng gây shift được `web-vitals` gộp vào cùng 1 `clsValue` của phiên đó (CLS là tổng luỹ kế trong session, không chỉ giai đoạn boot). **Đây là hướng điều tra còn bỏ ngỏ, chưa có kết luận** — không nên dùng làm bằng chứng cho phát hiện #1.

### Phát hiện mới từ số đo thật — phần tử co về `0x0` (bị gỡ khỏi DOM, không chỉ đổi thứ tự)

- Trong "worst 8 samples" (đã tự chạy, đọc trực tiếp field `clsShiftRects`), 2/8 mẫu cho thấy hình dạng shift khác hẳn "đổi vị trí": `"30,138 1063x467 -> 0,0 0x0"` (mẫu `clsValue=1.137`, path `/embed/`, `clsTarget=ShadowBevel`) và `"0,94 352x691 -> 0,0 0x0"` (mẫu `clsValue=0.908`, path `/embed/`, cùng `clsTarget`). Cú pháp `rectBefore -> rectAfter` với `rectAfter = 0x0` nghĩa là phần tử **biến mất hoàn toàn khỏi layout** (unmount hoặc collapse về 0 kích thước), không phải dịch chuyển sang vị trí khác.
- Đánh giá: đây **không phải nguyên nhân mới**, mà là dấu vết cụ thể của đúng cơ chế đã nêu ở phát hiện #1 — khi `metricsFirst` đổi, JSX ternary ở `Home.js:128-142` chuyển hẳn sang nhánh khác (không có `key` ổn định giữa 2 nhánh), nên React **unmount toàn bộ cây cũ rồi mount cây mới** thay vì di chuyển node hiện có. Trình duyệt ghi nhận node cũ co về `0,0 0x0` (bị gỡ) đồng thời với node mới xuất hiện ở vị trí khác — đúng cùng lúc với target `ShadowBevel` (wrapper `Card` của `ReportSummary`/`WidgetShowcase`/`AppExtensions`). Không tìm được `file:line` nào khác gây riêng hiệu ứng "unmount" này ngoài chính cấu trúc ternary đã nêu — không cần audit thêm.
- Gợi ý sửa (bổ sung cho đề xuất #1 ở dưới): nếu dùng `key` ổn định cho từng block con (`<ReportSummary key="report" />`, v.v.) thay vì để React coi 2 nhánh ternary là cây hoàn toàn khác nhau, có thể giảm được phần "unmount toàn bộ" — nhưng thứ tự DOM vẫn đổi nên CLS gốc (do reorder) vẫn còn, chỉ đỡ hơn phần bị cộng dồn do remount lại toàn bộ component (mất state nội bộ, re-fetch, v.v.). Chưa đo được mức độ giảm — chỉ là gợi ý kỹ thuật, không phải kết luận định lượng.

### `#AppFrameMain` và `html.p-theme-light>body>::after` — không phải code của app

- Grep toàn bộ `packages/assets/src` không tìm thấy `AppFrameMain` hay `body::after` nào được định nghĩa trong repo này. Xác minh bằng `grep -rl "AppFrameMain" node_modules/@shopify/polaris/build` → khớp `components/Frame/Frame.js` — **`AppFrameMain` là id nội bộ của component `Frame` trong package `@shopify/polaris`**, không phải element do app tự tạo. `p-theme-light` cũng là class do `AppProvider` (Polaris) gắn lên `<html>`/theme container, xác nhận qua `node_modules/@shopify/polaris/build/esnext/components/AppProvider/global.out.css`.
- Ý nghĩa: các `clsTarget` này (`#AppFrameMain` n=28 total=6.98, `#AppFrameMain>...>Avada-Frame` n=41 total=8.39, `#AppFrameMain>...>Polaris-Page` n=37 total=8.66, `html.p-theme-light>body>::after` n=68 total=11.12) là **chrome do Polaris/App Bridge quản lý**, không có `file:line` trong repo `subscriptions` để sửa trực tiếp. Nhiều khả năng đây là hiệu ứng lan toả (bubbling) của cùng 1 shift bên trong `Home.js` được Layout Instability API quy về ancestor gần nhất có id/selector ổn định, khi phần tử con thực sự gây shift không có class/id riêng để định danh — tức có thể là CÙNG root cause với phát hiện #1, không phải nguyên nhân độc lập. **Chưa xác minh chắc chắn được đây là cùng root cause hay nguyên nhân riêng** — cần xem thêm sample-level data (grouped theo path + target cùng lúc) mới kết luận, ngoài phạm vi thời gian của lần verify này.

### `max=2.801` — outlier khổng lồ

- Mẫu tệ nhất trong toàn bộ tập 1529: `clsValue=2.801`, path=`/embed/settings`, `shopSource=cache`, `clsTarget=#AppFrameMain>...>Avada-Frame>div.Polaris-Page`, `clsLargestValue=0.999` tại `clsLargestAtMs=3596` — rất sát `integrations:fetch-end=3111` (chênh ~485ms, có thể còn nhiều shift nhỏ khác cộng dồn sau đó tới 3596ms). `shopsFetchMs=1307`, `integrationsFetchMs=1104` — cả 2 request đều chậm hơn trung vị đáng kể (so với các mẫu khác `shopsFetchMs` thường ~600-900ms), có thể do cold start hoặc mạng chậm phía merchant này — khớp với thiết kế "sequential, không parallel" của `/shops` rồi `/shops/integrations` đã nêu trong comment `storeReducer.js:110-121` (throughput hạn chế của Firebase Functions v1, mỗi request chờ request trước xong). Đáng nêu riêng vì đây không phải path `/embed/` (Home) mà là `/embed/settings` — cho thấy cơ chế `blockWidgetStatus` flip qua `SET_SHOP`/`MERGE_SHOP` ảnh hưởng CLS ở **nhiều trang dùng `state.shop`**, không chỉ Home, dù Home là trang bị nặng nhất do có `metricsFirst` reorder thêm vào.

## Đề xuất fix (KHÔNG implement)

Xếp theo tỉ lệ lợi/công, ước lượng công theo effort cá nhân dev quen codebase:

1. **Home.js `metricsFirst`** — Sửa: không đổi thứ tự component, chỉ đổi hiển thị/ẩn trong cùng vị trí, hoặc trì hoãn render toàn bộ block bằng 1 skeleton chờ CẢ HAI tín hiệu (`hasContract` biết chắc + `isWidgetStatusKnown`) trước khi quyết định thứ tự lần đầu (tương tự cách `hasFetched` đã làm ở Subscriptions.js) — không vẽ theo nhánh `false` rồi đổi. Rủi ro: phải thêm 1 khoảng loading dài hơn trước khi Home hiện nội dung (đánh đổi CLS lấy LCP/TTI chậm hơn chút, cần cân nhắc). Công: nhỏ-vừa (1 file, logic rõ ràng). Lợi: cao nhất trong các phát hiện — nên làm trước.
2. **4 tab Orders** — Áp lại đúng pattern `hasFetched` đã dùng ở Subscriptions/Plans/Subscribers/SubscriptionProducts (thêm state `hasFetched`, chỉ set `isEmptyState` khi đã fetch xong). Công: nhỏ, lặp lại pattern có sẵn 4 lần. Lợi: vừa.
3. **Đo thật bằng `queryWebVitalsCls.js`** trước và sau khi fix #1, để xác nhận định lượng thay vì chỉ suy luận cơ chế — cần chạy trong môi trường có quyền truy cập BigQuery prod (ngoài phạm vi audit này).
4. **LimitReachBanner** — nếu xác minh được nó phụ thuộc field chỉ có trong `subscription.shop`, áp dụng cùng kỹ thuật "chỉ show/hide, không có final state cho tới khi biết chắc" như đã làm ở `ActiveBanner.js` (xem mục Đã loại trừ) — đây đã là pattern chuẩn trong file khác, chỉ cần lặp lại.

## Những gì đã loại trừ

- `packages/assets/src/components/LoadingFallback/LoadingFallback.js` — skeleton toàn trang khi `shop` (App.js:73-81) chưa có, được thiết kế cố ý để mirror layout Home (comment trong file: "Loading skeleton that mirrors Home page structure to minimize CLS"). Nguồn gốc: commit `61831ceff` (2026-04-21) + `1f7117918` (2026-04-23), đã cũ (~4 tháng), không phải regression gần đây. Không phải nguồn CLS hiện tại.
- 4 trang list **Subscriptions, Plans, Subscribers, SubscriptionProducts** — đã có fix "narrow-then-full-width" (biến `hasFetched`, `fullWidth={!isEmptyState}`) từ commit `8408dfcb8` + `b48349ee1` (2026-08-05), tự đọc code hiện tại xác nhận cả 4 file đều có `hasFetched`/`fullWidth={!isEmptyState}` (dòng cụ thể: `Subscriptions.js:216,224 & 751`; `Plans.js:150,155 & 524`; `Subscribers.js:178,184 & 560`; `SubscriptionProducts.js:206,211 & 678`). Skeleton rows của Subscriptions.js (`Subscriptions.js:603-606,840,886`, tự đọc) khớp số dòng với `limitPerPage` thực tế — hợp lý, không phải nguồn CLS mới.
- `packages/assets/src/pages/Home/ActiveBanner/ActiveBanner.js` — đã có guard tường minh (`shop.appBlockStatus !== false` → return rỗng, comment giải thích rõ đây từng là bug CLS đã fix) trước khi banner này từng gây "shifting the whole page". Đọc toàn bộ file, xác nhận không còn là nguồn CLS.
- `packages/assets/src/pages/Home/GrowSubscriptionsCard/GrowSubscriptionsCard.js` — render có điều kiện (`if (shop[DISMISS_GROW_CARD_FIELD]) return null;`, dòng 150) nhưng CSS xác nhận `position: fixed` (`GrowSubscriptionsCard.scss:25`, class `.Joy-CallCard`) — phần tử fixed nằm ngoài luồng layout, ẩn/hiện nó không đẩy phần tử khác, nên loại trừ theo định nghĩa CLS (Layout Instability API bỏ qua các phần tử out-of-flow không ảnh hưởng phần tử khác).
- Suspect nhóm F (ảnh/thumbnail thiếu kích thước) và G (useEffect set state pattern chung) trong brief — KHÔNG khảo sát diện rộng do giới hạn thời gian; không kết luận pass/fail, chỉ ghi nhận chưa quét.

---

**Khẳng định tự tin nhất**: phát hiện #1 (`Home.js` `metricsFirst`, commit `448653907`, 2026-08-13, mức độ **CAO**) — mã nguồn đọc trực tiếp từ file hiện tại + diff commit khớp hoàn toàn, cơ chế reorder rõ ràng, thời điểm khớp chính xác với "gần đây". Vòng verify này còn củng cố thêm bằng số đo thật (`p75≈0.13` toàn app, `p75≈0.165` riêng Home chiếm ~63% traffic) và bằng việc lật lại đúng chỗ bản trước suy luận sai (cache-hit KHÔNG miễn nhiễm — `SET_SHOP` full-replace tại `shops:fetch-end` xoá `blockWidgetStatus` khỏi state trên MỌI shop, không riêng cache-miss; xác nhận bằng `packages/assets/src/actions/storeActions.js:29-30`, `packages/assets/src/services/shopService.js:7-31`, `packages/functions/src/controllers/shopController.js:60-93,108-165`). Lưu ý: 6/8 mẫu CLS tệ nhất thật sự là `shopSource: cache`, nhưng tự tính lại `clsLargestAtMs - integrations:fetch-end` chỉ ~3/8 mẫu (2 cache + 1 network) khớp sát mốc (<1s) — timing KHÔNG phải bằng chứng định lượng mạnh, chỉ là tương quan yếu; mức CAO dựa chính vào lập luận code (a) + traffic share (b) ở mục 1, không dựa vào con số timing này.

**Khẳng định kém tự tin nhất**: mục "Nghi ngờ nhưng chưa xác minh" — đặc biệt `LimitReachBanner` (chưa so sánh field API thật), 2 banner từ package ngoài repo (`WidgetInlineBannerV2`, `WidgetWhatNews`, không đọc được source), liệu `#AppFrameMain`/`body::after` là cùng root cause với phát hiện #1 hay nguyên nhân riêng (chưa đối chiếu được sample-level path+target cùng lúc), và 4 mẫu cache lệch 4-25 giây khỏi mốc `integrations:fetch-end` mà nguyên nhân chưa xác định (xem mục tương ứng). Nên giao verifier vòng sau kiểm: (a) số đo thật có tái lập được khi chạy lại `queryWebVitalsCls.js` không; (b) liệu `#AppFrameMain`/`body::after` có trùng root cause #1 hay là gap sửa fix chưa che phủ; (c) 4 mẫu lệch xa mốc `integrations:fetch-end` — nguyên nhân thật là gì.
