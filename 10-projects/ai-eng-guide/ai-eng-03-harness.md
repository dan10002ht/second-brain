---
type: note
title: Layer 3 — Harness
summary: Harness là tool + memory + gate quanh model; cần chuẩn bị done-criteria chạy được, gate deterministic trước gate LLM, verifier context tách rời, state bền trên đĩa — và trả lời thẳng câu "có cần second brain không".
tags: [ai, tooling, method, skills, memory, brain]
created: 2026-08-05
source: Anthropic "Building Effective Agents" (anthropic.com/engineering/building-effective-agents) + digest/decision trong brain
---

# Layer 3 — Harness

## Layer này là gì

Harness = **tool, memory và scaffolding bao quanh model**. Vai của bạn: **toolmaker**.

Ở layer 1–2 bạn còn ngồi đó gõ từng lượt. Ở layer 3 bạn dựng sẵn bộ khung để lần sau
không phải gõ lại: model có công cụ để tự kiểm chứng, có chỗ tra thứ nó không biết,
và có chốt chặn không cho thứ hỏng đi qua.

Câu phân biệt với layer 5:

> Graph nói về **edge nào chạy tiếp**. Harness nói về **cái gì được phép đi qua**.

Trong Claude Code, harness của bạn gồm:

| Thành phần | Là gì | Đặc điểm |
|---|---|---|
| `CLAUDE.md` | chỉ dẫn nạp tự động | luôn có, tốn token mọi lượt |
| **Skill** (`SKILL.md`) | quy trình đóng gói, gọi bằng `/tên` | model *làm theo* — có thể chệch |
| **Hook** | script chạy tại thời điểm cố định | **chắc chắn cháy**, không phó mặc model |
| **Subagent** (`.claude/agents/*.md`) | worker định nghĩa sẵn, context riêng | chuyên môn hoá + cách ly |
| **MCP** | tool ngoài (Jira, Slack…) | cho agent đụng hệ thống ngoài |
| **Script gate** | `check.mjs`, test, lint | rẻ, không bịa |

## Khi nào bạn đang ở đây

- Bạn phải nhắc lại cùng một convention ở mọi session
- Agent báo "xong, đã test" nhưng thực tế đỏ
- Cùng một loại bug tái phát ở project khác nhau
- Bạn đang copy-paste một quy trình 6 bước từ Notion vào chat lần thứ ba

## Use case — tình huống nào thì dựng cái gì

Harness không dựng một lần cho xong. Mỗi mảnh sinh ra để chữa **một cơn đau cụ thể** —
chưa đau thì chưa cần dựng.

| Cơn đau | Dựng cái gì | Ví dụ thật |
|---|---|---|
| Dev mới mất 2 ngày mới build được repo | `CLAUDE.md` có lệnh + cấu trúc | mọi repo |
| Agent báo "xong, test pass" nhưng CI đỏ | subagent `verifier` | moonie — bắt ~18 ca báo sai |
| Text tiếng Việt lọt vào UI merchant | gate script (regex) chạy trong CI | extension Shopify |
| Cùng một lỗi tái phát ở repo khác | note brain + gate nếu bắt được bằng script | SVG blank-line: 279 block / 116 file |
| Có người commit khi typecheck đỏ | hook `PreToolUse` | — |
| Làm lần thứ ba một quy trình 6 bước | skill trong `.claude/skills/` | deploy staging, QA |
| Debug lại đúng thứ đã debug 3 tháng trước | second brain | Colima/Ryuk, ràng buộc `swapForNextBilling` |
| Fan-out xong, một hạng mục trống mà không ai biết | guard kiểm kết quả rỗng | aws — 1 agent/course chết im lặng |

Thứ tự dựng, nếu bắt đầu từ số không: `CLAUDE.md` → `verifier` → gate script → skill → hook.
Ba cái đầu đã lấy phần lớn giá trị.

**Khi nào KHÔNG cần dựng gì thêm:** task một lượt, kết quả nhìn phát biết đúng sai
(sửa CSS, đổi copy). Harness cho loại việc đó là scaffold thừa.

## Cơ bản

