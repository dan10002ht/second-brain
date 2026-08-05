---
type: note
title: Layer 4 — Loop
summary: Loop là một agent lặp một chu kỳ tới khi xong — cần điều kiện dừng, state bền và gate; giải phẫu /looptasks (BRIEF.md, lock ⏳ 30 phút, một task một nhánh, verifier độc lập) làm ví dụ sống.
tags: [ai, tooling, method, skills, patterns]
created: 2026-08-05
source: Anthropic "Building Effective Agents" (anthropic.com/engineering/building-effective-agents) + digest/decision trong brain
---

# Layer 4 — Loop

## Layer này là gì

Loop = **chu kỳ một agent lặp tới khi xong**. Vai của bạn: **system designer**.

Ở layer 1–3 bạn vẫn là người bấm nút mỗi vòng. Ở layer 4 bạn thiết kế cái vòng, rồi
đi làm việc khác.

Một loop dùng được cần đúng ba thứ. Thiếu bất kỳ cái nào là hỏng theo cách riêng:

| Thành phần | Thiếu thì sao |
|---|---|
| **Điều kiện dừng** | chạy mãi, đốt token, tự bịa việc |
| **State bền** | ngắt là mất hết, restart lại từ đầu |
| **Gate** | lặp lỗi nhanh hơn thôi |

## Khi nào bạn đang ở đây

- Bạn có một danh sách việc, mỗi việc na ná nhau
- Bạn đang ngồi canh agent để bấm "làm tiếp"
- Việc dài hơn một session và bạn phải kể lại từ đầu mỗi lần mở máy
- Bạn muốn "chạy tới khi output đạt chuẩn" chứ không phải "chạy một lượt"

## Use case — bốn loại loop và việc nào hợp loại nào

Ba loại đầu là pattern có tên trong bài *Building Effective Agents* của Anthropic;
loại thứ tư là cái team đang chạy.

### 1. Prompt chaining — chuỗi bước cố định, có check giữa các bước

Chia việc thành các bước **biết trước**, output bước này là input bước sau, chèn kiểm tra
bằng code ở giữa. Dùng khi việc **tách sạch được thành subtask cố định**.

| Ứng dụng | Chuỗi bước |
|---|---|
| Viết copy cho merchant | sinh tiếng Anh → gate kiểm không có tiếng Việt → rà thuật ngữ Shopify |
| Từ PRD ra code | trích requirement → check đủ ý → implement → verify |
| Sinh migration script | đọc schema cũ+mới → sinh script → dry-run → apply |

Đừng dùng khi bạn **không biết trước có mấy bước** — đó là loại 3.

### 2. Evaluator–Optimizer — sinh, chấm, sửa, lặp

Một agent sinh, một agent khác chấm, lặp tới khi đạt. Điều kiện dùng: **có tiêu chí chấm
rõ ràng** và **lặp lại thật sự làm output tốt lên**. Thiếu tiêu chí rõ thì vòng lặp chỉ
đổi qua đổi lại chứ không tiến.

| Ứng dụng | Tiêu chí chấm |
|---|---|
| Sinh câu hỏi thi (aws) | không trùng, đúng tỉ lệ blueprint, tiếng Việt có dấu |
| Viết email/notification cho merchant | tiếng Anh, đúng tone, dưới N ký tự |
| Tối ưu query chậm | thời gian chạy đo được, kết quả không đổi |

Bài học đã trả giá: **gate deterministic chạy trước evaluator LLM** — rẻ hơn nhiều lần
và không bịa ([[digest-aws-2026-07-24]]).

### 3. Autonomous loop — không đoán trước được số bước

Agent tự lặp đọc → sửa → chạy → đọc lỗi → sửa, tới khi gate xanh. Đây là loop mặc định
của Claude Code, hợp với **việc mở**: sửa bug, debug, làm feature trong repo có sẵn.

Điều kiện để nó không đi hoang: có **feedback thật từ môi trường** (exit code, test đỏ),
không phải model tự đánh giá mình.

### 4. Task-queue loop — hàng đợi việc trên đĩa (`/looptasks`)

