---
name: looptasksv2
description: Như looptasks nhưng executor là LANE CODEX trong workspace cmux thay vì subagent Sonnet — nhặt tối đa 4 task từ BRIEF.md, mỗi task một worktree + một workspace riêng trên sidebar, lane báo xong bằng file report, verifier Claude chấm (cross-family), main agent commit. Tự fallback về subagent Sonnet khi lane không dựng được. Dùng khi user gọi /looptasksv2, hoặc muốn chạy task bằng codex để tiết kiệm quota Claude và nhìn được tiến trình.
---

# looptasksv2 — nhặt task từ file, giao LANE CODEX làm, mark done

Bản kế thừa `looptasks`. Mọi thứ về **state machine, lock, verifier, git, bookkeeping giữ
nguyên** — chỉ đổi **ai viết code** và thêm phần **dọn workspace**.

> 📌 **Sửa 2026-08-20 sau một phiên đo thật.** Hook store của cmux đã chết nên `lane-status.sh`
> / `lane-watch.sh` không dùng được (Bước 0.0); lane giờ là **workspace** chứ không phải split
> (4.2); báo xong bằng **file report** chứ không phải watcher (5.1). Đừng khôi phục cách cũ vì
> nó "đúng theo tài liệu plugin" — nó đã được thử và đo là sai.

Đọc `looptasks` trước nếu chưa quen: v2 không lặp lại phần giải thích, chỉ ghi phần KHÁC.

## Khác `looptasks` ở đâu

| | `looptasks` | **v2** |
|---|---|---|
| Executor | subagent Sonnet (`Agent` tool) | **lane codex** trong pane cmux (fallback Sonnet) |
| Worktree | `isolation: "worktree"` — harness tự tạo | **tự `git worktree add`** |
| Biết khi nào xong | `Agent` return | **`Monitor` canh file `.lanes/report-<ID>.md`** (xem 5.1 — hook store của cmux HỎNG) |
| Đường về của report | text trả thẳng về main | **file `.lanes/report-<ID>.md`** — xem Bước 5 |
| Verify | verifier Claude chấm Sonnet (cùng họ) | verifier Claude chấm codex — **khác họ, mạnh hơn** |
| Cấm chạy git | câu trong brief | **sandbox chặn thật** — `.git` ngoài writable root |
| Dọn | harness tự | **phải tự đóng pane + gỡ worktree** |
| Quota | Claude | **codex** (verifier vẫn Claude) |

**dantt chốt 19/08:** v2 được chạy cả `/loop` nền, và **có** fallback Sonnet. Hai lựa chọn này
ngược khuyến nghị ban đầu (lane hợp với chế độ ngồi xem hơn), nên hai chỗ dưới đây phải làm chặt
hơn `looptasks`: **Bước 8 dọn pane** và **Bước 0.1 điều kiện fallback**. Chạy nền mà không dọn thì
sau vài iteration màn hình đầy pane chết; fallback mơ hồ thì không ai biết task vừa rồi ai làm.

---

## Bước 0 — Tiền kiểm (MỚI, bắt buộc, trước khi đọc task)

Hai thứ phải đúng, nếu không thì **không có lane** và cả skill này chỉ là `looptasks` chậm hơn.

```bash
command -v cmux                                   # cmux CLI
command -v codex                                  # codex CLI — phải là bản THẬT, không phải shim
```

| Thiếu cái gì | Làm gì |
|---|---|
| `cmux` không có | **fallback toàn bộ iteration** sang subagent Sonnet, log một dòng nói rõ |
| `codex` không có | fallback |

🔴 **`command -v codex` trả về path KHÔNG chứng minh codex chạy được.** cmux chèn một thư mục shim
(`$TMPDIR/cmux-cli-shims/<uuid>`) lên đầu `PATH`; shim đó tự đi tìm codex thật và báo
`Error: codex not found in PATH` nếu không có. Đã mất một phiên vì tin `command -v`. Kiểm bằng
`codex --version` — phải in `codex-cli <version>`, exit 0.

Bản đúng là npm standalone (`npm i -g @openai/codex`). Binary nằm trong app bundle của ChatGPT
**không** dùng được từ shell.

### 0.0 · 🔴 Hook store của cmux ĐÃ CHẾT — đừng dựa vào nó

Đo 2026-08-20, cmux `0.64.22`. **cmux không export `CMUX_SURFACE_ID`** vào bất kỳ shell nào (kể cả
surface gốc của user); nó export `CMUX_TAB_ID`, `CMUX_TERMINAL_LIFECYCLE_ID`, `CMUX_WORKSPACE_ID`.
Mà **mọi** hook script codex ở `~/.cmux/hooks/*.sh` mở đầu bằng `[ -n "$CMUX_SURFACE_ID" ]`.

Ba hệ quả, đều đã đo:

