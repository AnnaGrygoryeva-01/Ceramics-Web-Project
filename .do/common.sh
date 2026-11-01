# Shared by build-push.sh and deploy.sh, which source this file.

die() { echo "$(basename "$0"): $*" >&2; exit 1; }
log() { printf '\n==> %s\n' "$*"; }

require_tools() {
  local tool
  for tool in "$@"; do
    command -v "$tool" >/dev/null || die "$tool is not installed"
  done
}

# Prints .env and .env.production as one JSON object, .env.production taking priority
read_env() {
  local files=() file
  for file in .env .env.production; do
    if [[ -f $file ]]; then files+=("$file"); fi
  done
  if [[ ${#files[@]} -eq 0 ]]; then echo '{}'; return; fi
  awk 1 "${files[@]}" | jq -Rn -f .do/read-env.jq
}

# Prints one value from read_env's JSON
env_value() { printf '%s' "$1" | jq -r --arg key "$2" '.[$key] // ""'; }

# Takes read_env's JSON, then the keys that must have a value
require_env() {
  local app_env=$1 key
  shift
  for key in "$@"; do
    [[ -n $(env_value "$app_env" "$key") ]] || die "$key is missing, add it to .env"
  done
}

image_repo() { jq -r '.services[0].image | "\(.registry)/\(.repository)"' .do/app.json; }
