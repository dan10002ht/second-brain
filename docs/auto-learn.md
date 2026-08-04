# Auto-learn layer

## Kiến trúc: producer → inbox → brain-learn

Mọi thứ tự động đều theo đúng một hình dạng — **producer chỉ ghi đề xuất vào
`00-inbox/`, không bao giờ tự chín, không bao giờ commit.** `brain-learn` là
tầng duy nhất được phép move file sang layer và sửa `index.md`.

```
                 ┌──────────────┐
   git commits ─▶│ brain-gitlog │─┐
                 └──────────────┘ │
                 ┌──────────────┐ │   ┌───────────┐   ┌────────────┐   ┌──────────┐
 session .jsonl ─▶│ brain-digest │─┼──▶│ 00-inbox/ │──▶│ brain-learn│──▶│  layers  │
                 └──────────────┘ │   │ proposals │   │ (claude -p)│   │ + index  │
                 ┌──────────────┐ │   └───────────┘   └────────────┘   └──────────┘
    notes/ 7d  ─▶│ brain-weekly │─┘                    ▲
                 └──────────────┘                      │
                                              brain-sync gọi nó, rồi commit + push
```

| Script | Nguồn vào | Sinh ra | Type |
|---|---|---|---|
| `brain-gitlog` | git log các repo trong `10-projects/*.md` có `status: active` | `shipped-<repo>-<date>.md` | `note` (+ `decision` khi có đảo hướng) |
| `brain-digest` | transcript session Claude Code | `digest-<project>-<date>.md` | `note`, hoặc `feedback`/`decision`/`resource` khi học được thứ bền |
| `brain-weekly` | các note đã vào `notes/` trong 7 ngày | `resource-*`, `area-*`, `decision-archive-*` | `resource` / `area` / `decision` |
| `brain-learn` | mọi file trong `00-inbox/` | move sang layer đúng + update `index.md` | — |
| `brain-sync` | — | gọi `brain-learn` → index → commit → push | — |

**Thứ tự lịch quan trọng.** Producer phải chạy **trước** `brain-sync`, nếu không
đề xuất nằm chờ trong inbox tới 20:00 hôm sau mới được mature (trễ 1 ngày):

| Giờ | Job | Tần suất |
|---|---|---|
| 06:00 | `brain-gitlog` | hằng ngày |
| 18:00 | `brain-weekly` | Chủ nhật |
| 19:00 | `brain-digest` | hằng ngày |
| 20:00 | `brain-sync` | hằng ngày |

Human-in-the-loop: producer chỉ ghi vào inbox (tầng capture); `brain-learn` mới
quyết định cái gì lên wiki — và bạn vẫn đọc được git diff mỗi sáng.

### brain-digest — chạy tay

```bash
bin/brain-digest --dry-run     # xem sẽ đề xuất gì, không ghi
bin/brain-digest               # ghi đề xuất vào 00-inbox/, cập nhật watermark
bin/brain-digest --since 3     # bỏ qua watermark, quét lại 3 ngày gần nhất
```

Watermark ở `.state/brain-digest.watermark` (gitignored). Lần đầu (chưa có watermark) chỉ quét 24h
gần nhất để khỏi distill toàn bộ lịch sử.

### brain-digest — chạy tự động (launchd, macOS)

Session file nằm local nên phải chạy **local** (không dùng cloud routine). Dùng `launchd` chạy mỗi tối 19:00
— **trước** `brain-sync` (20:00), xem bảng lịch ở đầu file:

```bash
cp bin/com.avada.brain-digest.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.avada.brain-digest.plist
launchctl start com.avada.brain-digest   # chạy thử ngay
```

Đề xuất sinh lúc 19:00 sẽ được `brain-sync` mature ngay 20:00 cùng tối. Log ở `.state/`.

---

## brain-weekly — tầng tổng hợp tuần

`brain-digest` và `brain-gitlog` chạy ở **quy mô ngày**, nên chúng chỉ đẻ ra
`notes/`. Đó là lý do `20-areas/`, `30-resources/`, `10-projects/` gần như không
bao giờ đổi — không có gì làm việc ở quy mô mà chúng thật sự thay đổi.

`brain-weekly` lấp chỗ đó. Mỗi Chủ nhật nó đọc note của 7 ngày qua, đối chiếu
với các layer đứng yên, rồi đề xuất **tối đa 3 loại**:

1. **Resource consolidation** — một kỹ thuật xuất hiện ở 3+ note, ở nhiều project
   khác nhau, chưa có trang trong `30-resources/` → đề xuất `type: resource`.
