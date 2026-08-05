---
type: note
title: Layer 5 — Graph
summary: Graph = nhiều loop nối bằng node/edge/shared-state; so sánh 4 primitive của Claude Code (subagent, skill, agent team, workflow) theo tiêu chí "ai giữ kế hoạch", kèm chi phí ~15× token và checklist trước khi dựng.
tags: [ai, tooling, method, patterns, skills]
created: 2026-08-05
source: Anthropic "Building Effective Agents" (anthropic.com/engineering/building-effective-agents) + digest/decision trong brain
---

# Layer 5 — Graph

## Layer này là gì

Graph = **điều phối giữa nhiều agent/bước**. Vai của bạn: **org designer** — bạn không
giao việc nữa, bạn thiết kế cái tổ chức làm việc đó.

Định nghĩa gốc: *thực hành thiết kế đồ thị mà các agent chạy trong đó — node chuyên biệt
nào tồn tại, edge nào định tuyến công việc, và shared state nào chảy dọc theo edge.*

| Thành phần | Là gì | Hiện thân trong Claude Code |
|---|---|---|
| **Node** | đơn vị làm việc | subagent `.claude/agents/*.md` |
| **Edge** | định tuyến: tuần tự, điều kiện, song song, lặp | orchestrator tự chọn; **hook** khi cần edge chắc chắn cháy |
| **Shared state** | object chảy giữa node, phình dần | context window, biến trong workflow script, hoặc file trên đĩa |

Loop là một agent lặp một chu kỳ. Graph là khi nhiều loop nối lại.

**Tên mới, không phải công nghệ mới.** Thuật ngữ kết tinh giữa 7/2026; LangGraph,
AutoGen GraphFlow, Google ADK đã hỗ trợ đúng những quyết định thiết kế này từ trước.
Cái cần học là *quyết định thiết kế*, không phải API — đừng đợi tool mới.

## Đọc mục này trước: cái giá

Số thật từ Anthropic (multi-agent research system, Opus lead + Sonnet workers):

- **+90.2%** so với single-agent trên eval nội bộ
- agent thường dùng **~4×** token so với chat; **multi-agent ~15×**
- riêng token usage giải thích **80% variance** của hiệu năng

Anthropic nói thẳng multi-agent fit **kém** với: **coding task**, và việc cần phối hợp
real-time chặt. Fit tốt: research song song nhiều hướng, thông tin vượt một context
window, nhiều tool tích hợp.

Giảm giá: model mạnh làm orchestrator, model rẻ làm worker → 5–10× rẻ hơn mà chất lượng
gần như không đổi **trên task đã scope kỹ**.

> Đọc lại một lần nữa: fit **kém** với coding task. Việc hằng ngày của team mình là coding.
> Mặc định đúng vẫn là loop + harness. Graph là ngoại lệ có lý do, không phải mặc định.

## Khi nào bạn đang ở đây

Chỉ khi cả ba đúng:

1. Việc **chia được thành nhánh độc lập thật** — không phải chia cho đẹp
2. Một agent + verifier rõ ràng **đã thử và không làm nổi**
3. Bạn chấp nhận trả ~15× token cho việc này

Thiếu một trong ba → quay lại layer 4.

## Use case — ba hình dạng graph và việc nào hợp

Tên pattern lấy từ *Building Effective Agents* (Anthropic). Ba cái này phủ gần hết
graph mà một team dev thật sự cần.

### 1. Parallelization — sectioning: chia phần độc lập, chạy cùng lúc

Nhiều agent làm **phần khác nhau** của cùng một việc, gộp kết quả cuối.
Dùng khi việc chia được thành phần độc lập và bạn cần **nhanh**.

| Ứng dụng ở team | Chia theo |
|---|---|
| Audit toàn repo trước release | dimension: bảo mật / query thiếu `shopId` / xử lý lỗi / N+1 |
| **Sửa bug là quét hết chỗ tương tự** | thư mục hoặc package |
| Migration nhiều file cùng khuôn | file (mỗi agent một worktree) |
| Đọc hiểu một repo lạ | subsystem |

Hàng thứ hai đáng chú ý: quét hết chỗ tương tự là convention sẵn có của team, và nó
**đúng shape của graph** — nhiều nhánh độc lập, không cần nói chuyện với nhau.

### 2. Parallelization — voting: cùng một việc, nhiều lần, lấy đa số

Nhiều agent làm **cùng một việc** rồi bỏ phiếu. Dùng khi cần **nhiều góc nhìn** hoặc
khi sai một lần là đắt.