- `~/.cmuxterm/codex-hook-sessions.json` không sinh ra → `lane-status.sh` báo *"no store found"*.
- `cmux codex-teams` báo `must be started from a cmux terminal surface` **ngay trong pane cmux thật**.
- Tự set `CMUX_SURFACE_ID=<uuid>` thì store **có** sinh ra nhưng **ghi sai**: `surfaceId`/`workspaceId`
  trỏ về surface của session Claude đang gọi lệnh, chỉ `cwd` đúng — vì pane tạo bằng `cmux` CLI
  **thừa kế env của shell gọi lệnh**. Dùng `env -u ... cmux workspace create --command ...` để cmux
  tự spawn thì **không sinh entry nào**.

→ **`lane-status.sh` và `lane-watch.sh` không dùng được.** Đường thay thế đã kiểm chứng chạy: lane
ghi `.lanes/report-<ID>.md` làm hành động cuối, main agent canh chính file đó (Bước 5.1).

⚠️ Đây **không** phải lý do fallback sang Sonnet — lane codex vẫn chạy tốt, chỉ là cách biết nó xong
thì khác. Hôm nào cmux sửa (`CMUX_SURFACE_ID` xuất hiện trở lại trong `env`), quay lại dùng plugin.

### 0.1 · Khi nào được fallback về Sonnet — danh sách ĐÓNG

Fallback chỉ cho **lỗi hạ tầng**, không bao giờ cho **lỗi nội dung**:

| Tình huống | Fallback? |
|---|---|
| Tiền kiểm Bước 0 fail (`cmux` hoặc `codex --version` fail) | ✅ cả iteration |
| Probe (Bước 4.3) fail **2 lần liên tiếp** trên cùng task | ✅ riêng task đó |
| `read-screen` cho thấy codex kẹt ở prompt hỏi mà `send-key Enter` không gỡ được | ✅ riêng task đó |
| Store/`lane-status.sh` không hoạt động | ❌ **không fallback** — đã biết trước, xem 0.0 |
| Đã có ≥4 workspace lane đang sống | ❌ **không fallback** — hoãn task sang iteration sau, trả `[⏳]` về `[ ]` |
| Verifier trả `FAIL` | ❌ **không fallback.** Lỗi nội dung — giao lại đúng một vòng cho **chính lane đó** như `looptasks` |
| Lane chạy chậm | ❌ không fallback. Chờ, hoặc để timeout xử |

🔴 **`pgrep -x codex` KHÔNG dùng để xác nhận lane sống.** Máy có sẵn process tên đúng `codex` không
thuộc lane nào (đo được 3 process lúc không có lane nào chạy), và với 4 lane song song thì +1 không
nói được cái nào là của bạn. Bằng chứng lane sống là **probe file** (4.3) + `read-screen` (4.4).

🔴 **Fallback phải LOG.** Ghi vào tóm tắt dưới task: `executor: sonnet (fallback — <lý do>)` hoặc
`executor: codex lane <ID>`. Không ghi thì hai tuần sau không ai biết task đó ai làm, và không đo
được lane có đáng dùng không.

### 0.2 · Đường dẫn script của plugin

Plugin `cmux-workflow` hiện **không dùng được cho lane codex** (xem 0.0). Nếu cần nó cho việc khác,
version nằm trong path nên đừng hardcode — và nó có thể nằm ở `marketplaces/` chứ không phải `cache/`:

```bash
CW=$(find ~/.claude/plugins -maxdepth 6 -name lane-status.sh 2>/dev/null | head -1)
CW="${CW%/skills/cmux-orchestration/lane-status.sh}"
```

### 0.3 · Nhặt lane mồ côi TRƯỚC khi nhận task mới

Chạy nền nghĩa là iteration trước có thể đã chết giữa chừng. **Lệnh đầu tiên của mọi iteration:**

```bash
cmux tree --all                     # workspace lane nào còn sống?
git worktree list                   # worktree nào còn?
ls ~/cmux/worktrees/*/*/.lanes/report-*.md 2>/dev/null    # lane nào đã ghi report?
```

Đối chiếu với `[⏳]` trong file task:

| Tình trạng | Làm gì |
|---|---|
| có `report-<ID>.md` mà task vẫn `[⏳]` | iteration trước chết trước khi verify → **vào thẳng Bước 6**, đừng dispatch lại |
| workspace còn, chưa có report, lock **chưa** quá 90 phút | đang chạy thật → **bỏ qua task đó**, đừng cướp |
| workspace mất / lock quá 90 phút mà không có report | lane chết → trả `[⏳]` về `[ ]`, đóng workspace, gỡ worktree, ghi lý do dưới task |
| workspace còn mà không ứng với `[⏳]` nào | rác → đóng |

Bỏ bước này thì lane xong nằm im vô thời hạn.

---

## Bước 1 — Đọc file, lọc task

**Giống `looptasks` hoàn toàn.** Tối đa 4 task/lượt · ưu tiên `[P0]` → `[P1]` → không nhãn ·
`[⏸️]` bỏ qua · lock `[⏳ HH:MM]` 90 phút · quá 90 phút là mồ côi **nhưng phải kiểm agent còn sống
trước** (v2: kiểm bằng Bước 0.3 — `cmux tree` + file report, không phải `ListAgents`).