Loại team đang dùng. Khác ba loại trên ở chỗ: **state nằm ngoài mọi context window**,
nên nó sống qua restart, chạy được bằng cron, và xử lý được hàng chục task rải nhiều ngày.

Hợp với: đống task nhỏ độc lập tồn đọng — sửa format, thêm log, đổi text, viết test còn
thiếu. Đúng loại việc không ai muốn làm nhưng cũng không tự biến mất.

### Khi nào KHÔNG dùng loop

- Việc một bước, nhìn phát biết đúng sai
- **Không có tiêu chí chấm** — loop không tiêu chí là đốt token có nhịp
- Việc cần người quyết ở giữa (chọn phương án, duyệt thay đổi kiến trúc). Cắt thành hai
  loop, chốt ở giữa

## Cơ bản

### Ba kiểu loop trong Claude Code

| Kiểu | Là gì | Dùng khi |
|---|---|---|
| **Agentic loop** (mặc định) | Claude tự lặp đọc → sửa → chạy → sửa trong một lượt | mọi task thường |
| **`/loop [interval] <prompt>`** | chạy lại một prompt theo chu kỳ, hoặc để model tự nhịp | cần checkpoint cho người xem giữa các phần |
| **Loop có state trên đĩa** (`/looptasks`) | đọc file task → làm → mark done → lặp | việc kéo dài nhiều ngày, nhiều phiên |

Chọn sai công cụ là lỗi có thật: muốn *tự động hết, không chờ người* mà dùng `/loop`
thì sai — cái đó là việc của Workflow. `/loop` hợp khi bạn **muốn** thấy checkpoint
([[digest-aws-2026-07-27]]).

### Giải phẫu `/looptasks` — loop đang chạy thật ở team

State nằm ở `BRIEF.md`, **ngoài repo code**:

```
~/projects/my-brain/10-projects/<tên-repo>/BRIEF.md
```

```markdown
1. [ ] fix format tiền ở export CSV
2. [⏳ 14:32] đang refactor webhook handler
3. [✅ 2026-08-04] thêm retry cho sync order
   - nhánh `fix/SB-14901-csv-money` · commit `a1b2c3d`
   - Sửa `app/utils/money.js`; verify: tsc exit 0, test pass
```

Vì sao để ngoài repo: repo team sạch, tự sync đa máy qua brain-sync, và **worktree
không bao giờ thấy file này** nên subagent không thể sửa/commit nhầm làm revert
trạng thái checkbox lúc merge.

Vòng chạy:

```
đọc file → lọc task chưa done → recon vùng file → chia song song/tuần tự
  → mark [⏳ HH:MM] → giao subagent (Sonnet) → verifier độc lập chấm
  → PASS:  commit vào nhánh của task + mark [✅ ngày] + changelog
     FAIL:  giao lại ĐÚNG MỘT VÒNG cho subagent sửa → verify lại
            vòng hai vẫn FAIL → blocker: trả [⏳] về [ ], ghi verdict, báo user
     UNVERIFIED: không được coi là pass — chạy lại, vẫn vậy → blocker
  → dọn task [✅] quá 3 ngày sang BRIEF-done.md
```

Nhánh `FAIL` **có đúng một vòng sửa**, không lặp vô hạn — đây là điều kiện dừng của loop
này. Không có nó thì task hỏng sẽ quay vòng mãi.

Bốn chi tiết đáng học, không phải chi tiết vặt:

**1. Lock có timestamp = mutex trên đĩa.** Loop 5 phút mà task chạy 8 phút thì iteration
sau fire khi trước chưa xong. `[⏳ HH:MM]` giải quyết: dưới 30 phút → đang chạy thật,
bỏ qua; quá 30 phút → mồ côi (loop trước bị ngắt), nhận lại.

**2. "Độc lập" phải xác định, không phán từ tiêu đề.** Với mỗi task, grep/glob ra vùng
file nó sẽ chạm. Không giao nhau → song song, mỗi agent một worktree. Giao nhau **hoặc
không xác định được** → tuần tự. Thiếu thông tin thì mặc định an toàn.

