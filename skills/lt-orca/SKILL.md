---
name: lt-orca
description: Như looptasks nhưng executor chạy qua ORCA orchestration — nhặt tối đa 4 task từ BRIEF.md, mỗi task một Orca worktree + worker codex, chờ worker_done (không poll, không canh file), verifier Claude chấm, main agent commit, worker-release dọn. Fallback về /looptasks khi Orca không chạy. Dùng khi user gọi /lt-orca.
---

# lt-orca — looptasks chạy trên Orca

Kế thừa `looptasks`. **State machine giữ nguyên** (lock `[⏳ HH:MM]`, `[⏸️]`, batch ≤4, gate nguyên
văn, verifier, git, housekeeping) — đọc `looptasks` trước, file này chỉ ghi phần KHÁC.

## Khác ở đâu

| | `looptasks` | `looptasksv2` | **lt-orca** |
|---|---|---|---|
| Executor | subagent Sonnet | lane codex trong pane cmux | **worker codex do Orca dispatch** |
| Worktree | `isolation: "worktree"` | tự `git worktree add` | **`worker-start --worktree new-top-level`** |
| Biết khi nào xong | `Agent` return | `Monitor` canh file report | **`check --wait --types worker_done`** — chặn thật |
| Danh sách file đã sửa | trong text return | `.lanes/report-<ID>.md` | **`--files-modified` trong `worker_done`** |
| Dọn | harness tự | tự đóng pane + `git worktree remove` | **`worker-release --dispatch`** |
| Trạng thái nhìn thấy | không | pane trên sidebar | **card + `--comment` + `--workspace-status`** |

Verifier vẫn là agent `verifier` của harness (Claude) → **khác họ với codex**, giữ nguyên ưu điểm của v2.

`ORCA` dưới đây = executable đã resolve (macOS: `orca`). Mọi lệnh dùng `--json`.

---

## Bước 0 — Tiền kiểm

```bash
orca status --json          # runtime.state phải là "ready"
```

Không `ready` (hoặc CLI không có) → **fallback toàn bộ iteration sang `/looptasks`**, log một dòng
nói rõ. Đừng `orca open` giữa loop nền — app bật lên chiếm màn hình user.

🔴 **Modal update của codex nuốt prompt.** Codex ra bản mới thì lúc khởi động nó hiện
`✨ Update available! 1. Update now 2. Skip 3. Skip until next version` và **nuốt luôn prompt Orca
vừa paste** → `worker-start` fail `agent_prompt_blocked` sau 60s. Orca chặn cả `terminal send` lúc
đó nên không bấm được từ CLI. Vá trước khi dispatch — đây chính là thứ lựa chọn 3 ghi:

```bash
python3 - <<'EOF'
import json,pathlib
p=pathlib.Path.home()/'.codex/version.json'
d=json.loads(p.read_text())
if d.get('dismissed_version')!=d.get('latest_version'):
    d['dismissed_version']=d['latest_version']; p.write_text(json.dumps(d)); print('dismissed',d['latest_version'])
EOF
```

Đã fail rồi thì: `terminal close` cái terminal chết → `worker-start --retry-of <dispatch_id>`.

🔴 **Nested worker depth.** Mặc định `1`: một worker **không được** dispatch worker con
(`nested_worker_depth_exceeded`). Nếu terminal đang chạy loop này bản thân nó là worker của một
dispatch khác thì fan-out sẽ fail. Chạy loop từ terminal root, hoặc user chỉnh
`Settings → Orchestration → Nested worker depth = 2`. **Đừng route vòng qua `run-create`** — depth đếm
theo terminal, không theo Run.

## Bước 1–3 — Đọc file, chia nhóm, nhận task

**Y hệt `looptasks`.** Batch ≤4, ưu tiên `[P0]`→`[P1]`, bỏ `[⏸️]`, lock 90 phút, mark `[⏳ HH:MM]`
**trước khi** dispatch.

Một khác biệt: kiểm mồ côi bằng Orca chứ không bằng `ListAgents`.

```bash
orca orchestration task-list --brief --json     # còn task nào dispatched?
orca worktree ps --json                          # worktree nào còn worker sống
```

`[⏳]` quá 90 phút **mà** không có dispatch nào đang chạy cho nó → mồ côi, nhận lại.

## Bước 4 — Dispatch

Một Run cho cả iteration, mỗi task một Task, **start hết rồi mới chờ**.