Trần 4 giữ nguyên, lý do đổi: không phải trần agent nữa mà là **4 pane còn đọc được**. Nhiều hơn
thì mỗi pane hẹp tới mức không ai đọc nổi, và lợi ích "nhìn thấy" biến mất.

## Bước 2 — Xác định task nào chạy song song được

**Giống `looptasks` hoàn toàn.** Mặc định song song. Không chắc ⇒ **vẫn song song, worktree bắt
buộc**. Chỉ **bằng chứng va chạm** mới ép tuần tự.

Số đo 30 ngày trong `looptasks` (622 `Agent` call · **0** fan-out thật · **0** worktree) là lý do
quy tắc này tồn tại — đừng đảo lại vì "cho an toàn".

## Bước 3 — Nhận task

**Giống `looptasks`.** Mark `[ ]` → `[⏳ HH:MM]` **trước khi** dựng pane. Dựng trước thì iteration
khác cướp task trong lúc mình đang `git worktree add`.

---

## Bước 4 — Dựng lane (thay cho "giao subagent")

Mỗi task: **một worktree + một nhánh + một pane**.

### 4.1 · Worktree

```bash
WT_ROOT="$HOME/cmux/worktrees/$(basename "$(git rev-parse --show-toplevel)")"
mkdir -p "$WT_ROOT"
git fetch origin
git worktree add "$WT_ROOT/<slug>" -b <type>/<slug> origin/master
mkdir -p "$WT_ROOT/<slug>/.lanes/tmp"
```

🔴 **Worktree phải nằm NGOÀI repo.** Đặt trong repo (`<repo>/.worktrees/…`) làm mọi CLI quét-cả-cây
thấy config trùng và **từ chối khởi động**, báo lỗi trỏ vào file người dùng chưa hề đụng.

🔴 **Worktree mới trông giống repo nhưng KHÔNG chạy được.** `git worktree add` chỉ cho file tracked.
Bốn thứ thiếu, xếp theo mức độ khó phát hiện:

| Thiếu | Hỏng kiểu gì |
|---|---|
| `.env*`, credential | lỗi thật thà nhất: "config not found" |
| config mang **ID do server cấp** | không lỗi — **tạo trùng resource trên remote** thay vì update |
| `node_modules` | module-not-found, hoặc lane tự viết tay lại thư viện thiếu |
| build output runtime trỏ vào | 🔴 tệ nhất: stack báo "healthy", HTTP 200, mọi handler chết |

→ Chạy setup script idempotent của repo ngay sau khi tạo. Không có thì liệt kê ứng viên:

```bash
git status --ignored --porcelain | grep '^!!' | head -40
```

Ghi vào brief lane những gì **chưa** dựng được, để nó biết cái gì đỏ không phải lỗi nó.

### 4.2 · Workspace (KHÔNG phải split)

```bash
cmux workspace create --name "<lane-ID> <slug>" --cwd "$WT_ROOT/<slug>"
# → OK workspace:M      rồi lấy surface: cmux tree --all
```

🔴 **Mỗi lane là một WORKSPACE riêng, không phải `cmux new-split`.** Sidebar của cmux chỉ liệt kê
**workspace**; lane dựng bằng `new-split` nằm chìm trong workspace "Terminal" nên **user không có
mục nào để bấm vào** — mất đúng thứ khiến ta chọn lane thay vì subagent: nhìn thấy được.

Tên đặt bằng **lane ID** (`T7 cache-key`), không phải mô tả: ID là thứ `BRIEF.md`, commit message và
tóm tắt đều dùng.

🔴 **Ref bị đánh số lại mỗi lần create/close.** Đừng nhớ `surface:N` qua nhiều bước — lấy lại bằng
`cmux tree --all --id-format both` và **giữ UUID**, ref chỉ dùng ngay tại chỗ. Lane ở workspace khác
thì mọi lệnh sau đó phải mang `--workspace`, nếu không fail `not_found`.

### 4.3 · Probe — bắt shell chứng minh nó đang đọc

```bash
cmux send --surface surface:N "touch $WT_ROOT/<slug>/.lanes/tmp/probe-<ID>"
cmux send-key --surface surface:N Enter
ls "$WT_ROOT/<slug>/.lanes/tmp/probe-<ID>"          # PHẢI có
```

🔴 Probe **trong worktree**, không phải `/tmp` — sandbox `workspace-write` không ghi ra ngoài được.
Không thấy file ⇒ đóng pane, dựng lại. Lần hai vẫn không ⇒ **fallback Sonnet** (Bước 0.1).

### 4.4 · Dispatch — MỘT câu trỏ vào brief

```bash
cmux send --surface surface:N 'cd <WT> && codex -s workspace-write -a never --strict-config \
  -m gpt-5.6-sol -c model_reasoning_effort=high \
  -c sandbox_workspace_write.network_access=true \
  "Lane <ID>. Read .lanes/brief-<ID>.md and follow it."'
cmux send-key --surface surface:N Enter

cmux read-screen --surface surface:N --lines 20   # PHẢI thấy hoạt động, KHÔNG phải câu hỏi
```

