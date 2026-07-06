# Auto-learn layer

The **auto-learn layer** turns inbox processing into a single command instead
of manually typing a prompt to Claude each time. It implements the LLM-wiki
model (Karpathy: "compile once, keep current") — an LLM agent does the
bookkeeping: classify → add frontmatter → move to the right layer → link →
update `index.md`.

## What it does

`bin/brain-learn` shells out to **Claude Code in headless mode** (`claude -p`)
with a detailed prompt. For every file in `00-inbox/`, Claude will:

1. Read the file.
2. Decide its `type` — `project | area | resource | note | feedback`.
3. Add YAML frontmatter matching the `CLAUDE.md` schema (kept light).
4. Move it into the correct layer folder:
   - `project`  → `10-projects/`
   - `area`     → `20-areas/`
   - `resource` → `30-resources/`
   - `note`     → `notes/`
   - `feedback` → `feedback/`
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
# real run
claude --print --permission-mode acceptEdits --add-dir "$BRAIN_DIR" "<prompt>"

# dry run (no write permission needed)
claude --print --add-dir "$BRAIN_DIR" "<prompt>"
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
