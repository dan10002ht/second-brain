---
name: looptasks
description: Nhặt task từ file task list (mặc định BRIEF.md của project), implement từng cái bằng subagent Sonnet 5, mark done, ghi changelog. Chạy song song các task độc lập. Dùng khi user muốn tự động xử lý một danh sách task, hoặc gọi qua /loop để lặp định kỳ tự nhặt task mới.
---

# looptasks — nhặt task từ file, giao subagent làm, mark done

Main agent **orchestrate + git + bookkeeping**, KHÔNG tự viết code và KHÔNG tự verify.
Code do subagent Sonnet 5 làm, chấm do agent `verifier` làm (context tách rời).

## Input

`args` = đường dẫn file task. **cwd vẫn là repo project** (để `CLAUDE.md` + settings của repo
được load) — chỉ file task là trỏ đi nơi khác.

Mặc định file task sống ở brain, **ngoài repo code**:

```
~/projects/my-brain/10-projects/<tên-repo>/BRIEF.md
```

Lý do: repo của team sạch, tự sync đa máy qua brain-sync, và **worktree không bao giờ thấy file
này** nên subagent không thể sửa/commit nhầm làm revert trạng thái checkbox lúc merge.

Không có args → thử `~/projects/my-brain/10-projects/<tên-thư-mục-cwd>/BRIEF.md`, rồi `BRIEF.md`
ở project root. Không thấy cái nào → **hỏi user, đừng đoán, đừng tự tạo file rỗng.**

`BRIEF.md` cố ý **nằm ngoài graph wiki** (`brain-lint` bỏ qua mọi file tên `BRIEF*`): nó là state
của loop, không phải knowledge, và mọi project đều dùng cùng tên nên slug sẽ đụng nhau.

Task list dùng chung với đồng đội thì là ngoại lệ: để trong repo, trên nhánh feature.

## Định dạng task

```markdown
1. [ ] làm xyz
2. [⏳ 14:32] đang làm abc
3. [✅ 2026-08-02] đã xong kkk
```

- `[ ]` / `[]` → chưa done, cần làm
- `[⏳ HH:MM]` → đang có agent nhận (xem mục Lock bên dưới)
- `[✅ YYYY-MM-DD]` / `[✅]` / `[x]` → xong, **bỏ qua**

Task có thể có dòng con (bullet, sub-detail) — đọc hết block thuộc task đó làm context.

---

## Bước 1 — Đọc file, lọc task

Liệt kê task chưa done. **Không còn task nào → report "no pending tasks" và dừng.**
Đang trong `/loop` thì chờ lần sau. **Tuyệt đối không tự bịa việc, không mở rộng scope.**

### Lock — chống hai iteration chồng nhau

Loop 5 phút mà task chạy 8 phút thì iteration sau sẽ fire khi trước chưa xong.
`[⏳ HH:MM]` là mutex trên đĩa, sống sót qua restart:

- `[⏳]` stamp **dưới 90 phút** → đang chạy thật → **bỏ qua task này**
- `[⏳]` stamp **quá 90 phút** → mồ côi (loop trước bị ngắt) → nhận lại, coi như chưa làm
- `[⏳]` **không có stamp** (format cũ) → coi là mồ côi

⚠️ **Trước khi coi một task là mồ côi, kiểm agent còn sống không** (`ListAgents`, hoặc `TaskList`
nếu có). Timestamp chỉ là phương án dự phòng khi mất trạng thái — agent còn chạy mà cướp task là
hỏng nặng nhất.

**Vì sao 90 chứ không phải 30**: ngưỡng 30 phút từng làm iteration sau tưởng mồ côi rồi spawn
agent thứ hai lên **cùng worktree** (repo pdf, task P1: agent vòng 4 chạy hơn 60 phút wall-clock).
Task có build + test + 2 vòng verifier vượt 30 phút là chuyện thường, không phải bất thường.

## Bước 2 — Xác định task nào chạy song song được

