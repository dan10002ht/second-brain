You are the maintainer of this markdown knowledge brain ("my-brain"). Read
index.md then CLAUDE.md first to learn the schema and rules.

This is the DECISION REVIEW pass. Every decision in 70-decisions/ carries a
`review:` date precisely so that it gets challenged later instead of quietly
hardening into "how things are". Today is {{TODAY}}. These decisions are due:

{{DUE_BLOCK}}

For EACH decision above:

1. Read the decision file in full — especially its **Why:** and **Tradeoff:**.
2. Go find out whether it is STILL TRUE. Do not reason from the note alone.
   Check reality:
   - notes/ and 00-inbox/ written since the decision (did we hit its tradeoff?),
   - the actual repo if the decision names one (git log, the files it touched —
     was it reverted, superseded, quietly abandoned?),
   - other decisions that may have overridden it.
3. Assign exactly one verdict:
   - **HOLDS** — evidence still supports it. Nothing changed materially.
   - **AMEND** — mostly right, but a condition/scope/detail is now wrong.
   - **REVERSED** — reality went the other way, or we silently stopped doing it.
   - **MOOT** — the thing it decided about no longer exists.

Then write ONE proposal file 00-inbox/review-decisions-{{TODAY}}.md, type: note,
with a section per decision containing: the verdict, the EVIDENCE you actually
found (cite note slugs, commit hashes, file paths — not impressions), and the
concrete edit you propose to the decision file. For HOLDS, the proposed edit is
simply a new `review:` date +3 months.

If a decision is REVERSED, also propose a NEW decision file
00-inbox/decision-<slug>-{{TODAY}}.md capturing what we actually do now, with
its own **Why:** and **Tradeoff:** and a `review:` +3 months, and say in it
which decision it supersedes via [[wiki-link]].

CRITICAL:
  - Verdict without evidence is worthless. If you could not find evidence
    either way, say "chưa xác minh" and propose pushing the review date out by
    one month rather than guessing HOLDS. Silently rubber-stamping decisions is
    the exact failure this pass exists to prevent.
  - A decision listed as "KHÔNG CÓ review: hợp lệ" needs a review date assigned
    based on how volatile its subject is — say why you picked that horizon.
  - PROPOSALS ONLY: write into 00-inbox/ and nowhere else. Do NOT edit
    70-decisions/ in place, do NOT edit index.md, do NOT touch sources/, do NOT
    commit. brain-learn matures the inbox afterwards, after human review.

When done, print a table: decision, verdict, one-line reason.
{{DRY_RUN_NOTE}}