| Ứng dụng | Cách bỏ phiếu |
|---|---|
| Adversarial verify một phát hiện | 3 skeptic cùng **cố bác bỏ**, ≥2 bác thì bỏ |
| Review đoạn code nhạy cảm (billing, auth) | mỗi agent một lăng kính: correctness / bảo mật / hiệu năng |
| Chọn giữa nhiều thiết kế | judge panel chấm độc lập rồi tổng hợp |

Mẹo quan trọng: verifier được prompt *"kiểm tra xem có đúng không"* sẽ gật đầu.
Phải prompt là **"cố bác bỏ, không chắc thì coi như sai"**.

### 3. Orchestrator–Workers: không đoán trước được có mấy việc con

Một agent điều phối tự chia việc rồi giao worker, cuối cùng tổng hợp. Dùng khi
**không biết trước subtask là gì** — khác hẳn sectioning (biết trước chia làm mấy phần).

| Ứng dụng | Vì sao không đoán trước được |
|---|---|
| Đổi API version Shopify toàn repo | không biết trước bao nhiêu chỗ, mỗi chỗ khác nhau thế nào |
| Điều tra một sự cố prod | mỗi manh mối mở ra hướng mới |
| Research so sánh nhiều cách làm | không biết trước phải đọc gì |

Đây cũng chính là hình dạng của `/looptasks`: recon trước để **tìm ra** vùng va chạm,
rồi mới chia nhóm — không giả định trước.

### Ứng dụng thế nào — 4 bước

1. **Viết ra input và output của cả graph** trước tiên. Không viết được thì chưa đủ rõ để dựng
2. **Chọn hình dạng** theo bảng trên: biết trước mấy phần → sectioning; cần chắc chắn →
   voting; không biết trước → orchestrator
3. **Chọn primitive**: một lần trong một session → workflow script. Kéo dài nhiều ngày,
   cần hỏi người → `/looptasks` gọi workflow cho từng task nặng
4. **Gate trước khi tổng hợp.** Node cuối không được chỉ gộp text — phải có chốt loại bỏ

### Khi nào KHÔNG dùng graph

- **Coding task thông thường** — Anthropic nói thẳng multi-agent fit kém ở đây
- Việc cần phối hợp real-time chặt giữa các nhánh
- Việc cần **liền mạch** (3 bài capstone sinh song song ra 3 ví dụ khác nhau)
- Việc cần hỏi người ở giữa — workflow không có input giữa chừng
- Bạn chưa thử làm nó bằng một loop

## Cơ bản — 4 primitive, khác nhau ở AI GIỮ KẾ HOẠCH

| | **Subagents** | **Skills** | **Agent teams** | **Workflows** |
|---|---|---|---|---|
| Là gì | worker Claude spawn | chỉ dẫn Claude làm theo | lead giám sát session ngang hàng | **script runtime chạy** |
| Ai quyết định bước tiếp | Claude, từng lượt | Claude | lead agent | **script** |
| Kết quả trung gian ở | context window | context window | task list chung | **biến script** |
| Cái lặp lại được | định nghĩa worker | chỉ dẫn | định nghĩa team | **chính phần điều phối** |
| Quy mô | vài task/lượt | như subagent | vài peer chạy dài | **hàng chục–hàng trăm agent** |
| Bị ngắt thì | restart lượt | restart lượt | **teammate chạy tiếp** | resume được trong cùng session |

Tiêu chí phân biệt không phải "cái nào mạnh hơn" mà là **kế hoạch nằm ở đâu**: trong đầu
Claude (subagent/skill), ở lead agent (team), hay trong code (workflow).

### Subagent — dùng nhiều nhất, rẻ nhất

Đây là primitive bạn nên dùng 90% thời gian. Hai lý do chính đáng để spawn:

- **Cách ly context**: việc đọc nhiều mà cần ít (recon, khảo sát) — nó đọc 40 file trong
  context của nó, trả về 5 dòng
- **Không được vừa viết vừa chấm**: `verifier` phải là agent khác

Định nghĩa sẵn ở `.claude/agents/*.md`, commit trong repo để cả team dùng.

### Agent team — nhiều session ngang hàng, một lead

Khác subagent ở chỗ teammate là **session thật, sống độc lập**, không phải worker sinh ra
rồi chết trong một lượt. Lead giám sát, cả team dùng chung một task list.

Điểm mạnh riêng: **bị ngắt thì teammate chạy tiếp** — subagent và skill đều phải restart
cả lượt. Hợp với việc chạy dài, vài người/agent cùng cày một mảng lớn.

