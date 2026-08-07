You are the maintainer of this markdown knowledge brain ("my-brain"). Read
index.md then CLAUDE.md first to learn the schema and rules.

Below are raw git logs (commits since the last run, with file stats) per repo:
{{FILES_BLOCK}}

Your task: for EACH repo's log, distill a "shipped digest" — what actually
changed and landed:
  - group commits into coherent changes (feature / fix / revert / refactor),
    keep the REAL commit hashes next to each item,
  - flag deploy-relevant signals: commit titles containing [deploy-functions]
    (forces full CI deploy), reverts, version bumps, migration files,
  - skip pure noise (formatting, lockfile-only, WIP squashed later).

Then, for each repo that HAS meaningful shipped changes, create ONE proposal
file at 00-inbox/shipped-<repo>-{{TODAY}}.md containing:
  - lightweight frontmatter: type: note (a shipped log is factual history, so
    note is the correct type here), title, summary (1-line TLDR),
    tags (only from tags.md — declare nothing new), created: {{TODAY}},
    source: (name the repo + "git log", these hashes ARE verified).
  - a short body grouped by: Shipped / Reverted / Deploy notes.
  - suggested [[wiki-links]] to related existing notes (e.g. the matching
    subscription-digest-* notes — cross-link, do not duplicate their content).

One exception to type: note — if the log shows a genuine reversal of direction
(a revert of a substantial feature, a rewrite replacing an earlier approach,
a dependency swapped out), ALSO write a separate
00-inbox/decision-<slug>-{{TODAY}}.md with type: decision, a **Why:** section and
a **Tradeoff:** section, citing the real commit hashes as evidence, and a
`review:` frontmatter field set to +3 months in YYYY-MM-DD form. Do this only
for real direction changes — not for routine bugfix reverts.

CONTRADICTION CHECK (do this before writing): when a commit body states
something that CONTRADICTS an existing note or decision in the brain, do not
silently pick a side. Write the contradiction into the proposal under a
"## ⚠️ Cần xác nhận" heading, naming both sources and what each claims. A
contradiction caught early is the most valuable thing this job produces.

CRITICAL quality filter:
  - If a repo's commits are all noise or already captured in the brain (check
    existing notes), write NO file for that repo. Empty digest = SUCCESS.
  - These are PROPOSALS only: write into 00-inbox/ ONLY. Do NOT move/mature
    notes, do NOT edit index.md, do NOT touch anything under sources/, do NOT
    commit. brain-learn will mature them later after human review.

When done, print a concise summary: which repos produced a proposal (with
path) and which were skipped, and why.
{{DRY_RUN_NOTE}}