**3. Một task = một nhánh.** Nhánh chứa 10 task hỗn hợp thì review không nổi, revert một
việc là đụng chín việc kia. Hệ quả tốt: không còn bước merge về nhánh chung nên cũng
không còn conflict lúc gom.

Task **độc lập** thì mỗi nhánh base thẳng từ `origin/master`, không nối tiếp nhau.
Task **tuần tự vì đụng cùng file** thì chúng vốn liên quan về logic — hoặc gộp vào một
nhánh, hoặc stack nhánh sau lên nhánh trước và ghi rõ `depends on <nhánh>` trong tóm tắt.

**4. Commit tự động, push thì KHÔNG.** Loop chạy nền nên không hỏi trước từng commit
được; commit vào nhánh riêng là an toàn vì chưa ra khỏi máy. Nhưng push và tạo MR luôn
phải hỏi — đó là lúc việc ra khỏi máy và người khác nhìn thấy.

## Nâng cao

**Evaluator–Optimizer** — sinh → đánh giá → sửa → lặp tới đạt chuẩn. Pattern chuẩn cho
"chạy pipeline tới khi đầu ra đảm bảo". Điều kiện đủ: evaluator phải **độc lập** với
generator (xem [[ai-eng-03-harness]]).

**Loop-until-dry** — với việc không biết trước số lượng (tìm bug, tìm edge case), lặp tới
khi **K vòng liên tiếp không ra gì mới**. Đếm cứng (`while count < 10`) luôn bỏ sót phần đuôi.

**Loop tự nhịp nhiều phần** (`build-content-loop` ở aws): mỗi phần = 1 workflow nền →
task-notification tự gọi lại → checkpoint ghi file → tự phóng phần kế; ScheduleWakeup
làm phao dự phòng nếu treo. Resume được kể cả ở phiên mới.

**Hybrid là shape tối ưu cho việc dài**: Workflow chạy nền (fire-and-forget) + `/loop`
quét plan file để báo tiến độ realtime — bù đúng điểm yếu "không thấy gì đang xảy ra"
của Workflow.

**Mọi thao tác phải idempotent.** Wakeup dự phòng hay nổ muộn khi việc đã xong. Luôn kiểm
state thật (plan status, `git log`, checkbox) trước khi làm lại. `[✅]` phải được bỏ qua tuyệt đối.

## Setup — bật loop cho một repo

### 1. Tạo file task

Đặt ở brain, **ngoài repo code**:

```
~/projects/my-brain/10-projects/<tên-repo>/BRIEF.md
```

````markdown
# <tên repo> — BRIEF

<!--
  [ ] chưa làm · [⏳ HH:MM] đang chạy · [✅ YYYY-MM-DD] xong
  Task xong quá 3 ngày → tự dọn sang BRIEF-done.md
  Chạy (cwd = repo code, KHÔNG phải brain):
    /looptasks ~/projects/my-brain/10-projects/<tên-repo>/BRIEF.md
-->

1. [ ] fix format tiền ở export CSV
   - hiện đang ra `1000000`, cần `1,000,000 ₫`
   - chỗ khác dùng cùng helper thì sửa hết

2. [ ] thêm retry cho webhook orders/create
   - hiện fail là mất luôn, không retry
````

Mô tả càng cụ thể càng ít phải sửa lại. Dòng con là context cho subagent — viết ràng buộc
vào đó.

Ba điều về file này hay bị hiểu nhầm:

- **Đừng commit nó.** Cứ sửa và để đó — `brain-sync` 20:00 mỗi tối tự commit + push.
  Đừng commit brain giữa chừng chỉ để lưu một cái checkbox
- **Nó nằm ngoài graph wiki** — `brain-lint` bỏ qua mọi file tên `BRIEF*`. Nó là *state
  của loop*, không phải knowledge, và mọi project đều dùng cùng tên nên slug sẽ đụng nhau
- **Task list dùng chung với đồng đội là ngoại lệ**: để trong repo, trên nhánh feature.
  Lúc đó mất lợi thế "worktree không thấy file này" — bù lại đồng đội thấy được