Mặc định **chạy song song các task độc lập**. Nhưng "độc lập" phải *xác định*, không phán từ tiêu đề.

Với mỗi task, xác định **vùng file nó sẽ chạm** — đọc mô tả task, rồi grep/glob để tìm file liên quan.
Việc này rẻ (đọc + tìm, không sửa gì); nếu nhiều task thì spawn agent `Explore` chạy song song để recon.

Dựng ma trận va chạm:

- **Không giao nhau** → song song, mỗi agent một worktree
- **Giao nhau**, hoặc **không xác định được** vùng chạm → **tuần tự** (mặc định an toàn khi thiếu thông tin)
- Task nói "refactor toàn bộ", "đổi tên xuyên repo", đụng file config/schema/type dùng chung → luôn tuần tự

Log cho user biết đã chia nhóm thế nào trước khi chạy.

## Bước 3 — Nhận task

**NGAY khi nhận**, sửa file task `[ ]` → `[⏳ HH:MM]` (giờ hiện tại). Nhận nhiều task song song thì
mark hết. Đây là bước đầu tiên, trước khi spawn agent — nếu spawn trước, iteration khác có thể cướp task.

## Bước 4 — Giao subagent

Mỗi task một agent, `model: "sonnet"`. Nhóm song song → thêm `isolation: "worktree"` để agent
có checkout riêng; đoán sai độ độc lập thì vẫn không ai đè lên ai. Nhóm tuần tự chạy thẳng
trong thư mục hiện tại, lần lượt.

Brief phải đủ:

- Project path, mô tả task **nguyên văn** + mọi dòng con
- File/context liên quan (kết quả recon ở bước 2)
- Done-criteria **cụ thể, kiểm được** — xem mục "Gate của repo" ngay dưới
- Convention của repo (đọc `CLAUDE.md` của project nếu có)

### Gate của repo — dán NGUYÊN VĂN, đừng chế

**Đừng bịa done-criteria kiểu `tsc exit 0`.** Rất nhiều repo không có TypeScript, hoặc có lệnh
chuẩn nhưng hỏng sẵn theo cách chỉ người trong repo mới biết. Đoán sai thì agent chạy nhầm lệnh,
thấy đỏ, rồi đi "sửa" thứ vốn đã hỏng từ trước — hoặc tệ hơn, thấy xanh giả rồi báo xong.

Trình tự bắt buộc:

1. Đọc khối gate ở **đầu `BRIEF.md`** (nếu có) và `CLAUDE.md` của repo
2. **Dán nguyên văn** khối đó vào brief của mọi subagent VÀ mọi verifier, kèm cả các cảnh báo
3. Không tìm thấy khối nào → đọc `package.json` scripts + CI config, và ghi rõ trong brief là
   "gate suy ra từ scripts, chưa được xác nhận"

Mỗi repo nên có khối gate riêng trong `BRIEF.md` ghi đủ: lệnh đúng, **lệnh trông đúng mà sai**,
baseline hiện tại (bao nhiêu suite/test), và những thứ **FAIL sẵn không phải lỗi mình**.
Ví dụ thật từ repo pdf: `npx jest` từ root hỏng sẵn 34/39 suite · `yarn lint -- <file>` nuốt tham
số nên luôn lint cả repo vốn đã 94 lỗi · mọi lệnh `yarn workspace` cần `nvm use 22` trong **cùng
một** Bash call. Không dán mấy dòng đó vào brief thì agent nào cũng vấp lại từ đầu.

**Ràng buộc bắt buộc ghi vào brief của mọi subagent:**

> Chỉ sửa file và chạy build/test. **KHÔNG chạy git** (add/commit/checkout/stash/branch/merge/restore).
> **KHÔNG sửa file task list.** Không mở rộng scope ngoài task được giao.
> **KHÔNG đụng dữ liệu thật**: không kết nối/ghi Firestore, DB, storage, API production hay staging.
> **KHÔNG tự chạy migration/backfill/script dọn dữ liệu vừa viết** — chỉ viết code, user tự chạy.
> **KHÔNG đụng file/thư mục đang có thay đổi chưa commit** của người khác (liệt kê cụ thể trong brief).
> Xong thì report: file nào đã sửa, cách làm **và lý do chọn cách đó**, kết quả verify.