```bash
orca orchestration run-create --objective "lt-orca <repo> <YYYY-MM-DD HH:MM>" --json

# spec = brief đầy đủ, ghi ra file trước rồi nạp vào (spec dài, đừng nhét inline)
orca orchestration task-create --spec "$(cat /tmp/lt-orca-spec-<ID>.md)" --json

orca orchestration worker-start --task <task_id> \
  --worktree new-top-level --name <slug> --agent codex --setup run --json
```

- `new-top-level` = worktree độc lập, base theo repo default ref. Task stack lên nhau (cùng ticket)
  → `--worktree new-child`.
- `--setup run` là thứ tránh nguyên bảng "worktree trông giống repo nhưng không chạy được" của v2:
  Orca chạy setup hook của repo. Repo **chưa** cấu hình setup thì vấn đề đó còn nguyên — liệt kê
  `git status --ignored --porcelain | grep '^!!'` và ghi vào spec cái gì **chưa** dựng được.
- **Task điều tra cần credential prod thì ĐỪNG tạo worktree mới.** `serviceAccount.*.json`, `.env`,
  `node_modules` đều gitignored — worktree mới không có, mà repo `subscriptions` hiện chưa cấu hình
  setup script. Dùng `--worktree <checkout chính>` và bù bằng ràng buộc trong spec: cấm git, cấm sửa
  file trong repo, chỉ ghi vào `/tmp/lt-orca/<task>/`. Cô lập không đáng giá khi task vốn không sửa code.
- 🔴 **Worker chạy `codex --dangerously-bypass-approvals-and-sandbox` (YOLO mode)** — không có sandbox
  nào chặn nó. Mọi ràng buộc "không ghi prod / không chạy git" chỉ là câu chữ trong spec, nên phải
  viết rõ ràng và verifier phải kiểm lại thật (đọc script worker viết, xem có nhánh ghi không).
- Đọc receipt: `ready` + setup `running` là bình thường. Exit khác 0 → đọc `stage`/`effects`/
  `residualResources`, **đừng retry mù**.
- Lưu lại `dispatch_id` + `worktree.id` + path của từng task. `worktree.id` là **cả** chuỗi
  `<repoId>::<path>`, không phải mỗi repoId.

**Spec phải có đủ những gì `looptasks` Bước 4 đòi** — mô tả nguyên văn + dòng con, kết quả recon,
**khối gate dán nguyên văn từ đầu `BRIEF.md`**, convention repo, và nguyên khối ràng buộc:

> Chỉ sửa file và chạy build/test. **KHÔNG chạy git.** **KHÔNG sửa file task list.**
> **KHÔNG đụng dữ liệu thật** (Firestore/DB/storage/API prod hay staging).
> **KHÔNG tự chạy migration/backfill vừa viết.** Không mở rộng scope.

Thêm hai dòng riêng của Orca vào cuối spec:

> Xong thì gửi đúng một lần:
> `orca orchestration send --type worker_done --subject "<status>" --body "<làm gì, vì sao chọn cách đó, gate nào chạy + exit code, còn lại gì>" --task-id <task_id> --dispatch-id <dispatch_id> --outcome succeeded --files-modified "a,b" --json`
> Thất bại thì `--outcome failed` — **đừng chỉ kể bằng lời**. Cần hỏi thì
> `orca orchestration ask --question "..." --timeout-ms 600000 --json` rồi chờ.

Cập nhật card cho user nhìn thấy: `orca worktree set --worktree id:<wt> --workspace-status in-progress --comment "<task title>" --json`.

## Bước 5 — Chờ