### 2. Chạy

```
# cwd = repo code (để CLAUDE.md + settings của repo được nạp)
/looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF.md

# chạy lặp 5 phút, tự nhặt task mới
/loop 5m /looptasks ~/projects/my-brain/10-projects/subscriptions/BRIEF.md

# để model tự nhịp (không cố định interval)
/loop /looptasks <file>
```

Không truyền đường dẫn thì nó tự tìm theo thứ tự: `~/projects/my-brain/10-projects/<tên
thư mục cwd>/BRIEF.md` → `BRIEF.md` ở project root. Không thấy cái nào thì **hỏi bạn** —
không tự tạo file rỗng, không đoán.

Muốn nó chạy cả khi không mở Claude Code thì dùng cron thay vì `/loop`:
`*/5 * * * *` với prompt `/looptasks <file>`. Dừng: xoá cron.

### 3. Kiểm khi nó đang chạy

```
git branch -a | head        # loop tạo nhánh nào rồi
git log --oneline -10       # nó commit gì
cat <BRIEF.md>              # task nào [⏳], task nào blocker
```

Blocker được ghi thẳng dưới task kèm verdict nguyên văn của verifier — đọc chỗ đó
trước khi hỏi "sao nó không làm".

### 4. Cần chuẩn bị trước khi bật

- [ ] `CLAUDE.md` của repo có lệnh build/test đúng (loop dựa vào đây để verify)
- [ ] Có agent `verifier` — `/looptasks` gọi bản **global** `~/.claude/agents/verifier.md`.
      Repo cần bản riêng (lệnh test khác) thì đặt `.claude/agents/verifier.md` trong repo,
      nó sẽ được ưu tiên (xem [[ai-eng-03-harness]])
- [ ] Đã `git fetch` — loop base nhánh từ `origin/master`, base nhầm vào `master` local cũ
      là kéo theo cả đống diff không liên quan lúc tạo MR.
      Repo dùng `main` thì nó tự phát hiện bằng `git symbolic-ref refs/remotes/origin/HEAD`,
      không đoán theo tên

## Cạm bẫy

| Đừng | Nên thay bằng |
|---|---|
| Loop không có gate → lặp lỗi nhanh hơn, tự tin hơn | Gate mỗi vòng, verifier độc lập |
| State trong context window → ngắt là mất | State trên đĩa, sống qua restart |
| Không có điều kiện dừng → agent tự bịa việc khi hết task | Hết task thì report "no pending tasks" và **dừng**. Không mở rộng scope |
| Interval ngắn hơn thời gian task → hai iteration chồng nhau | Lock có timestamp + ngưỡng mồ côi |
| Gộp cả phiên loop vào một nhánh | Một task một nhánh, một MR |
| Để subagent chạy git — agent này `checkout` phá việc agent kia | Git do main agent làm tập trung; brief subagent ghi rõ **KHÔNG chạy git, KHÔNG sửa file task list** |
| `BRIEF.md` phình thành kho lưu trữ → mỗi iteration tốn công đọc lại thứ đã xong | Task xong quá 3 ngày cắt sang `BRIEF-done.md`, giữ nguyên tóm tắt |

## Checklist

Trước khi bật một loop:

- [ ] Điều kiện dừng là gì, viết ra được không?
- [ ] State ở đâu — đĩa hay context?
- [ ] Gate nào chạy mỗi vòng? Ai chấm?
- [ ] Interval so với thời gian một task — có chồng nhau không? Có lock chưa?
- [ ] Thao tác có idempotent không (chạy 2 lần có hỏng gì không)?
- [ ] Loop được phép commit không? Push không? (mặc định: commit có, push không)
- [ ] Khi blocker thì nó làm gì — dừng và báo, hay đoán bừa cho xong?

## Liên quan

- [[ai-eng-03-harness]] · [[ai-eng-05-graph]] · [[ai-eng-guide]]
- [[looptasks-vs-workflow]] — so sánh chi tiết loop vs workflow