**1. Done-criteria phải chạy được bằng lệnh.**

Đây là viên gạch đầu tiên. Không có nó thì mọi thứ phía trên là trang trí.

```
tsc --noEmit → exit 0
yarn test packages/functions → pass
git status --porcelain → trống
```

Quy tắc của team: **không tuyên bố "xong" khi `git status --porcelain` chưa trống**.
Lỗi này bị bắt tại trận ở project aws (còn file plan chưa commit mà đã báo done).

**2. Gate deterministic chạy TRƯỚC gate LLM.**

Script thường (grep, lint, test, đếm) rẻ hơn nhiều lần và **không bịa**. Chỉ đưa qua
LLM đánh giá khi gate rẻ đã sạch. Ở aws study-app: `check.mjs` kiểm trùng/format/tỉ lệ
loại sớm, LLM chỉ chấm phần còn lại ([[digest-aws-2026-07-24]]).

**3. Đứa viết không được chấm bài của chính nó.**

Dùng subagent `verifier` riêng: context sạch, **không có Edit/Write**, chạy done-criteria
thật, trả verdict kèm bằng chứng. Đây là lý do `/looptasks` tách hẳn bước verify ra khỏi
main agent ([[2026-08-04-looptasks-verifier-doc-lap]]).

Ba verdict, xử khác nhau:

| Verdict | Làm gì |
|---|---|
| `PASS` | commit, đóng task |
| `FAIL` | giao lại **đúng một vòng** để sửa, verify lại. Vòng hai vẫn fail → blocker |
| `UNVERIFIED` | **không được coi là pass**. Chạy lại; vẫn vậy → blocker |

`UNVERIFIED` bị coi là pass là cách thất bại êm ái nhất và hay gặp nhất.

**4. Không tin report của agent — dùng ground truth.**

Ở moonie, verify độc lập bắt lỗi ~18 ca: generator báo lint pass khi thực tế fail,
báo `make check` xanh khi có test đỏ, đọc sai `.env` của chính nó ([[digest-moonie-2026-07-24]]).
Ở aws, report "added=0" sai liên tục — `grep -c '<svg' <file>` mới là sự thật
([[digest-aws-2026-07-27]]).

**5. Gate phải chạy trên đường render THẬT.**

Bài học đắt: gate `rsvg-convert` báo PASS cho từng chuỗi SVG tách rời, nhưng in-app vẫn
vỡ (dòng trống trong khối `<svg>` làm CommonMark cắt HTML block) — tái phát 279 block /
116 file ([[digest-aws-2026-07-27]]). Tool cô lập PASS ≠ sản phẩm chạy đúng.

## Nâng cao

**Skill không được biết gì về app.** Muốn nhấc skill sang repo khác mà không sửa thì mọi
thứ riêng-app gom vào **một file config ở project root**; skill chỉ đọc config. Đây là
cách skill QA ở moonie được thiết kế ([[digest-moonie-2026-07-24]]).

**Skill cấp project thì commit trong repo** (`.claude/skills/`) để cả team dùng, không
đặt global. Global chỉ cho thứ đúng ở mọi repo.

**Hook cho edge phải chắc chắn cháy.** Skill là *lời khuyên* — model có thể bỏ qua khi
context loãng. Hook là *cơ chế*. Chỗ đáng chuyển sang hook: bước verify (đừng phó mặc
main agent nhớ mà chạy), chặn commit khi cây git bẩn, format trước khi ghi.

**Đừng dựng scaffold thừa.** Harness tốt cho chạy **liên tục đầu-cuối**
(generate → gate → fix → lặp tới khi output OK). Điểm dừng thật chỉ là thứ **vật lý
không có trong máy**: ảnh chụp thật, token prod, VPS. "Dừng chờ duyệt mỗi phase" là
scaffold thừa — user đã đẩy lại 2 lần vì chuyện này ([[digest-moonie-2026-07-24]]).

> Giá trị của harness nằm ở **gate chất lượng mỗi task**, không phải ở ranh giới phase.

