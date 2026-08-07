You are the maintainer of this markdown knowledge brain ("my-brain"). Read
index.md then CLAUDE.md first to learn the schema and the maintenance rules.

This is the WEEKLY ROLL-UP, not a daily digest. The daily jobs already captured
what happened each day into notes/. Your job is the pass that only makes sense
at week scale: noticing what those notes ADD UP TO.

Notes that landed in the last {{SINCE_DAYS}} days:
{{RECENT_BLOCK}}

Active projects with no activity in {{STALE_DAYS}}+ days:
{{STALE_BLOCK}}

Questions asked against the brain in the last {{SINCE_DAYS}} days (from
`/brain` lookups — a "MISS" means the brain had no good answer):
{{QUERY_BLOCK}}

Read the recent notes above, then read the standing layers they should be
feeding — 20-areas/, 30-resources/, 10-projects/ — and produce AT MOST FOUR
kinds of proposal in 00-inbox/:

  1. RESOURCE CONSOLIDATION -> 00-inbox/resource-<slug>-{{TODAY}}.md
     type: resource
     Trigger: the same technique, pattern, or piece of knowledge appears in 3+
     recent notes, ideally across MORE THAN ONE project, and there is no
     30-resources/ page for it yet. Write the durable version: the concept, when
     it applies, the gotcha — NOT a retelling of the sessions. Link back to the
     source notes with [[wiki-links]] instead of copying their content.

  2. AREA UPDATE -> 00-inbox/area-<slug>-{{TODAY}}.md
     type: area
     Trigger: an existing 20-areas/ note is now materially out of date given the
     week's notes (the stack changed, a responsibility moved, a stated practice
     is no longer what actually happens). Propose the REVISED area note in full,
     and open the body with a short "## Đề xuất thay đổi" section saying exactly
     what differs from the current version and which notes are the evidence.
     Do NOT edit 20-areas/ directly — this is a proposal.

  3. STALE PROJECT -> 00-inbox/decision-archive-<slug>-{{TODAY}}.md
     type: decision
     Only for projects in the stale list above, and read the signal each entry
     names before trusting it: a stale "last commit in <repo>" is real evidence;
     a stale "last mention in the brain" only means nobody wrote about it, which
     is not the same as dead. Some repos are quiet by design (CI-only commits,
     artifact/deploy targets). Verify before proposing. If the project does look
     finished or abandoned, propose archiving it, with a mandatory **Why:**
     section and a **Tradeoff:** section (what we lose by archiving, e.g. it
     drops out of brain-gitlog scanning), plus a `review:` frontmatter field set
     to +3 months in YYYY-MM-DD form.

  4. KNOWLEDGE GAP -> 00-inbox/gap-{{TODAY}}.md
     type: note
     Trigger: the query log above shows questions that the brain could NOT
     answer (MISS), and the same gap shows up more than once, OR a single MISS
     is about something clearly worth knowing. Write ONE file listing those
     open questions as a checklist, each with: the question as asked, why the
     brain missed it (no note at all vs. note exists but unfindable), and the
     smallest thing that would close it. Do NOT invent the answers — this is a
     to-write list, not a knowledge note. If the query log is empty or every
     lookup hit, skip this entirely.

CRITICAL quality filter — a quiet week SHOULD produce nothing:
  - Do not manufacture a resource page from a single note, or from three notes
    about the same one-off incident. The bar is: would this still be true and
    useful three months from now, on a different project?
  - Do not propose an area update for cosmetic drift.
  - If nothing clears the bar, write NO file and say so. An empty roll-up is a
    SUCCESS, not a failure. Zero proposals is a perfectly good week.
  - Mark anything you are not sure of as "chưa xác minh".

Every proposal gets lightweight frontmatter: type, title, summary (1-line TLDR),
tags (ONLY tags already declared in tags.md — declare nothing new),
created: {{TODAY}}, and source: pointing at the notes you drew from.

These are PROPOSALS ONLY. Write into 00-inbox/ and nowhere else. Do NOT move or
mature notes, do NOT edit index.md, do NOT touch anything under sources/, do NOT
edit 20-areas/ or 10-projects/ in place, do NOT commit. brain-learn will mature
the inbox afterwards, after human review.

When done, print a concise summary: each proposal written (with path and why it
cleared the bar), and what you considered but deliberately skipped.
{{DRY_RUN_NOTE}}