Rào này xoá nguyên lớp rủi ro agent này `checkout` phá việc agent khác, và lớp rủi ro agent
"tiện tay" chạy backfill lên dữ liệu thật.

## Bước 5 — Verify (giao agent `verifier`, KHÔNG tự chấm)

Chờ agent xong. **Đừng tự verify** — bạn là đứa vừa spawn ra code đó, chấm bài của mình thì
không còn là gate. Giao cho subagent `verifier` (`~/.claude/agents/verifier.md`): context sạch,
không có Edit/Write, chạy done-criteria thật và trả verdict kèm bằng chứng.

Brief cho `verifier` gồm:

- Mô tả task **nguyên văn** + done-criteria cụ thể
- **Đường dẫn tuyệt đối** nơi phải chạy (worktree của task, hoặc repo root nếu tuần tự) —
  kèm câu: *"`cd` không persist giữa các Bash call, mọi lệnh phải viết `cd <path> && <lệnh>`
  trong cùng một call"*
- Danh sách file agent nói đã sửa

**Không dán report giải thích của agent viết code vào brief.** Cần đưa thì gắn nhãn rõ
"tuyên bố của agent, cần kiểm chứng" — verifier đã được dạy đối xử như vậy, nhưng đừng thử nó.

**Nêu sẵn kịch bản đáng nghi nhất.** Verifier chạy gate thì ai cũng làm được; giá trị thật nằm ở
chỗ nó thử **phá** đúng chỗ dễ vỡ. Nên viết thẳng vào brief: "kiểm giúp X có làm hỏng Y không",
"tự tay gỡ fix ra rồi chạy lại xem test có đỏ không". Bảo verifier **tự làm lại thí nghiệm**, đừng
tin số agent báo — riêng yêu cầu này đã bắt được một bộ test trông đầy đủ mà thực chất không guard
được tầng nào (repo pdf, task 9).

### Finding ngoài scope — ghi thành task, đừng sửa lén

Verifier hay tìm ra lỗi thật **nằm ngoài task**. Đừng cho sửa: nó phình diff, phá tính surgical,
và phần thêm đó không ai kiểm. Cũng đừng bỏ qua.

→ Yêu cầu verifier **liệt kê file:line**, rồi main agent **thêm thành task mới trong `BRIEF.md`**
kèm nguyên văn finding. Có bằng chứng thì task sau khỏi điều tra lại từ đầu.

Ngoại lệ duy nhất: finding đó **chặn chính task đang làm** — lúc đó nó thuộc scope, sửa luôn.

Xử theo verdict:

| Verdict | Làm gì |
|---|---|
| `PASS` | commit vào nhánh của task, sang Bước 6 |
| `FAIL` | giao lại **đúng một vòng** cho subagent sửa (brief = finding của verifier, nguyên văn), rồi verify lại. Vòng hai vẫn `FAIL` → blocker. **Muốn thêm vòng phải hỏi user** — đừng tự cho mình thêm lượt |
| `UNVERIFIED` | **không được coi là pass.** Chạy lại nếu là lỗi môi trường nhất thời; vẫn `UNVERIFIED` → blocker |

Blocker thì theo nhánh fail ở Bước 6: trả `[⏳]` về `[ ]`, ghi verdict + finding dưới task, report user.
**Không mark done.**

Nhóm worktree: verifier chạy **ngay trong worktree** của task đó (truyền path vào brief).
`PASS` rồi thì commit vào nhánh của task và **dừng ở đấy** — không merge đi đâu cả, nhánh sống
độc lập chờ bạn tạo MR. Worktree đã xong việc thì gỡ (`git worktree remove`), nhánh vẫn còn nguyên.