**Held-out test.** Test agent không nhìn thấy lúc viết code. Ca hay nhất ở moonie:
`go-reviewer` tự viết test concurrency không ai yêu cầu → phơi ra race TOCTOU
(2 order / 1 orphan) mà test tuần tự không thấy.

**Subagent nền vẫn chạy sau khi bạn mark done — và có thể tự commit.** Một generator ở
moonie chạy thêm ~68 phút rồi tự commit tối ưu Dockerfile. Thấy commit lạ thì `git fsck`
+ soi phạm vi trước khi nhận.

## Có cần second brain không?

Trả lời thẳng: **không bắt buộc, nhưng có thì lời — và giá trị nằm ở đúng một loại thông tin.**

Cần second brain khi bạn có thông tin **không suy ra được từ code**:

| Loại | Ví dụ thật | Repo giữ được không |
|---|---|---|
| Root cause đã tốn nhiều giờ | Colima cần **cả hai** `DOCKER_HOST` và `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE`, vì Ryuk bind-mount theo path host Mac | không |
| Ràng buộc kiến trúc do người chốt | KHÔNG thêm mirror-write loop N order trong `swapForNextBilling` (vỡ memory Functions + cạn bucket Shopify API) | không |
| Quyết định + tradeoff | vì sao chọn A mà bỏ B | không (commit message không đủ chỗ) |
| Gotcha môi trường | `timeout` không có trên macOS (exit 127) | không |
| Cấu trúc code, lịch sử fix | — | có — repo/git đã giữ |

Hàng cuối là điều quan trọng nhất: **đừng chép vào brain thứ repo đã giữ**. Brain phình
lên vì ghi lại cấu trúc thư mục là brain vô dụng.

Không cần second brain nếu bạn chỉ làm một app, một mình, và không quay lại sau vài tháng.
Cần ngay khi bạn nhảy giữa nhiều app (joy / subscriptions / crm / pdf / backup) — vì lúc
đó chi phí thật là **debug lại thứ mình từng debug rồi**.

Setup tối thiểu, không cần tool gì:

1. Một repo markdown. Không cần vector DB, không cần RAG — dưới ~100 nguồn thì `ripgrep`
   + một file `index.md` nhanh hơn và đúng hơn
2. Mỗi note có `summary:` một câu — để agent quyết định có mở full note không
3. Một skill `/brain <câu hỏi>` để tra được từ **mọi repo**
4. Vài dòng trong `~/.claude/CLAUDE.md`: "trước khi debug app X hoặc quyết định lại điều
   gì đó — tra brain trước"

Bước 4 là bước hay bị quên. Có brain mà agent không biết nó tồn tại thì bằng không.

### Nối brain vào mọi repo — chia 3 tầng theo giá

Đây là chỗ layer 2 và layer 3 đụng nhau: brain càng dày càng có ích, nhưng thứ vào
context **mọi lượt** thì càng mỏng càng tốt. Cách giải: chia theo tần suất dùng.

| Tầng | Nằm ở đâu | Vào context khi nào | Kích thước phải |
|---|---|---|---|
| 1. Luôn đúng ở mọi repo | `brain-core.md`, `@import` từ `~/.claude/CLAUDE.md` | **mọi lượt, mọi repo** | mỏng nhất có thể |
| 2. Tra khi cần | skill `/brain` | chỉ khi được gọi | không giới hạn |
| 3. Toàn bộ wiki | `~/projects/my-brain/` | không bao giờ tự động | không giới hạn |

`~/.claude/CLAUDE.md` chỉ có hai dòng — nội dung thật nằm ở file được import:

```
@RTK.md
@/Users/dantt1002/projects/my-brain/brain-core.md
```

Số thật của setup đang chạy:

- `brain-core.md` — **2.6KB (~900 token)**, trả ở mọi lượt chat, mọi repo. Chứa: user là ai,
  cách làm việc đã lặp lại nhiều lần, kỷ luật git theo loại repo, và **một dòng nói brain
  tồn tại + tra bằng cách nào**
- `index.md` — **30KB**, bản đồ toàn bộ brain, **không import**. Import nó là trả ~10k token
  mỗi lượt cho thứ 95% lượt không đụng tới
