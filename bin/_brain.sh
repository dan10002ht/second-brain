#!/usr/bin/env bash
# _brain.sh — thư viện dùng chung cho các job của my-brain. KHÔNG chạy trực tiếp.
#
# Dùng: source "$(dirname "$0")/_brain.sh"
#
# Cung cấp:
#   brain_log <msg>              in log có timestamp ra stderr
#   brain_die <msg>              in lỗi + exit 1
#   render_prompt <tpl> K=V ...  nạp prompt từ prompts/<tpl> và thay {{K}} bằng V
#
# ---------------------------------------------------------------------------
# Vì sao prompt phải nằm trong file, không nhúng trong bash:
#
# Ba job (digest/gitlog/weekly) từng nhúng prompt bằng heredoc KHÔNG quote
# (`<<PROMPT_EOF`) để nội suy được $TODAY. Nhưng heredoc không quote thì shell
# nội suy MỌI thứ, kể cả backtick — nên một câu hướng dẫn viết `type:` bị chạy
# như lệnh, stderr đầy "type:: command not found", và prompt gửi đi bị KHUYẾT
# đúng chỗ đó. Lỗi này chạy im lặng mỗi tối và không cách nào phát hiện từ
# output.
#
# render_prompt cắt gốc cả class lỗi đó: template là file .md thuần, thay thế
# bằng Python trên chuỗi literal (không phải shell expansion), nên backtick,
# $, và dấu nháy trong prompt chỉ là ký tự. Đổi lại prompt phải khai báo biến
# bằng {{TÊN}} — và mọi {{...}} chưa được thay sẽ làm job DỪNG, không gửi đi
# một prompt hỏng.
# ---------------------------------------------------------------------------

brain_log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
brain_die() { printf '%s\n' "$*" >&2; exit 1; }

# render_prompt <template-name> [KEY=VALUE ...]
# Template nằm ở $BRAIN_DIR/prompts/<template-name>. Giá trị được phép nhiều dòng.
render_prompt() {
  local tpl_name="$1"; shift
  local tpl_path="${BRAIN_DIR:-$HOME/projects/my-brain}/prompts/$tpl_name"
  [ -f "$tpl_path" ] || brain_die "render_prompt: không thấy template: $tpl_path"

  BRAIN_TPL_PATH="$tpl_path" python3 - "$@" <<'PY'
import os, re, sys

path = os.environ["BRAIN_TPL_PATH"]
with open(path, encoding="utf-8") as fh:
    text = fh.read()

for arg in sys.argv[1:]:
    key, sep, value = arg.partition("=")
    if not sep:
        sys.stderr.write(f"render_prompt: tham số sai dạng (cần KEY=VALUE): {arg!r}\n")
        sys.exit(2)
    # Thay literal — không regex, không shell expansion. Backtick/$ trong
    # template lẫn trong value đều chỉ là ký tự.
    text = text.replace("{{" + key + "}}", value)

# Placeholder sót lại = prompt khuyết. Thà dừng job còn hơn gửi prompt hỏng cho
# LLM rồi nhận về kết quả sai mà không ai biết.
leftover = sorted(set(re.findall(r"\{\{[A-Z0-9_]+\}\}", text)))
if leftover:
    sys.stderr.write(
        f"render_prompt: {os.path.basename(path)} còn placeholder chưa thay: "
        + ", ".join(leftover) + "\n"
    )
    sys.exit(3)

sys.stdout.write(text)
PY
}