## Bước 6 — Đóng task

Chỉ khi verifier trả `PASS`:

1. Sửa file task `[⏳ HH:MM]` → `[✅ YYYY-MM-DD]` (ngày hôm nay — cần cho bước dọn)
2. Viết tóm tắt **ngay dưới task, indent**: **tên nhánh + commit hash ngắn**, file nào sửa,
   cách làm, và **gate nào verifier đã chạy + exit code** (xem mẫu ở mục Git)
3. `CHANGELOG.md`: **chỉ ghi nếu file đó thật sự là nơi ghi thay đổi nội bộ.** Nhiều repo dùng
   `CHANGELOG.md` làm **release note cho khách** (đánh theo version + ngày phát hành, vd repo pdf:
   `v2.0.x`). Nhét task nội bộ / tài liệu / refactor vào đó là **làm bẩn release note**.
   → Đọc file trước. Là release-note theo version → **bỏ qua, không ghi**, và nói rõ lý do khi report.
   Không có convention rõ ràng → cũng bỏ qua; `BRIEF.md` đã là nơi lưu lịch sử rồi.
4. Report cho user: task nào vừa xong, tóm tắt ngắn

**Fail / blocker** (thiếu credential, task mô tả không rõ, verifier trả `FAIL` sau vòng sửa thứ hai,
hoặc `UNVERIFIED` không gỡ được): ghi blocker dưới task **kèm verdict + finding nguyên văn của
verifier**, **ĐỪNG mark done**, trả `[⏳]` về `[ ]`, report user. Không đoán bừa để cho xong.

### Task đóng mà KHÔNG có commit nào

Không phải task nào cũng ra code. Ba trường hợp hợp lệ, vẫn `[✅]` bình thường:

- **Điều tra ra kết luận "không phải bug code"** — vd lỗi do cấu hình môi trường, do dữ liệu, do
  thiếu biến env. Đóng task, ghi rõ **nguyên nhân + cách gỡ + thứ CÒN LẠI chưa xử**.
- **Task là câu hỏi / làm rõ spec** — deliverable là quyết định, ghi thẳng vào `BRIEF.md`.
- **Task ra tài liệu** (spec, plan) — deliverable là file tài liệu, vẫn commit nhưng không có code.

Với hai loại đầu: **không cần verifier chạy gate** (không có gì để build), nhưng **vẫn nên cho
verifier kiểm chứng các tuyên bố dạng file:line** nếu kết luận dựa trên đọc code. Kết luận điều tra
sai mà đóng task thì tệ hơn không làm — nó khoá luôn hướng nghĩ đúng.

Bắt buộc ghi lại: **cái gì đã gỡ, cái gì còn nguyên.** Sửa được cho máy mình không có nghĩa là
sửa xong cho mọi người.

## Bước 7 — Dọn task cũ (housekeeping)

Chạy **một lần mỗi iteration, sau khi đóng task**. Giữ `BRIEF.md` là danh sách việc *đang sống*,
không phải kho lưu trữ — file phình lên thì mỗi iteration lại tốn công đọc lại thứ đã xong.

Task `[✅ YYYY-MM-DD]` **quá 3 ngày** → cắt khỏi `BRIEF.md`, append sang `BRIEF-done.md`
cùng thư mục (tạo nếu chưa có), **giữ nguyên tóm tắt indent bên dưới** — đó là lịch sử,
đừng vứt. Nhóm theo ngày:

```markdown
## 2026-08-04
- [✅] fix format tiền ở export CSV
  - Sửa `app/utils/money.js`; verify: tsc exit 0, test pass
```

Quy tắc:

- Task xong **trong vòng 3 ngày** → để nguyên trong `BRIEF.md` (user còn muốn thấy việc vừa làm)
- `[✅]` **không có ngày** (format cũ) → để nguyên, không đoán ngày
- Chỉ dọn khi có ít nhất 1 task đủ điều kiện. Không có thì bỏ qua im lặng, đừng tạo file rỗng
- `BRIEF-done.md` cũng ngoài graph — cùng tiền tố `BRIEF` nên `brain-lint` đã bỏ qua sẵn