```bash
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- 🔴 **Không `2>&1`.** `--wait` in keepalive ra stderr; trộn vào là parser chết "Extra data: line 2".
- Xử **hết** message trong Delivery rồi mới `--ack <delivery_id>`. `question` → trả lời bằng
  `orca orchestration reply --id <msg_id> --body "<đáp>" --json`.
- **Timeout hay `{count:0}` KHÔNG phải worker chết.** Task code 15–60 phút là bình thường. Chờ tiếp
  bằng vòng `check --ack <id> --wait ...` cho tới khi mọi dispatch settle, hoặc chạm mốc 90 phút của
  lock — lúc đó timeout là **một kết quả phải report**, không phải im lặng.
- Nghi worker treo thì đọc, đừng giết: `orca orchestration worker-read --dispatch <id> --limit 50 --json`.

## Bước 6 — Verify

Y như `looptasks` Bước 5: agent `verifier` (Claude), **verify task nào xong task đó**, nhiều task
cùng xong thì spawn các verifier **trong một message**.

Chuẩn bị trước khi spawn (đây là phần cắt số lượt của verifier, đừng bỏ):

- `gate.sh` gộp typecheck → build → test → lint, lệnh **nguyên văn từ khối gate**, không dừng ở lỗi đầu
- diff đầy đủ (`cd <wt> && git status --porcelain && git diff`), dài quá thì ghi `.patch` rồi đưa path
- **đường dẫn tuyệt đối worktree** + câu "`cd` không persist giữa các Bash call"
- danh sách file lấy từ **`--files-modified`** của `worker_done`, không lấy từ lời kể trong body
- nêu sẵn kịch bản đáng nghi nhất, và bảo verifier **tự làm lại thí nghiệm**

Verdict xử y `looptasks`: `PASS` → commit · `FAIL` → sửa **đúng một vòng** → vẫn `FAIL` → blocker ·
`UNVERIFIED` **không phải pass**.

Vòng sửa đi vào **đúng terminal codex cũ** (giữ nguyên context điều tra) — đừng dựng worker mới.
Dispatch cũ đã settle nên `send --to dispatch:<id>` không đánh thức nó được; phải tạo task mới rồi
gắn vào terminal đó:

```bash
orca orchestration task-create --spec "$(cat <file finding nguyên văn>)" --json
orca orchestration worker-start --task <task_fix> --terminal <handle> --worktree <selector> --json
```

🔴 **`--terminal` BẮT BUỘC đi kèm `--worktree`.** Thiếu thì Orca suy worktree từ cwd — mà cwd của
loop thường là brain, không phải repo → fail `terminal_worktree_mismatch`. Handle lấy từ
`worker-show --dispatch <id> --json` → `worker.agent_terminal_handle`.

**Đừng release worker trước khi có verdict** — release đóng terminal, mất luôn context cho vòng sửa.

Finding ngoài scope → thêm task mới vào `BRIEF.md` kèm file:line, **không sửa lén**.

## Bước 7 — Commit + đóng task

**Main agent làm git**, worker không được chạm. Y `looptasks`: fetch, base `origin/master`
(kiểm bằng `git symbolic-ref refs/remotes/origin/HEAD`), một task một nhánh — trừ khi cùng ticket thì
chung nhánh, `git add` **đúng danh sách `--files-modified`**, commit `type - role - scope`, push nhánh
feature được, **MR thì hỏi**.

Trước khi commit vẫn kiểm `git status --short` + `.git/MERGE_HEAD|CHERRY_PICK_HEAD|REBASE_HEAD`.

Rồi `[⏳]` → `[✅ YYYY-MM-DD]`, tóm tắt indent có **nhánh + commit hash ngắn + gate nào chạy + exit code**.

## Bước 8 — Release (bắt buộc)

Sau **mỗi** `worker_done` đã xử xong — kể cả `--outcome failed`:

```bash
orca orchestration worker-release --dispatch <dispatch_id> --json
orca worktree set --worktree id:<wt> --workspace-status completed --json
orca worktree rm --worktree id:<wt> --force --json      # nhánh vẫn còn nguyên
```

🔴 **Chỉ `worktree rm` worktree do chính lượt này tạo.** Task chạy trong checkout sẵn có của user
(`isMainWorktree: true`, hoặc worktree có từ trước) thì **không được xoá** — chỉ release worker và
trả `--comment ""` về rỗng.

- Release **không phải** cancel: nó chỉ đóng đúng terminal của dispatch đã settle.
- **Đừng release** vì timeout / tui-idle / heartbeat / question / escalation / `worker_done` bị từ chối.
- `release_pending` hay `release_unknown` → làm theo receipt, **đừng thay bằng `terminal close`**.
- User muốn giữ worker để soi → `orca orchestration worker-retain --dispatch <id> --json`, đừng lặng lẽ bỏ qua.

## Bước 9 — Housekeeping

Y `looptasks` Bước 7: `[✅]` quá 3 ngày → cắt sang `BRIEF-done.md`, giữ nguyên tóm tắt indent.

## Chạy định kỳ

`/loop 5m /lt-orca <file>`. Nhịp mặc định 5 phút — muốn đổi thì **hỏi user**; giảm iteration rỗng
bằng cách nới ngưỡng lock, không phải giãn nhịp.
