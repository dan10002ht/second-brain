---
type: resource
title: Semantic search layer (sqlite-vec)
tags: [meta, tooling, search]
---

# Semantic search over my-brain (optional layer)

A small, **local-only** semantic search over every markdown note, built on
[`sqlite-vec`](https://github.com/asg017/sqlite-vec). Two scripts:

- `bin/brain-index` — walk `.md` files, chunk them, embed each chunk locally,
  store vectors + metadata in `.index/brain.db`.
- `bin/brain-search "<query>"` — embed the query locally and return the top-K
  most similar chunks (path + heading + snippet + score).

## When to use it (read this first)

Per the research baked into `CLAUDE.md` and `README.md`: **you probably don't
need this yet.** Below roughly **~100 sources / a few hundred pages**,
`index.md` + reading files directly + `ripgrep` are faster, simpler, and give
better recall than embeddings. The knowledge graph is already free via
`[[wiki-links]]`.

This layer exists so it is *ready* the day the corpus crosses that threshold or
lexical search (ripgrep) starts missing conceptually-related notes phrased with
different words. Turn it on then; ignore it until then.

The index is disposable: `.index/` and `*.db` are git-ignored, so the vector DB
is never committed. Rebuild any time.

## Privacy

Embeddings are computed **entirely on your machine**. Note content is never sent
to any cloud API. (Anthropic has no embeddings API; nothing here calls one.)

## Install

```bash
cd ~/projects/my-brain
pip install -r requirements-search.txt      # installs sqlite-vec
```

Then pick ONE embedding backend:

### Backend A — Ollama (recommended, preferred automatically)

```bash
# install Ollama (https://ollama.com), then:
ollama pull nomic-embed-text
# make sure the server is running (Ollama app, or `ollama serve`)
```

- Model: `nomic-embed-text` (768-dim), fast, good quality, no Python ML stack.
- Reached over HTTP at `http://localhost:11434`.

### Backend B — sentence-transformers (fallback)

```bash
pip install sentence-transformers        # (also uncomment it in requirements-search.txt)
```

- Model: `all-MiniLM-L6-v2` (384-dim). Pure-Python/torch, no server needed.
- Heavier install (pulls in torch); first run downloads the model once.

**Auto-selection:** both scripts probe `http://localhost:11434` first. If Ollama
is reachable they use it; otherwise they fall back to sentence-transformers. If
**neither** is available they exit with a clear message instead of crashing.

The chosen backend name is stored in the DB. If you later switch backends (or the
embedding dimension changes), `brain-index` detects the mismatch and rebuilds
automatically — you can't accidentally mix vector spaces.

Override defaults via env vars: `OLLAMA_URL`, `BRAIN_OLLAMA_MODEL`, `BRAIN_ST_MODEL`.

## Usage

```bash
export PATH="$HOME/projects/my-brain/bin:$PATH"

brain-index            # incremental: only re-embeds changed files
brain-index --full     # wipe and rebuild from scratch
brain-index -v         # verbose (per-file chunk counts, backend info)

brain-search "atomic note structure"
brain-search -k 10 "rust ownership and borrowing"
brain-search --full-text "spaced repetition"   # print full chunk, not a snippet
```

## How it works

1. **Walk** — `bin/brain-index` recurses from the brain root over `*.md`,
   skipping `.git/`, `.index/`, `.obsidian/`, and any path component starting
   with `_` (convention for private/scratch files).
2. **Chunk** — YAML frontmatter is stripped, then each file is split on markdown
   headings (`#`..`######`). Sections longer than ~500 tokens (~2000 chars) are
   sub-split on paragraph boundaries. Each chunk keeps its file path + heading.
3. **Embed (local)** — each chunk's text is embedded via the selected backend.
4. **Store** — vectors go into a `vec0` virtual table (`vec_chunks`); text and
   metadata go into a plain `chunks` table; per-file sha256 goes into `files`.
5. **Incremental** — on re-run, files whose sha256 is unchanged are skipped;
   changed files are re-chunked and re-embedded; deleted files are pruned.
6. **Search** — `bin/brain-search` embeds the query with the *same* backend and
   runs a KNN `MATCH` query, ordering by distance. Distance is reported as a
   `1/(1+d)` similarity-ish score in `[0,1]` (higher = closer).

## Files

| File | Role |
|------|------|
| `bin/brain-index` | build/update the vector index |
| `bin/brain-search` | query the index |
| `requirements-search.txt` | pinned Python deps (`sqlite-vec`, optional fallback) |
| `.index/brain.db` | the vector DB (git-ignored, disposable) |

## Troubleshooting

- *"no local embedding backend available"* — start Ollama (`ollama serve` +
  `ollama pull nomic-embed-text`) or `pip install sentence-transformers`.
- *"sqlite-vec not installed"* — `pip install -r requirements-search.txt`.
- *"no index at .index/brain.db"* — run `brain-index` first.
- Switched machines/backends and results look off — `brain-index --full`.