🔴 **Worktree mới làm codex hỏi trust và `-a never` KHÔNG chặn prompt đó**:

```
Do you trust the contents of this directory? › 1. Yes, continue   2. No, quit
```

Probe vẫn pass, process vẫn tồn tại — lane trông y hệt lane đang làm việc trong khi nó **ngồi im vô
hạn**. Gỡ bằng `cmux send-key --surface surface:N Enter` (option 1 đã chọn sẵn). Vì vậy `read-screen`
sau dispatch là **bắt buộc**, không phải tuỳ chọn.

🔴 **Xong một turn, TUI codex VẪN MỞ.** Mọi `cmux send` sau đó sẽ bị codex **nuốt làm prompt** thay vì
chạy trong shell — bạn tưởng mình chạy lệnh, thực ra vừa giao cho nó một task mới. Muốn quay lại shell:

```bash
cmux send-key --surface surface:N ctrl+c      # gửi 2 lần, cách nhau ~1s
```

Đây là lý do report phải qua **file** (5.2): file không phụ thuộc trạng thái TUI.

🔴 **Message NHIỀU DÒNG gửi vào lane bị nuốt IM LẶNG.** `cmux send --surface surface:N "<nhiều
dòng>"` rồi `send-key Enter` → newline bị TUI hiểu là **xuống dòng trong ô prompt**, không phải
submit. Message nằm im, lane không bao giờ đọc, và màn hình vẫn hiện tóm tắt `• Hoàn tất ...` +
`Worked for Xm` của **turn trước** — nhìn y hệt lane vừa làm xong việc mới.

Đã xảy ra thật (24/08, repo subscriptions, lane T31): verifier trả FAIL, gửi ~20 dòng hướng dẫn
sửa, lane không nhận. Suýt commit một bug **tính sai chu kỳ giao hàng** vì tin dòng "18/18 suite,
gates xanh" trên màn hình.

Cách đúng:

```bash
# 1 dòng duy nhất — cần ngắt ý thì dùng ". " hoặc ";", KHÔNG dùng newline thật
cmux send --surface surface:N 'FAIL tu verifier. Loi: <...>. Sua: <...>. Chay lai gate.'
cmux send-key --surface surface:N Enter

# hướng dẫn dài ⇒ ghi file trong worktree rồi trỏ vào, vừa tránh newline vừa không giới hạn độ dài
cmux send --surface surface:N 'Doc .lanes/fix-<ID>.md va lam theo.'
```

**Gửi xong PHẢI verify lane thật sự nhận** — đừng đọc dòng tóm tắt:

```bash
stat -f %m <file lane phải sửa>     # mtime có mới hơn thời điểm gửi không?
cmux read-screen --surface surface:N --lines 20   # có thấy NỘI DUNG message mình vừa gửi không?
```

Không thấy message của mình trên màn hình ⇒ **chưa nhận**, gửi lại. Dấu hiệu bị nuốt: prompt
trống + `Worked for Xm` + tóm tắt khớp turn cũ + file không đổi.

**Model + effort pin explicit, đừng thừa kế config default.** `--strict-config` bắt **sai tên key**,
**không** bắt sai giá trị: `model_reasoning_effort=bogus` chạy bình thường rồi im lặng rơi về default
provider. Đọc lại dòng `reasoning effort: <value>` codex tự in ra.

Effort chọn theo **blast radius**, không theo độ khó cảm giác:

| Effort | Dùng cho |
|---|---|
| `high` | **mặc định.** Feature thường, sửa bug, việc cần theo convention repo |
| `xhigh` | **không đảo ngược được, hoặc tính toán chạm tới khách** — migration, mọi thứ tính tiền/tỉ lệ/mẫu số, adversarial review |

Repo `subscriptions` dính billing ⇒ task nào chạm tiền là `xhigh`.

⚠️ **Đừng nâng effort để bù cho brief mơ hồ.** Effort mua sự cẩn thận; **acceptance criteria mua sự
đúng**. Một lane `xhigh` từng làm đúng y brief và vẫn lọt regression, vì brief nêu điều cấm mà
không nêu cách kiểm.

### 4.5 · Brief của lane — file `.lanes/brief-<ID>.md` trong worktree

```markdown
# Lane <ID> — <một dòng>

## Files You May Edit
<đường dẫn>
Lane <khác> đang giữ <path> — không đụng.
Cần file ngoài phạm vi ⇒ ghi vào `## Blocked On`, đừng tự sửa.

## Problem
<bằng chứng cụ thể: file:line, output query, số đo — không phải mô tả chung chung>

## Direction
<ràng buộc thiết kế, bẫy đã biết, tiền lệ có sẵn trong repo>

## Acceptance Criteria
- [ ] <máy kiểm được, không phải "đã fix">

## Gate của repo
<DÁN NGUYÊN VĂN khối gate từ đầu BRIEF.md, kèm mọi cảnh báo>