---

## Git — nhánh, worktree, commit

**Nhánh nền.** User không nói gì → base từ **`origin/master`** (hoặc `origin/main` nếu repo dùng
tên đó — kiểm bằng `git symbolic-ref refs/remotes/origin/HEAD`, đừng đoán). **`git fetch` trước**
rồi mới base: `master` local rất hay cũ hơn remote, base nhầm vào đó là kéo theo cả đống diff
không liên quan lúc tạo MR.

Không bao giờ làm việc thẳng trên `master`/`main`.

**MỘT TASK = MỘT NHÁNH — trừ khi các task cùng một ticket.** Không gộp cả phiên loop vào một
nhánh: nhánh chứa 10 task hỗn hợp thì review không nổi, revert một việc là đụng chín việc kia,
và không map được task ↔ thay đổi khi cần truy lại sau vài tuần.

**Ngoại lệ quan trọng (dantt chốt 07/08, repo pdf: "để chung 1 nhánh đi ba"):** nhiều task thuộc
**cùng một ticket / cùng một feature** thì đi **chung một nhánh**, commit tuần tự theo thứ tự phụ
thuộc. Vì chúng sẽ ra **một MR duy nhất** — tách 6 nhánh rồi lại phải cherry-pick gộp về là công
thừa, và MR nào cũng phụ thuộc MR khác thì reviewer không merge được cái nào trước.

Cách phân biệt: **hỏi "cái này sẽ thành mấy MR?"** Một MR → một nhánh. Nhiều MR độc lập nhau →
nhiều nhánh. Task có mã ticket khác nhau gần như luôn là nhánh khác nhau.

Với nhánh dùng chung: task sau **không** base lại từ `origin/master`, mà commit tiếp lên nhánh
đang có. Mỗi task vẫn **một commit riêng** để revert lẻ được.

Đặt tên theo convention đọc được từ chính repo (`git branch -a | head -30` xem repo dùng `feat/…`,
`fix/…` hay tiền tố ticket). Task có mã ticket (`SB-…`, `JSUB-…`) thì mã đó vào tên nhánh.

**Base:** task **độc lập** → mỗi nhánh base thẳng từ `origin/master`, không nối tiếp nhau.
Task **tuần tự vì đụng cùng file** → chúng vốn liên quan về logic, nên hoặc gộp vào một nhánh,
hoặc stack nhánh sau lên nhánh trước và ghi rõ "depends on <nhánh>" trong tóm tắt.

**Worktree chỉ cho nhóm song song** — mỗi task song song một worktree, khớp sẵn với một nhánh
riêng của nó. Nhóm tuần tự không cần worktree, chỉ `git switch` giữa các nhánh trong thư mục chính.

**Commit VÀ push tự động, tạo MR thì KHÔNG.** Loop chạy nền 5 phút nên không thể hỏi trước từng
commit. dantt đã duyệt (07/08): **được tự commit và push, miễn không phải `master`/`main`.**
Nhánh feature vẫn review lại được bằng `git log`/`git diff`, và push lên còn đỡ mất việc khi máy hỏng.
Nhưng **tạo MR luôn phải hỏi** — đó mới là lúc người khác phải bỏ thời gian review.

Mỗi task một commit, message theo convention repo (repo Avada: `type - role - scope`).

### Kiểm tra trước khi commit — repo có thể đang dở việc khác

`git commit` sẽ **fail** nếu repo đang ở giữa một thao tác dở dang, và thông báo lỗi
(`cannot do a partial commit during a merge`) không nói rõ phải làm gì. Trước khi commit:

```bash
git status --short
ls .git/MERGE_HEAD .git/CHERRY_PICK_HEAD .git/REBASE_HEAD .git/REVERT_HEAD 2>/dev/null
```

