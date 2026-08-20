#!/usr/bin/env python3
"""Đo verifier chậm ở đâu — model round-trip hay lệnh chạy thật.

Nguồn: transcript Claude Code (~/.claude/projects/*/*.jsonl).
  - Wall time mỗi lần verify = Agent(verifier) tool_use  →  <task-notification> khớp tool-use-id.
    KHÔNG dùng tool_result của Agent: nó trả về ngay ("Async agent launched"), không phải lúc xong.
  - Bóc tách trong: đọc <output-file> trong task-notification (transcript nội bộ của subagent).
    File này bị dọn theo thời gian nên n ở đây luôn nhỏ hơn n wall time.

Chạy:  python3 measure-verify.py [tên-agent, mặc định verifier]
"""
import json, glob, os, re, sys, collections, statistics as st
from datetime import datetime

AGENT = sys.argv[1] if len(sys.argv) > 1 else 'verifier'
NOTIF = re.compile(r'<tool-use-id>(.*?)</tool-use-id>')
OUTF  = re.compile(r'<output-file>(.*?)</output-file>')

def ts(s): return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
def blocks(o):
    m = o.get('message')
    c = m.get('content') if isinstance(m, dict) else None
    return c if isinstance(c, list) else []

runs = []   # (wall_giây, output_file, mô tả, ngày)
for f in glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')):
    calls = {}
    for line in open(f, errors='ignore'):
        try: o = json.loads(line)
        except Exception: continue
        t = o.get('timestamp')
        if not t: continue
        for b in blocks(o):
            if b.get('type') == 'tool_use' and b.get('name') == 'Agent':
                i = b.get('input') or {}
                if (i.get('subagent_type') or '') == AGENT:
                    calls[b.get('id')] = (ts(t), i.get('description') or '', t[:10])
        m = o.get('message')
        txt = m.get('content') if isinstance(m, dict) else None
        if isinstance(txt, str) and '<task-notification>' in txt:
            k = NOTIF.search(txt)
            if k and k.group(1) in calls:
                start, desc, day = calls.pop(k.group(1))
                of = OUTF.search(txt)
                runs.append((ts(t) - start, of.group(1) if of else '', desc, day))

def q(xs, p): xs = sorted(xs); return xs[max(0, int(p * len(xs)) - 1)]

if not runs: sys.exit(f'không tìm thấy lần chạy nào của agent "{AGENT}"')
w = [r[0] for r in runs]
print(f'=== {AGENT}: {len(runs)} lần chạy')
print(f'wall time: median {st.median(w)/60:.1f}p · p90 {q(w,.9)/60:.1f}p · max {max(w)/60:.1f}p')
for lo, hi, lbl in [(0,180,'<3p'),(180,360,'3-6p'),(360,600,'6-10p'),(600,1200,'10-20p'),(1200,9e9,'>20p')]:
    n = sum(1 for x in w if lo <= x < hi)
    print(f'  {lbl:7} {n:4}  {100*n/len(w):3.0f}%')

def cls(c):
    c = c.strip()
    if re.search(r'\b(jest|vitest|yarn test|npm test|npm run test|go test|pytest|mvn|gradle)\b', c): return 'test'
    if re.search(r'\b(tsc|npm run build|yarn build|next build)\b', c): return 'build/tsc'
    if re.search(r'\b(eslint|lint)\b', c): return 'lint'
    if re.search(r'\bgit (diff|status|log|show)\b', c): return 'git đọc'
    if re.search(r'(?:^|&&|\||;)\s*(cat|sed -n|head|tail|wc|ls|find)\b', c): return 'đọc file'
    if re.search(r'\b(rg|grep)\b', c): return 'grep'
    if re.search(r'\b(sleep|until |while \[)', c): return 'chờ/poll'
    return 'khác'

kind, kdur, rows = collections.Counter(), collections.defaultdict(float), []
for wall, path, desc, day in runs:
    if not path or not os.path.exists(path): continue
    pend, bash, turns = {}, 0.0, 0
    for line in open(path, errors='ignore'):
        try: o = json.loads(line)
        except Exception: continue
        t = o.get('timestamp')
        m = o.get('message')
        if isinstance(m, dict) and m.get('role') == 'assistant': turns += 1
        if not t: continue
        for b in blocks(o):
            if b.get('type') == 'tool_use':
                pend[b.get('id')] = (ts(t), b.get('name'), (b.get('input') or {}).get('command', ''))
            elif b.get('type') == 'tool_result':
                p = pend.pop(b.get('tool_use_id'), None)
                if not p: continue
                d = ts(t) - p[0]
                if not (0 <= d < 3600): continue
                if p[1] == 'Bash':
                    bash += d; k = cls(p[2]); kind[k] += 1; kdur[k] += d
    if turns: rows.append((wall, bash, turns, desc, day))

if not rows:
    sys.exit('\nkhông còn transcript nội bộ nào (đã bị dọn) — chỉ đo được wall time')

print(f'\n=== bóc tách ({len(rows)} lần còn transcript nội bộ)')
print(f'lệnh chạy thật : median {st.median([r[1] for r in rows]):.0f}s')
print(f'lượt model     : median {st.median([r[2] for r in rows]):.0f}')
share = [100 * r[1] / r[0] for r in rows if r[0] > 0]
lat = [(r[0] - r[1]) / r[2] for r in rows]
print(f'% là lệnh thật : median {st.median(share):.0f}%   → round-trip model {100-st.median(share):.0f}%')
print(f'giây / lượt    : median {st.median(lat):.1f}s   (>6s mới là dấu hiệu bị bóp)')

tot, td = sum(kind.values()), sum(kdur.values()) or 1
print(f'\n{"loại lệnh":12}{"call":>7}{"%call":>7}{"%thời gian":>12}')
for k, n in kind.most_common():
    print(f'{k:12}{n:7}{100*n/tot:6.0f}%{100*kdur[k]/td:11.0f}%')
print(f'\n{tot/len(rows):.0f} Bash call mỗi lần verify')