## Dữ liệu thật — ĐƯỢC ĐỌC, KHÔNG ĐƯỢC GHI
Cho phép: SELECT trên BigQuery · .get()/.where() trên Firestore · API dạng đọc.
Cấm: .set() .update() .delete() .add(), batch/transaction write, CREATE/INSERT/UPDATE/DELETE,
mọi script migration hay backfill — KỂ CẢ script bạn vừa viết trong task này. Viết xong để đó.
Mọi query có chạy: ghi câu query nguyên văn + lý do vào report.

## Before You Report Done
<lệnh test chính xác> · MUST viết test · KHÔNG `git add -A`
Ghi report vào `.lanes/report-<ID>.md` — xem mục dưới.
```

#### 🔴 Bốn luật viết brief

**1. Brief dài là CHI PHÍ, không phải sự cẩn thận.** Context giúp *bạn* nghĩ; với executor, quá
nhiều context làm nó **đọc thay vì làm**. Một brief bắt đọc 4 tài liệu trước khi viết dòng đầu →
lane chạy **16 phút, ra 0 file**, không trả lời. Viết lại còn **41 dòng / 6 ràng buộc cứng**, kết
bằng *"Đừng đọc PLAN.md hay architecture.md — mọi thứ cần đã ở trên."*

Brief mang **kết luận**, không mang lý lẽ dẫn tới kết luận:

```
❌ ba đoạn giải thích RLS tắt ở đâu, policy nào đọc setting nào, vì sao an toàn
✅ "JOIN trong workspaceForAuthUser là tuyến phòng thủ duy nhất. Đừng làm yếu nó."
```

Ngoại lệ: lane **audit/khảo sát** cần đủ context, vì deliverable của nó *là* phán đoán.

**2. "Files You May Edit" suy từ ACCEPTANCE CRITERIA, không từ chỗ phát hiện bug.** Sai 4 lần
trong một ngày. Điển hình: viết tiêu chí *"hai trang phải đọc cùng một nguồn"* rồi chỉ cấp quyền
sửa một trang. Hỏi trước khi liệt kê: *tiêu chí này đòi chạm vào những gì?*

**3. Lane trong worktree KHÔNG commit được — và phải ghi LÝ DO.** `.git` là file trỏ ngược về repo
chính; `index.lock` và object store nằm ngoài writable root của `-s workspace-write` nên `git add`
bị chặn trước cả khi stage. Chỉ viết "đừng commit" thì lane tưởng gặp lỗi môi trường và đi tìm
đường vòng: `git add -A`, `git stash`, đổi `--git-dir`, ghi thẳng vào `.git`.

Viết thẳng: *"Việc của bạn nằm nguyên trên đĩa. Không commit thì không mất gì. Main agent sẽ commit
đúng danh sách path bạn báo."*

⚠️ **Đừng mở `--add-dir <repo>/.git` để lách.** Nó cấp quyền ghi vào git metadata **dùng chung cho
MỌI worktree** — một lane hỏng là dời được ref `master`.

**4. Ba câu lane sẽ bỏ qua nếu không nói thẳng:**
- `MUST viết test` — lane sửa đúng mà không viết test là chuyện thường; suite đứng yên và
  orchestrator phải bịa ra sau.
- `git add` **chỉ đúng các path trong Files You May Edit, liệt kê từng cái** — `No git add -A` một
  mình **không đủ**: nó nói điều không được làm mà không nói phải làm gì. Đã xảy ra thật: 4 lane
  song song, lane typography `git add -A` **quét sạch** việc của 2 lane khác vào một commit tên
  *"define typography tokens"* — không mất việc, nhưng 3 lane nằm trong một commit không review nổi,
  không revert lẻ được, và 2 lane kia thấy `git status` sạch nên tưởng mình chưa làm gì.
- **Bẫy môi trường** — port bị chiếm, biến môi trường, lệnh chính xác phải chạy. Lane không đoán
  được và sẽ đốt một vòng để tự khám phá.

### 4.6 · Dispatch cả nhóm rồi mới sang Bước 5

Nhiều task song song thì dựng hết pane rồi mới arm watcher — **một watcher cho cả nhóm**, không
phải mỗi lane một watcher rồi chờ lần lượt.

---

## Bước 5 — Watcher + đường về của report

### 5.1 · Arm watcher NGAY sau khi dispatch

`lane-watch.sh` **không dùng được** (Bước 0.0 — nó đọc hook store đã chết). Thay bằng `Monitor` canh
đúng file report của từng lane:

```
Monitor: file .lanes/report-<ID>.md xuất hiện trong <WT>, persistent: true
```

Một `Monitor` cho cả nhóm lane nếu canh được nhiều path; không thì mỗi lane một cái, arm **một lần**
ngay sau khi dispatch cả nhóm. Event về dưới dạng `<task-notification>` và đánh thức bạn.

Không có `Monitor` thì dùng `Bash` với `run_in_background: true` chạy vòng lặp chờ file xuất hiện —
background exit sẽ gọi lại bạn. Kèm mốc hết hạn 90 phút khớp ngưỡng lock ở Bước 1; **timeout là một
kết quả phải report**, không phải lỗi im lặng.

| ❌ Không hoạt động | Vì sao |
|---|---|
| `sleep 60 && check` foreground | harness chặn, kể cả nối nhiều sleep ngắn |
| "lát nữa tôi check lại" | không có "lát nữa" — turn kết thúc, lane chạy tiếp, không gì gọi bạn dậy |
| đọc lại màn hình mỗi tool call | đốt cả turn để poll, vẫn miss cái xong sau khi bạn ngừng |
| `lane-status.sh` / `lane-watch.sh` | đọc hook store — **store không bao giờ sinh ra**, xem 0.0 |

### 5.2 · 🔴 Report phải qua FILE, không qua màn hình

Đây là chỗ v2 dễ hỏng nhất và không hiển nhiên.

`Agent` tool trả text thẳng về main agent. **Lane thì không** — report nằm trên pane, và
`read-screen` chỉ lấy N dòng cuối nên **sẽ cắt mất danh sách file**. Bước 6 cần danh sách đó cho
verifier; Bước 7 cần nó để `git add`. Mất danh sách = mất file, và bạn chỉ phát hiện lúc mở MR.

Brief bắt lane ghi `.lanes/report-<ID>.md`:

```markdown
## Files touched
<mỗi path một dòng, đường dẫn tương đối repo — main agent sẽ `git add` ĐÚNG danh sách này>