2. **Area drift** — một note trong `20-areas/` đã lệch thực tế → đề xuất bản sửa
   (kèm mục "Đề xuất thay đổi" nêu rõ khác gì và bằng chứng là note nào).
3. **Stale project** — `status: active` nhưng ≥21 ngày không có commit/note nào
   → đề xuất archive, bắt buộc có **Why** + **Tradeoff** + review date +3 tháng.

```bash
bin/brain-weekly --dry-run     # xem sẽ đề xuất gì, không ghi
bin/brain-weekly               # ghi đề xuất vào 00-inbox/
bin/brain-weekly --since 14    # nhìn lại 14 ngày thay vì 7
```

Cài lịch (Chủ nhật 18:00):

```bash
cp bin/com.avada.brain-weekly.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.avada.brain-weekly.plist
```

**Tuần yên ắng thì không sinh file nào** — prompt nói rõ zero proposal là thành
công, không phải thất bại. Ngưỡng: "cái này 3 tháng nữa, ở project khác, còn đúng
và còn dùng được không?"

---

## brain-learn (tầng (C))

The **auto-learn layer** turns inbox processing into a single command instead
of manually typing a prompt to Claude each time. It implements the LLM-wiki
model (Karpathy: "compile once, keep current") — an LLM agent does the
bookkeeping: classify → add frontmatter → move to the right layer → link →
update `index.md`.

## What it does

`bin/brain-learn` shells out to **Claude Code in headless mode** (`claude -p`)
with a detailed prompt. For every file in `00-inbox/`, Claude will:

1. Read the file.
2. Decide its `type` — `project | area | resource | note | feedback | decision`.
   Nếu file đã khai `type:` sẵn (producer chọn có chủ đích) thì **tin nó**, chỉ
   override khi rõ ràng sai.
3. Add YAML frontmatter matching the `CLAUDE.md` schema (kept light).
4. Move it into the correct layer folder:
   - `project`  → `10-projects/`
   - `area`     → `20-areas/`
   - `resource` → `30-resources/`
   - `note`     → `notes/`
   - `feedback` → `feedback/`   (bắt buộc **Why** + **How to apply**)
   - `decision` → `70-decisions/` (bắt buộc **Why** + **Tradeoff**)
5. Suggest and insert `[[wiki-links]]` to related notes.
6. Mark it processed (it leaves `00-inbox/`).
7. Update `index.md` so the map stays accurate.

It never touches `sources/` (immutable layer 1).

## Usage

```bash
# process the inbox (Claude may edit and move files)
bin/brain-learn

# preview only — Claude reports what it WOULD do, makes no changes
bin/brain-learn --dry-run

# help
bin/brain-learn --help
```

Add `bin/` to your PATH to call it from anywhere:

```bash
export PATH="$HOME/projects/my-brain/bin:$PATH"
brain-learn --dry-run
```

## Configuration

| Env var     | Default                  | Meaning                     |
|-------------|--------------------------|-----------------------------|
| `BRAIN_DIR` | `$HOME/projects/my-brain`| Path to the brain directory |

```bash
BRAIN_DIR=/path/to/other-brain brain-learn
```

## How it runs Claude

Under the hood the script runs Claude Code headless mode from inside the brain
directory:

```bash
# real run  (prompt MUST come right after --print — --add-dir swallows trailing args)
claude --print "<prompt>" --permission-mode acceptEdits --add-dir "$BRAIN_DIR"

# dry run (no write permission needed)
claude --print "<prompt>" --add-dir "$BRAIN_DIR"
```

- `--print` (`-p`) — non-interactive headless mode: run the prompt, print the
  result, exit.
- `--permission-mode acceptEdits` — auto-accept file edits so the run doesn't
  stop to ask for each change. Only used for real runs; `--dry-run` omits it,
  so a stray edit would prompt rather than silently apply.
- `--add-dir "$BRAIN_DIR"` — grants tool access to the brain directory.

The prompt tells Claude to read `index.md` first, then `CLAUDE.md`, and to
follow the schema and maintenance rules exactly.

## Behavior notes

- **Empty inbox:** prints a message and exits 0 — no Claude call.
- **Missing `claude` binary:** prints an install hint and exits 127.
- **Dry run:** Claude only reads and reports; no files change and `index.md`
  is not modified.

## Suggested workflow

```bash
capture "some raw idea"      # drop things into 00-inbox/ during the day
brain-learn --dry-run        # review the plan
brain-learn                  # commit the changes to the wiki
git add -A && git commit -m "learn: process inbox"
```
