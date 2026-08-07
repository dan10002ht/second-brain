You are the maintainer of this markdown knowledge brain ("my-brain"). Read
index.md then CLAUDE.md first to learn the schema and rules.

Below are condensed transcripts of NEW Claude Code sessions per project. Each
file has user turns (lines starting **U:**) and short assistant summaries (A:).
{{FILES_BLOCK}}

Your task: for EACH project's file, distill only DURABLE, reusable learnings:
  - feedback on how to work, decisions (with why), bugs with root cause,
    reusable techniques/commands, gotchas.

Then write proposals into 00-inbox/. Choose the `type:` per learning — do NOT
default everything to note. Route by what the learning actually is:

  A) The per-project session digest -> 00-inbox/digest-<project>-{{TODAY}}.md
     type: note. This is the default carrier for project-specific findings
     (bugs, one-off gotchas, what happened this session). Body grouped by:
     Bugs / Techniques / Context.

  B) A durable instruction about HOW I want to be worked with — a correction I
     gave, a working style I confirmed, a convention to follow from now on
     -> 00-inbox/feedback-<slug>-{{TODAY}}.md, type: feedback.
     MUST contain a **Why:** line and a **How to apply:** line.

  C) A real decision with a road not taken — chose tech X over Y, changed
     direction, dropped an approach
     -> 00-inbox/decision-<slug>-{{TODAY}}.md, type: decision.
     MUST contain a **Why:** section and a **Tradeoff:** section. Add a review
     date +3 months as a `review:` frontmatter field in YYYY-MM-DD form.

  D) A reusable technique/concept that outlives this project — a pattern,
     command, or piece of knowledge I would want when working on something else
     -> 00-inbox/resource-<slug>-{{TODAY}}.md, type: resource.

Every file gets lightweight frontmatter: type, title, summary (1-line TLDR),
tags (only from tags.md — declare nothing new), created: {{TODAY}},
source: (name the project + "session history"), plus suggested [[wiki-links]].

Routing discipline: B, C, and D are the EXCEPTION, not the rule. Most sessions
produce only (A), and many produce nothing at all. Emit a feedback/decision/
resource file only when the learning is genuinely durable and would still be
true and useful three months from now on a different project. When in doubt,
fold it into the (A) digest instead of creating a standalone file.

CRITICAL quality filter:
  - If a project's new sessions contain nothing durable (routine edits, chit-
    chat, or facts ALREADY captured in the brain — check existing notes), write
    NO file for that project. An empty digest is a SUCCESS. Do not pad.
  - Mark anything you are not sure of as "chưa xác minh".
  - These are PROPOSALS only: write into 00-inbox/ ONLY. Do NOT move/mature
    notes, do NOT edit index.md, do NOT touch anything under sources/, do NOT
    commit. brain-learn will mature them later after human review.

When done, print a concise summary: which projects produced a proposal (with
path) and which were skipped as "nothing durable", and why.
{{DRY_RUN_NOTE}}