## What I did
<cách làm, và LÝ DO chọn cách đó>

## Gate results
<lệnh nào chạy, exit code, số suite/test trước-sau>

## Queries run
<mọi query chạm dữ liệu thật: câu query nguyên văn + lý do. Không chạy cái nào thì ghi "none">

## Blocked On
<thứ cần mà ngoài phạm vi. Không có thì ghi "none">
```

Watcher exit → đọc file này, **không** `read-screen` để lấy nội dung. `read-screen` chỉ dùng để
chẩn đoán lane kẹt.

Không có file report ⇒ coi như lane chưa xong: `read-screen` xem nó chết hay đang hỏi, xử theo
Bước 0.3.

---

## Bước 6 — Verify

**Giao agent `verifier`** (`~/.claude/agents/verifier.md`), y như `looptasks`: context sạch, không
Edit/Write, chạy done-criteria thật, trả verdict kèm bằng chứng.

### 6.0 · Chuẩn bị TRƯỚC khi spawn — hai thứ bắt buộc

Đo trên 242 lần verify thật (bóc tách được 76, 18–20/08/2026): median **6,6 phút · 74 lượt model ·
37 Bash call**,
**68% thời gian là round-trip model** chứ không phải lệnh chạy, và **74% số call là đi đọc lại
code** (`cat`/`sed -n`/`grep`/`git diff`). Verifier chậm vì phải **tự khám phá lại thứ bạn đã
biết**. Hai thứ dưới đây cắt phần đó; chúng **không** làm verifier bớt độc lập.

**a) Dán sẵn diff đầy đủ vào brief** — output máy, không phải lời lane:

```bash
cd "$WT_ROOT/<slug>" && git status --porcelain && echo '--- DIFF ---' && git diff
```

Diff dài quá thì ghi ra `.lanes/diff-<ID>.patch` và đưa **đường dẫn tuyệt đối** (một `cat` là xong),
đừng để verifier tự dựng lại từng file.

**b) Viết `gate-<ID>.sh` trong worktree** — gộp cả khối gate của repo vào MỘT lệnh:

```bash
cat > "$WT_ROOT/<slug>/.lanes/gate-<ID>.sh" <<'EOF'
#!/usr/bin/env bash
# thứ tự cố định: typecheck → build → test → lint. Không dừng ở lỗi đầu — chấm hết rồi báo.
set -u; cd "$(dirname "$0")/../.."; rc=0
run(){ echo "=== $* ==="; "$@"; c=$?; echo "--- exit $c"; [ $c -ne 0 ] && rc=1; }
run <lệnh typecheck của repo>
run <lệnh build>
run <lệnh test>
run <lệnh lint>
echo "=== GATE EXIT $rc ==="; exit $rc
EOF
chmod +x "$WT_ROOT/<slug>/.lanes/gate-<ID>.sh"
```

Lệnh lấy **nguyên văn từ khối gate đầu `BRIEF.md`**, đừng tự chế. Repo không có gate rõ ràng thì
**đừng bịa script** — ghi thẳng vào brief là chưa có, để verifier tự suy ra và tự khai trong báo cáo.

Brief cho verifier:

- Mô tả task **nguyên văn** + done-criteria
- **Đường dẫn tuyệt đối của worktree** + câu: *"`cd` không persist giữa các Bash call, mọi lệnh
  phải viết `cd <path> && <lệnh>` trong cùng một call"*
- **Đường dẫn `gate-<ID>.sh`** + câu: *"chạy nó một call, đừng chạy tay lại từng lệnh"*
- **Diff** (hoặc đường dẫn `.patch`) + câu: *"đây là output của git, dùng thẳng — đừng `cat` lại
  từng file để xem đã sửa gì"*
- Danh sách file lấy từ `## Files touched` — **gắn nhãn "tuyên bố của lane, cần kiểm chứng"**
- **Kịch bản đáng nghi nhất**: "kiểm giúp X có làm hỏng Y không", "tự tay gỡ fix ra rồi chạy lại xem
  test có đỏ không". Bảo verifier **tự làm lại thí nghiệm**, đừng tin số lane báo

