#!/usr/bin/env bash
# Dọn artifact React cũ trong repo artifacts Avada.
# Dry-run mặc định; --apply mới xoá + commit. Không bao giờ push.
set -euo pipefail

REPO="${HOME}/projects/joy-subscription-artifacts"
SINCE="2 weeks ago"
APPLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --since) SINCE="$2"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    -h|--help)
      echo "usage: clean-artifacts.sh [repo-path] [--since \"2 weeks ago\"] [--apply]"; exit 0 ;;
    -*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) REPO="$1"; shift ;;
  esac
done

die() { printf '\n\033[31mABORT:\033[0m %s\n' "$1" >&2; exit 1; }
info() { printf '\033[36m==\033[0m %s\n' "$1"; }

[ -d "$REPO/.git" ] || die "$REPO không phải git repo"
cd "$REPO"

BRANCH=$(git branch --show-current)
[ -n "$BRANCH" ] || die "đang ở detached HEAD"

# --- Guard 1: repo phải sync với origin ---------------------------------
info "fetch origin/$BRANCH"
git fetch --quiet origin "$BRANCH"
BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH")
AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD")
if [ "$BEHIND" -gt 0 ]; then
  die "HEAD đang behind origin/$BRANCH $BEHIND commit.
  Local cũ => changed_files rỗng hoặc thiếu => danh sách xoá sẽ gồm cả file build mới. Chạy: git pull --ff-only"
fi
[ "$AHEAD" -eq 0 ] || info "cảnh báo: đang ahead origin/$BRANCH $AHEAD commit (lần dọn trước chưa push?)"

# --- Guard 3: phải có build mới trong window ----------------------------
LAST_TS=$(git log -1 --format=%ct -- static/assets static/scripttag)
[ -n "$LAST_TS" ] || die "không có commit nào chạm static/assets|static/scripttag"
AGE_DAYS=$(( ($(date +%s) - LAST_TS) / 86400 ))
info "commit gần nhất chạm static/: $(git log -1 --format='%h %ad' --date=short -- static/assets static/scripttag) (${AGE_DAYS} ngày trước)"

# --- Sinh 3 danh sách (đúng convention team, track trong git) -----------
info "sinh changed_files.txt / all_files.txt / files_to_remove.txt (--since \"$SINCE\")"
git log --name-only --pretty="format:" --since="$SINCE" -- static/assets static/scripttag \
  | sed '/^$/d' | sort -u > changed_files.txt
git ls-tree -r HEAD --name-only static/assets static/scripttag | sort > all_files.txt
comm -23 all_files.txt changed_files.txt > files_to_remove.txt

N_CHANGED=$(wc -l < changed_files.txt | tr -d ' ')
N_ALL=$(wc -l < all_files.txt | tr -d ' ')
N_REMOVE=$(wc -l < files_to_remove.txt | tr -d ' ')

# --- Guard 2: changed rỗng = window không phủ commit nào ----------------
[ "$N_CHANGED" -gt 0 ] || die "changed_files.txt RỖNG — window \"$SINCE\" không phủ commit nào.
  Không phải 'không có gì đổi', mà là dữ liệu vô nghĩa: mọi file sẽ bị coi là cũ."

[ "$N_REMOVE" -gt 0 ] || { info "không có file nào cần xoá — repo đã sạch"; exit 0; }

# --- Guard 4: tỉ lệ xoá bất thường --------------------------------------
PCT=$(( N_REMOVE * 100 / N_ALL ))
[ "$PCT" -lt 90 ] || die "sẽ xoá ${PCT}% tổng file ($N_REMOVE/$N_ALL) — gần như chắc chắn danh sách sai."

# --- Guard 5: entrypoint URL cố định KHÔNG BAO GIỜ xoá ------------------
# Các file này không có content hash, storefront theme trỏ thẳng vào URL cố định.
# Chúng bị ghi đè mỗi build (không tích luỹ) nên không phải nguồn phình repo;
# nhưng app nào không build trong window thì entrypoint của nó rơi vào diện xoá => chết widget.
ENTRY_RE='(main\.min\.js|/index\.html|/embed-template\.html|/standalone\.html)$'
ENTRY=$(grep -E "$ENTRY_RE" files_to_remove.txt || true)
if [ -n "$ENTRY" ]; then
  printf '\033[33m== bảo vệ %s entrypoint (không hash) khỏi bị xoá:\033[0m\n' "$(printf '%s\n' "$ENTRY" | wc -l | tr -d ' ')"
  printf '%s\n' "$ENTRY" | sed 's/^/    /'
  grep -Ev "$ENTRY_RE" files_to_remove.txt > files_to_remove.tmp && mv files_to_remove.tmp files_to_remove.txt
  N_REMOVE=$(wc -l < files_to_remove.txt | tr -d ' ')
  [ "$N_REMOVE" -gt 0 ] || { info "sau khi loại entrypoint thì không còn gì để xoá"; exit 0; }
fi

SIZE=$(tr '\n' '\0' < files_to_remove.txt | xargs -0 du -ch 2>/dev/null | tail -1 | cut -f1 || echo '?')

cat <<EOF

  window       : $SINCE
  đang có      : $N_ALL file trên HEAD
  sẽ xoá       : $N_REMOVE file (${PCT}%), ~$SIZE
  còn lại      : $(( N_ALL - N_REMOVE )) file
  (tham chiếu  : $N_CHANGED đường dẫn từng xuất hiện trong commit của window,
                 gồm cả bản đã bị build sau ghi đè)

  sample:
$(head -3 files_to_remove.txt | sed 's/^/    /')
    ...
$(tail -2 files_to_remove.txt | sed 's/^/    /')

EOF

if [ "$APPLY" -ne 1 ]; then
  info "DRY-RUN — chưa xoá gì. Chạy lại với --apply để xoá + commit."
  exit 0
fi

info "xoá $N_REMOVE file"
while IFS= read -r f; do [ -f "$f" ] && rm -f "$f"; done < files_to_remove.txt

info "commit (KHÔNG push)"
git add -A static/assets static/scripttag all_files.txt changed_files.txt files_to_remove.txt
git commit -q -m "chore - artifacts - remove ${N_REMOVE} artifacts older than ${SINCE}"
git show --stat --oneline HEAD | head -5

cat <<EOF

  Đã commit trên nhánh $BRANCH, CHƯA push.
  Review rồi tự push:  cd $REPO && git push origin $BRANCH

EOF