- Skill `/brain` đọc `index.md` rồi mới drill vào file cụ thể — trả tiền đúng lúc cần

Tiêu chí quyết định một dòng có được vào tầng 1 không:

> Dòng này có đúng **kể cả khi tôi đang ở repo khác** không? Không → xuống tầng 2.

Ví dụ: "commit message dạng `type - role - scope`" là tầng 1 (đúng ở mọi repo Avada).
"Joy Subscription không được thêm mirror-write loop trong `swapForNextBilling`" là tầng 2 —
sai chỗ nếu nhét vào tầng 1, vì nó chỉ đúng ở một repo mà lại tính tiền ở mọi repo.

Kiểm định kỳ: `wc -c ~/.claude/CLAUDE.md` và mọi file nó `@import`. Tổng vượt ~5KB thì
ngồi cắt — mỗi KB ở đây là thuế thu trên từng lượt chat của cả ngày.

## Setup — dựng harness cho một repo

Bốn thứ, dựng theo thứ tự này. Mỗi thứ đứng một mình đã có ích, không cần làm hết mới dùng được.

### 1. Subagent `verifier` — thứ đáng dựng đầu tiên

File `.claude/agents/verifier.md` (commit vào repo cho cả team). Bản đang chạy thật ở
`~/.claude/agents/verifier.md` — copy về repo rồi sửa phần lệnh cho khớp:

````markdown
---
name: verifier
description: Kiểm chứng độc lập một thay đổi đã xong — chạy done-criteria thật, đọc output thật, trả verdict PASS/FAIL/UNVERIFIED kèm bằng chứng. Dùng SAU khi implement, trước khi commit. Không sửa code.
tools: Read, Grep, Glob, Bash
model: sonnet
effort: high
---

Bạn là verifier độc lập. Việc duy nhất: *thay đổi này có đạt done-criteria không?*
— bằng **bằng chứng chạy được**, không phải suy luận.

Bạn không có Edit/Write. Với git chỉ được đọc (`status`, `diff`, `log`, `show`).

1. Bạn không tin lời ai. Report của agent viết code là **tuyên bố cần kiểm chứng**.
2. Ground truth = exit code + output thật. Trích nguyên văn dòng output quyết định.
   Không trích được dòng nào thì bạn chưa verify.
3. Gate deterministic TRƯỚC: typecheck → build → test → lint → rồi mới đọc diff.
4. **Gate không chạy được ≠ gate pass.** Timeout, thiếu dep, output rỗng bất thường
   → `UNVERIFIED`, không phải `PASS`.
5. Verify ở đường chạy THẬT. Jest xanh không chứng minh webpack build được.

Trả về: verdict + lệnh đã chạy + exit code + dòng output quyết định.
````

Gọi: giao task cho subagent `verifier` sau khi implement xong, kèm **đường dẫn tuyệt đối**
nơi phải chạy (`cd` không persist giữa các Bash call — mọi lệnh phải viết
`cd <path> && <lệnh>` trong cùng một call).

### 2. Gate deterministic — một script, không LLM

`scripts/check.mjs` hoặc bất cứ tên gì repo đang dùng. Nguyên tắc: **exit code là kết quả**,
không phải văn bản mô tả.

```js
// scripts/check.mjs — ví dụ: chặn text tiếng Việt lọt vào file hiển thị cho merchant
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync("git ls-files 'packages/extensions/**/*.liquid'", { encoding: 'utf8' })
  .split('\n').filter(Boolean)
const viet = /[àáảãạăâđêôơư]/i
const bad = files.filter(f => viet.test(readFileSync(f, 'utf8')))

if (bad.length) {
  console.error('Có tiếng Việt trong file hiển thị cho merchant:')
  bad.forEach(f => console.error('  ' + f))
  process.exit(1)
}
console.log('ok')
```

Gate loại này rẻ (mili giây), không bịa, và chạy được trong CI. Chỉ đưa qua LLM đánh giá
phần gate rẻ **không kiểm được**.

### 3. Hook — cho edge phải chắc chắn cháy