🔴 **Đừng cắt nhầm chỗ.** Cấp sẵn diff + gate là cắt phần *đi tìm lại*. Phần *tự nghĩ ra thí nghiệm*
là lý do verifier tồn tại — brief phải đòi nó nhiều hơn, không phải ít hơn.

Nhiều task cùng xong → spawn các verifier trong **một message**. Verify **task nào xong task đó**,
đừng chờ cả lô.

### 6.1 · Ba thứ verifier làm, và một thứ CHỈ BẠN làm

| # | Ai | Việc |
|---|---|---|
| 1 | verifier | Chạy gate thật, đọc exit code, đối chiếu baseline trong khối gate |
| 2 | verifier | **Đếm số test.** Brief đòi test mà số không tăng ⇒ lane bỏ qua, bất kể nó nói gì |
| 3 | verifier | Lấy một tuyên bố bất kỳ trong report, tự kiểm lại |
| 4 | **bạn** | 🔴 **Mở trang ra / chạy query, nhìn con số thật** |

Mục 4 không ủy quyền được. Trong session gốc của Thomas, **mọi defect nghiêm trọng đều tìm ra bằng
cách mở trang ra nhìn** — typecheck xanh, test xanh, smoke xanh, con số trên màn hình vẫn sai.
Verifier chạy gate; nó không mở browser.

Task không có UI (helper thuần, script) thì mục 4 là **chạy thật hàm đó với input thật** và đọc
output — không phải đọc test của nó.

### 6.2 · Verdict

| Verdict | Làm gì |
|---|---|
| `PASS` | commit vào nhánh của task → Bước 7 |
| `FAIL` | giao lại **đúng một vòng** cho **chính lane đó** (`cmux send` finding nguyên văn của verifier), verify lại. Vòng hai vẫn `FAIL` → blocker. Thêm vòng phải **hỏi user**. 🔴 **Không fallback sang Sonnet** — đây là lỗi nội dung, đổi executor giữa chừng làm mất mạch và không ai biết code cuối là của ai |
| `UNVERIFIED` | **không phải pass.** Chạy lại nếu là lỗi môi trường nhất thời; vẫn `UNVERIFIED` → blocker |

**Finding ngoài scope** → verifier liệt kê `file:line`, main agent **thêm thành task mới trong
`BRIEF.md`** kèm nguyên văn. Đừng cho sửa lén: phình diff, phá tính surgical, phần thêm không ai
kiểm. Ngoại lệ duy nhất: finding đó **chặn chính task đang làm**.

---

## Bước 7 — Commit + đóng task

Chỉ khi `PASS`. **Main agent commit, không phải lane** (lane bị sandbox chặn).