- Có file nào ở trên → **đang dở một merge/rebase/cherry-pick của user**. **KHÔNG tự đóng nó**,
  cũng đừng `--abort`: đó là việc của user, và nội dung nó mang vào chưa ai kiểm.
  → Report user, giữ `[⏳]`, ghi rõ trong `BRIEF.md` là code đã xong nhưng chưa commit được vì lý do gì.
- Có file staged sẵn **không thuộc task này** → đừng commit trần (`git commit` sẽ gom cả chúng).
  Chỉ định đường dẫn tường minh: `git commit -- <file1> <file2>`.
- **Đừng `git add` bừa** khi index đang có sẵn thứ của người khác — thêm vào rồi gỡ ra được, nhưng
  nếu user commit giữa chừng thì việc của bạn lọt vào commit của họ.

**Ghi nhánh vào `BRIEF.md`.** Tóm tắt dưới mỗi task xong **phải có tên nhánh + commit hash ngắn**.
Đây là cách truy lại: mở `BRIEF.md` (hoặc `BRIEF-done.md` sau khi dọn) là thấy ngay task nào nằm
ở nhánh nào, không phải mò `git log`.

```markdown
1. [✅ 2026-08-04] fix format tiền ở export CSV
   - nhánh `fix/SB-14901-csv-money` · commit `a1b2c3d`
   - Sửa `app/utils/money.js`; verify: tsc exit 0, test pass
```

## Nguyên tắc

- **Main agent không viết code, cũng không tự verify.** Chỉ orchestrate, bookkeeping, và git.
  Code do subagent Sonnet làm, chấm do `verifier` làm — hai context tách rời, không đứa nào
  vừa viết vừa chấm.
- **Idempotent.** `[✅]` bỏ qua tuyệt đối. Lock có timestamp lo phần `[⏳]`.
- **Không tự thêm task, không mở rộng scope.** Làm đúng cái file ghi.
- **Surgical.** Mỗi thay đổi trace được về đúng một task.
- **Git do main agent làm.** Subagent chỉ sửa file (xem mục Git ở trên).
- **File task ở brain thì KHÔNG commit nó.** Cứ sửa và để đó — `brain-sync` 20:00 mỗi tối tự
  commit + push master. Đừng commit brain giữa chừng chỉ để lưu một cái checkbox.

## Chạy định kỳ

Skill này chạy trong khung `/loop` (fixed-interval). Để lập lịch loop 5 phút:

- Ưu tiên: user gọi qua `/loop 5m /looptasks <file>` — cơ chế loop do /loop lo
  (CronCreate `*/5 * * * *`, session-only, auto-expire 7 ngày).
- Nếu skill được gọi trực tiếp và user muốn loop: tạo cron `*/5 * * * *` (CronCreate, recurring)
  với prompt `/looptasks <file>`, rồi thực thi 1 iteration ngay.
- Dừng loop: CronDelete job, hoặc user bảo dừng.

**`looptasks` KHÔNG gọi `/loop`** — chiều ngược lại. Hai đường trên kết thúc ở **cùng một
primitive là `CronCreate`**, chỉ khác ai là người tạo. Đừng giải thích với user rằng "skill không
tự lặp được": nó lặp được, qua gạch đầu dòng thứ hai.

**Gọi trực tiếp thì KHÔNG tự tạo cron.** Chỉ tạo khi user muốn lặp. Nhưng nếu user đã nói ý muốn
lặp ở bất kỳ đâu trong hội thoại thì **tạo luôn, đừng bắt họ nhắc lại**.

**Nhịp mặc định là 5 phút — đừng tự đổi.** Thấy 5 phút quá ngắn cho repo đang làm thì **hỏi user**,
đừng lẳng lặng đặt số khác rồi báo sau. Muốn giảm iteration rỗng thì nới ngưỡng lock (Bước 1),
đừng giãn nhịp — nới lock gỡ đúng nguyên nhân, giãn nhịp chỉ né nó.
