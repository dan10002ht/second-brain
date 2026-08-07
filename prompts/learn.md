You are the maintainer of this markdown knowledge brain ("my-brain"). Follow
the conventions in CLAUDE.md exactly. First read index.md, then CLAUDE.md, to
understand the structure, the frontmatter schema, and the maintenance rules.

Your task: process EVERY file currently in the 00-inbox/ directory. For each
file:

1. Read the file's content.
2. Decide its `type`. If the file already declares a `type:` in its frontmatter,
   TRUST IT — the producing script chose it deliberately. Only override when the
   declared type is clearly wrong for the content. Valid types:
   - project  -> 10-projects/   (goal + deadline)
   - area     -> 20-areas/      (long-lived responsibility)
   - resource -> 30-resources/  (topic / study material; learns/ lives here)
   - note     -> notes/         (atomic Zettelkasten idea, 1 idea per file)
   - feedback -> feedback/      (include Why + How to apply)
   - decision -> 70-decisions/  (include Why + Tradeoff — BOTH are mandatory,
                                 plus a `review:` date in YYYY-MM-DD form)
3. Add proper YAML frontmatter matching the CLAUDE.md schema (type, title,
   summary, tags, created, updated, and optional source/status). `summary:` is
   MANDATORY — one line, and it must be the line that later appears in index.md.
   Keep frontmatter light — do not over-engineer it.
4. Move the file into the correct layer folder (rename to a clean kebab-case
   slug filename if helpful).
5. Suggest and insert relevant [[wiki-links]] to related notes (links to
   not-yet-existing notes are fine — they mark work to do later). Use [[slug]]
   without the .md extension. Wiki-links inside fenced code blocks are NOT
   links — never put one there.
6. Mark the item processed (it should no longer live in 00-inbox/).
7. Wire the note into navigation:
   - update index.md so it accurately reflects the new/moved notes (the line in
     index.md should match the note's `summary:`),
   - if a matching Map of Content exists (notes/moc-*.md), add the note there
     too. A note reachable only from index.md is weakly connected; a note in the
     right MOC is findable by topic.

Rules:
- NEVER modify anything under sources/ (immutable layer 1).
- Prefer flat notes + links over deep nested folders.
- Keep notes atomic; split long notes and link them.
- Provenance: synthesized knowledge should point to its source via the
  `source:` field; if unsure, note it as unverified ("chưa xác minh").
- Tags must already exist in tags.md. Need a new tag? Declare it in tags.md
  FIRST, in the right section, then use it.

When finished, print a concise summary: for each inbox item, the chosen type,
its new path, and the wiki-links you added; then note the index.md/MOC updates.
{{DRY_RUN_NOTE}}