```bash
cd "$WT_ROOT/<slug>"
git status --short
ls .git/MERGE_HEAD .git/CHERRY_PICK_HEAD .git/REBASE_HEAD .git/REVERT_HEAD 2>/dev/null
git add <path1> <path2> …          # ĐÚNG danh sách trong `## Files touched`, từng cái một
git commit -m "<type> - <role> - <scope>"
git push -u origin <nhánh>
```

🔴 **`git add` từng path, không bao giờ `-A`.** Lane khác đang có việc trên đĩa của worktree khác,
nhưng người dùng cũng có thể đang sửa dở ở repo chính — và một path thiếu trong report là một file
mất khỏi commit.

Có `MERGE_HEAD`/`REBASE_HEAD`… ⇒ **user đang dở việc**. Không tự `--abort`, không tự đóng. Giữ
`[⏳]`, ghi vào `BRIEF.md` là code xong nhưng chưa commit được vì lý do gì, report user.

Rồi:

1. `[⏳ HH:MM]` → `[✅ YYYY-MM-DD]`
2. Tóm tắt indent dưới task: **tên nhánh + commit hash ngắn** · `executor: codex lane <ID>` hoặc
   `executor: sonnet (fallback — <lý do>)` · file đã sửa · **gate nào chạy + exit code** · kết quả
   mục 6.1 #4 (bạn đã mở cái gì ra nhìn, thấy gì)
3. `CHANGELOG.md`: **chỉ ghi nếu file đó thật sự là log thay đổi nội bộ.** Là release-note theo
   version → bỏ qua, nói rõ lý do khi report
4. Report user

**Blocker** → ghi verdict + finding nguyên văn dưới task, `[⏳]` về `[ ]`, **không mark done**.

**Task đóng mà không có commit** (điều tra ra kết luận "không phải bug code" · task là câu hỏi/làm
rõ spec · task ra tài liệu): vẫn `[✅]`, vẫn **bắt buộc ghi cái gì đã gỡ / cái gì còn nguyên**.
Hai loại đầu không cần gate nhưng **vẫn cần verifier kiểm các tuyên bố dạng `file:line`** — kết
luận điều tra sai mà đóng task thì tệ hơn không làm, nó khoá luôn hướng nghĩ đúng.

---

## Bước 8 — DỌN (MỚI, bắt buộc, không được bỏ)

`Agent` tool tự dọn worktree; **lane thì không**. Chạy nền mà bỏ bước này thì sau vài iteration
màn hình đầy pane chết và đĩa đầy worktree mồ côi.

Với **mọi** task vừa đóng (`PASS` hay blocker đều dọn):

```bash
git -C "$WT_ROOT/<slug>" status --porcelain      # PHẢI rỗng trước khi gỡ
cmux workspace close workspace:M                 # KHÔNG phải close-surface
git worktree remove "$WT_ROOT/<slug>"
```

Thứ tự: **kiểm sạch → đóng workspace → gỡ worktree**. Đảo thứ tự là có ngày gỡ mất việc chưa commit.

⚠️ `cmux close-surface` trên surface cuối cùng của một workspace fail với
`invalid_state: Cannot close the last surface` — lane là workspace riêng nên **luôn dùng
`cmux workspace close`**.

`git status` **không** rỗng ⇒ còn việc chưa commit ⇒ **đừng gỡ**. Ghi vào `BRIEF.md`, giữ worktree,
report user. Nhánh vẫn sống sau khi gỡ worktree — gỡ worktree không xoá nhánh.

Cuối iteration, chốt lại một lần:

```bash
cmux tree --all          # còn workspace lane nào không nên còn?
git worktree list        # còn worktree nào mồ côi?
```

## Bước 9 — Housekeeping BRIEF

**Giống `looptasks`.** Task `[✅ YYYY-MM-DD]` quá **3 ngày** → cắt sang `BRIEF-done.md`, giữ nguyên
tóm tắt indent, nhóm theo ngày. `[✅]` không ngày → để nguyên, không đoán. Không có gì đủ điều kiện
→ bỏ qua im lặng, đừng tạo file rỗng.

---

## Git — nhánh, base, MR

**Giống `looptasks` hoàn toàn.** Tóm tắt phần dễ sai:

- `git fetch` **trước** rồi mới base từ `origin/master` (kiểm tên bằng
  `git symbolic-ref refs/remotes/origin/HEAD`, đừng đoán). `master` local rất hay cũ hơn remote
- Không bao giờ làm việc thẳng trên `master`/`main`
- **Một task = một nhánh**, TRỪ KHI nhiều task cùng một ticket/feature → chung một nhánh, mỗi task
  một commit riêng. Cách phân biệt: **hỏi "cái này ra mấy MR?"** Một MR → một nhánh
- **Commit và push tự động được** (dantt duyệt 07/08), miễn không phải `master`/`main`.
  **Tạo MR thì luôn phải hỏi**
- Message repo Avada: `type - role - scope`
- **File task ở brain thì KHÔNG commit** — `brain-sync` 20:00 tự lo

---

## Nguyên tắc

- **Main agent không viết code, không tự chấm.** Orchestrate + git + bookkeeping. Code do lane
  codex làm, chấm do `verifier` làm — khác model family, đó là điểm mạnh của v2 so với `looptasks`.
- **Trừ đúng một việc: mục 6.1 #4 là của BẠN.** Mở trang, nhìn số. Không ủy quyền.
- **Idempotent.** `[✅]` bỏ qua tuyệt đối. Lock có timestamp lo `[⏳]`. Lane mồ côi do Bước 0.3 lo.
- **Không tự thêm task, không mở rộng scope.**
- **Surgical.** Mỗi thay đổi trace được về đúng một task, và mỗi task trace được về đúng một lane ID.
- **Fallback phải log.** Không log thì không đo được lane có đáng dùng không, và cả v2 thành mê tín.

## Chạy định kỳ

Giống `looptasks`: `/loop 5m /looptasksv2 <file>`, hoặc `CronCreate` `*/5 * * * *` với prompt
`/looptasksv2 <file>`. Gọi trực tiếp thì **không tự tạo cron**.

⚠️ **Chạy nền có cái giá riêng.** Lane sinh ra để bạn **nhìn và chặn được**; `/loop` nền thì không
ai nhìn. dantt đã chốt cho phép (19/08), nên cái còn lại là **Bước 8 phải chạy đủ mọi iteration**.
Thấy workspace tồn đọng trên sidebar hoặc `git worktree list` dài ra ⇒ Bước 8 đang bị bỏ, sửa ngay
chứ đừng dọn tay.

Nhịp mặc định **5 phút** — muốn đổi thì hỏi user. Iteration rỗng nhiều thì nới ngưỡng lock, đừng
giãn nhịp.