Đổi lại: đắt nhất về sự phối hợp, và task list chung trở thành chỗ tranh chấp — nó chính
là shared state, phải có quy tắc lock giống `[⏳ HH:MM]` của `BRIEF.md`
(xem [[ai-eng-04-loop]]).

Dùng khi: việc kéo dài nhiều giờ, chia được theo mảng, và bạn cần nó sống sót qua việc
bạn đóng máy. Đừng dùng cho task 20 phút — subagent đủ.

### Workflow — graph đúng nghĩa nhất

Đây là primitive **duy nhất chuyển kế hoạch từ context window vào code**: có loop, branch,
state thật, rerun được y hệt, và context của Claude chỉ giữ kết quả cuối.

Kéo theo: quality pattern **code hoá được**, không còn là lời khuyên model có thể bỏ qua —
adversarial verify (N skeptic cố bác bỏ, majority mới sống), judge panel, loop-until-dry.

Giới hạn runtime: tối đa **16 agent đồng thời**, **1000 agent/run**, **không có input giữa
chừng**, script **không đụng filesystem** (agent mới đụng được).

## Nâng cao

**Hybrid, không thay thế.** `/looptasks` đã là một graph — chỉ là viết bằng văn xuôi
thay vì code (node = subagent mỗi task, edge = recon → chia nhóm → spawn → verify,
shared state = `BRIEF.md` trên đĩa). Shape đúng: **looptasks giữ vai orchestrator dài hạn**
(state bền, cron, hỏi được người) và **gọi workflow cho từng task đủ nặng** — audit toàn
repo, migration nhiều file, quét hết chỗ tương tự khi sửa lỗi.

Ba thứ workflow **không** làm được, đúng những thứ loop cần ([[looptasks-vs-workflow]]):

1. **State chết theo session** — thoát Claude Code là chạy lại từ đầu. `BRIEF.md` sống mãi,
   sync đa máy, chạy qua cron nhiều ngày. Khác biệt *kiến trúc*, không vá được
2. **Không có input giữa chừng** — muốn có chốt hỏi người thì phải cắt thành nhiều workflow
3. **Script không đụng git** — kỷ luật git tập trung ở main agent sẽ phải rơi xuống agent,
   mất đúng cái rào chống agent này `checkout` phá việc agent kia

**Replay rule tàn nhẫn.** Dừng giữa fan-out: mọi agent *start sau* agent chưa xong đều
chạy lại, kể cả agent đã xong. Hệ quả thiết kế: **nhiều agent nhỏ giữ được nhiều tiến độ
hơn một agent dài**.

**Cho reviewer node thẩm quyền thật** — được quyền bật ngược lại, không chỉ ghi nhận xét.
Reviewer không có quyền phủ quyết là trang trí.

**Effort-tier từng phase.** Đặt effort thấp cho phase cơ học, chỉ nâng cho verify/judge.
Giảm token đáng kể mà không đổi chất lượng.

## Setup — workflow đầu tiên

Workflow là script JS **runtime chạy**, không phải chỉ dẫn model đọc. Cấu trúc bắt buộc:
`export const meta` (literal thuần, không biến, không hàm) rồi tới thân script.

```js
export const meta = {
  name: 'audit-shopid',
  description: 'Quét mọi query Firestore thiếu shopId, verify từng phát hiện',
  phases: [{ title: 'Tìm' }, { title: 'Verify' }],
}

const AREAS = ['packages/functions/src/handlers', 'packages/functions/src/services']

const FINDINGS = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { file: { type: 'string' }, line: { type: 'number' }, why: { type: 'string' } },
        required: ['file', 'line', 'why'],
      },
    },
  },
  required: ['items'],
}

const VERDICT = {
  type: 'object',
  properties: { real: { type: 'boolean' }, evidence: { type: 'string' } },
  required: ['real', 'evidence'],
}

const results = await pipeline(
  AREAS,
  area => agent(
    `Quét ${area}: tìm query Firestore không kèm shopId. Chỉ báo cái đọc được từ code.`,
    { label: `tìm:${area}`, phase: 'Tìm', schema: FINDINGS }
  ),
  found => parallel((found?.items ?? []).map(f => () =>
    agent(
      `Cố BÁC BỎ phát hiện này: ${f.file}:${f.line} — ${f.why}. Đọc code thật. Không chắc thì real=false.`,
      { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT }
    ).then(v => ({ ...f, ...v }))
  ))
)

return results.flat().filter(Boolean).filter(x => x.real)
```

Ba thứ trong ví dụ này không phải trang trí:

| Thứ | Vì sao |
|---|---|
| `schema` | ép agent trả JSON đúng cấu trúc, validate ở tầng tool — không phải tự parse text |
| `pipeline` chứ không `parallel` giữa 2 stage | area xong trước thì verify luôn, không chờ area chậm nhất |
| Prompt verify bảo **cố bác bỏ** | verifier được prompt "kiểm tra xem có đúng không" sẽ gật đầu |

### Chạy và sửa

- Mỗi lần chạy, script được lưu ra file dưới session dir — path trả về trong kết quả.
  Sửa file đó rồi gọi lại bằng `scriptPath`, đừng gửi lại cả script
- `/workflows` xem tiến độ realtime
- Workflow/skill vừa tạo **chưa vào registry** → gọi bằng `scriptPath`, không gọi bằng `name`

### Gotcha đã trả giá khi viết script

- Plain JS, **không TS** — type annotation làm vỡ parse
- **Không có** `Date.now()`, `Math.random()`, `new Date()` không tham số (chúng phá resume);
  không đụng filesystem (chỉ agent đụng được)
- `args` có thể tới dạng **chuỗi JSON** → phải `JSON.parse`; lồng sâu thì bị mangle.
  Bền nhất: **ghi list ra file cho agent đọc**
- Backtick trong template literal làm vỡ script
- `node --check` báo *"Illegal return statement"* là **false alarm** — harness bọc thân
  script trong async function

### Agent team

Không phải script. Bạn mở nhiều session ngang hàng, một lead giám sát, cả team dùng chung
một task list. Chuẩn bị trước đúng hai thứ:

1. **Task list chung có lock** — nó là shared state. Không có quy tắc kiểu `[⏳ HH:MM]`
   thì hai teammate nhận cùng một việc
2. **Ranh giới file rõ ràng giữa các teammate** — hoặc mỗi teammate một worktree

Dùng khi việc kéo dài nhiều giờ và cần sống sót qua việc bạn đóng máy. Task 20 phút thì
subagent đủ, đừng dựng team.

## Cạm bẫy

| Đừng | Nên thay bằng |
|---|---|
| Graph không có gate | Không có gate = trả 15× token để nhận kết quả sai một cách rất tự tin, ở quy mô lớn hơn. Harness trước, loop, rồi mới graph — đúng thứ tự 5 layer |
| Chia node cho đẹp sơ đồ | Chỉ đặt tên node nếu đó là **chuyên môn thật** |
| Viết code trước, vẽ edge sau | Vẽ edge và định nghĩa rõ object shared state **trước** khi viết dòng đầu tiên |
| 1 agent / 1 hạng mục, không guard → agent chết vì lỗi API, hạng mục trống **im lặng**, workflow vẫn báo xong ([[digest-aws-2026-07-27]]) | Guard phát hiện kết quả rỗng/failure → retry |
| Fan-out việc cần **liền mạch** — 3 bài capstone sinh song song ra 3 ví dụ khác nhau vì agent không chia sẻ context | Chốt phần chung trước rồi mới bung |
| Không đặt trần chi phí | Trần token + ràng buộc cứng, đặt trước khi chạy |
| Dùng multi-agent cho coding task vì nghe hiện đại | Anthropic nói thẳng nó fit kém ở đây. Cố giữ nó là loop trước |

## Checklist trước khi dựng graph

1. [ ] Đã **thử giữ nó là loop** chưa? Một agent + verifier rõ ràng có làm nổi không?
2. [ ] Mỗi node là chuyên môn thật, không phải chia cho đẹp?
3. [ ] Đã **vẽ edge** trước khi viết code?
4. [ ] Object shared state được định nghĩa rõ — ai ghi, ai đọc, phình tới đâu?
5. [ ] Reviewer node có thẩm quyền thật (được bật ngược lại)?
6. [ ] Lỗi ở một node có bị cô lập không, hay nó làm cả graph im lặng sai?
7. [ ] Trần chi phí + ràng buộc cứng đã đặt chưa?
8. [ ] Có guard chống agent chết im lặng chưa?
9. [ ] Trong 16 agent đồng thời / 1000 agent một run chứ?
10. [ ] Việc này có cần hỏi người giữa chừng không? Cần thì workflow **không** hợp

## Liên quan

- [[graph-engineering]] — note nền, chi tiết hơn
- [[looptasks-vs-workflow]] — so sánh với harness đang chạy
- [[ai-eng-04-loop]] · [[ai-eng-03-harness]] · [[ai-eng-guide]]