Skill là lời khuyên, hook là cơ chế. Cú pháp trong `.claude/settings.json` (project) hoặc
`~/.claude/settings.json` (global):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "scripts/guard-git.sh" }]
      }
    ]
  }
}
```

`matcher` là tên tool (`Bash`, `Edit`, `Write`…). Sự kiện hay dùng: `PreToolUse`,
`PostToolUse`, `SessionStart`, `Stop`. Script exit khác 0 thì chặn tool đó lại.

Chỗ đáng làm hook trước tiên: chặn `git commit` khi typecheck chưa xanh, format sau mỗi
`Write`, chặn subagent chạy git.

### 4. Skill — đóng gói quy trình lặp ≥3 lần

`.claude/skills/<tên>/SKILL.md`, commit trong repo:

````markdown
---
name: deploy-staging
description: Deploy app lên staging và verify smoke test. Dùng khi user nói "deploy staging", "đẩy lên staging".
---

# deploy-staging

## Bước 1 — kiểm tra
`git status --porcelain` phải trống. Không trống → dừng, báo user.

## Bước 2 — build
`yarn build` ở repo root. Exit khác 0 → dừng.

## Bước 3 — deploy
`firebase deploy --only functions --project staging`

## Bước 4 — verify
Gọi endpoint health, phải trả 200. Không 200 → báo user, đừng tự rollback.
````

Quy tắc quan trọng nhất: **skill không được biết gì riêng về app**. Đường dẫn/lệnh riêng
gom vào một file config ở project root, skill chỉ đọc config — thế thì nhấc sang repo khác
không phải sửa.

`description` là thứ quyết định skill có được gọi đúng lúc không: viết rõ **khi nào dùng**,
kèm cả từ ngữ user hay nói.

## Cạm bẫy

| Đừng | Nên thay bằng |
|---|---|
| Coi `npm run build` xanh là gate đủ | Gate phải khách quan và chạy trên đường render thật; build xanh chỉ nghĩa là compile được |
| Main agent vừa spawn code vừa tự verify | `verifier` riêng, không có Edit/Write |
| Nhận `UNVERIFIED` như pass vì "chắc do môi trường" | Chạy lại; vẫn vậy → blocker, báo người |
| Skill hardcode đường dẫn/lệnh test của một app | Config ở root, skill đọc config |
| Fan-out mà không guard: 1 agent / 1 hạng mục = SPOF. Agent chết vì lỗi API ("Connection closed mid-response") → hạng mục trống **im lặng**, gate vẫn PASS | Guard phát hiện kết quả rỗng/failure → retry ([[digest-aws-2026-07-24]]) |
| Dừng chờ duyệt mỗi phase cho "an toàn" | Chạy liên tục, gate mỗi task; chỉ dừng ở thứ vật lý không có trong máy |

## Checklist

Trước khi coi harness của một repo là "có":

- [ ] `CLAUDE.md` có lệnh build/test/lint cụ thể
- [ ] Done-criteria của repo này viết được thành lệnh — và tôi đã chạy thử
- [ ] Có gate deterministic (script/test/lint) chạy trước bất kỳ đánh giá bằng LLM
- [ ] Có `verifier` tách rời, không quyền ghi
- [ ] Gate chạy trên đường render/chạy thật, không phải tool cô lập
- [ ] Việc lặp lại ≥3 lần đã đóng thành skill, commit trong repo
- [ ] Edge bắt buộc (verify, chặn commit bẩn) đã là hook, không phải lời khuyên
- [ ] Fan-out có guard chống agent chết im lặng
- [ ] Kiến thức không suy ra được từ code đã có chỗ ghi
- [ ] Agent **biết** brain tồn tại (một dòng ở tầng 1), không chỉ là brain có tồn tại
- [ ] `wc -c ~/.claude/CLAUDE.md` + mọi file nó `@import` — tổng dưới ~5KB

## Liên quan

- [[ai-eng-02-context]] · [[ai-eng-04-loop]] · [[ai-eng-guide]]
- [[looptasks-vs-workflow]] — vì sao graph không thay được harness
- [[2026-08-04-looptasks-verifier-doc-lap]] — quyết định tách verifier
