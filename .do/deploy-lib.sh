# Helpers for deploy.sh, which sources this file and sets SPEC_TEMPLATE and REQUIRED_ENV.

# Credentials for this script only. Everything else in .env goes to the running app.
DEPLOY_ONLY_ENV='["DOCKERHUB_USERNAME","DOCKERHUB_TOKEN","DIGITALOCEAN_ACCESS_TOKEN"]'

die() { echo "deploy: $*" >&2; exit 1; }
log() { printf '\n==> %s\n' "$*"; }

check_tools() {
  local tool
  for tool in curl docker doctl git jq; do
    command -v "$tool" >/dev/null || die "$tool is not installed"
  done
  docker info >/dev/null 2>&1 || die "Docker isn't running, start Docker Desktop"
}

# Uses the credentials in .env when they're set, otherwise this machine's own logins
log_in() {
  local user token do_token
  user=$(printf '%s' "$1" | jq -r '.DOCKERHUB_USERNAME // ""')
  token=$(printf '%s' "$1" | jq -r '.DOCKERHUB_TOKEN // ""')
  do_token=$(printf '%s' "$1" | jq -r '.DIGITALOCEAN_ACCESS_TOKEN // ""')

  if [[ -n $user && -n $token ]]; then
    printf '%s' "$token" | docker login --username "$user" --password-stdin >/dev/null
  fi
  if [[ -n $do_token ]]; then export DIGITALOCEAN_ACCESS_TOKEN=$do_token; fi
  doctl account get >/dev/null 2>&1 \
    || die "doctl can't log in, set DIGITALOCEAN_ACCESS_TOKEN in .env or run: doctl auth init"
}

read_env() {
  local files=() file key env_json
  for file in .env .env.production; do
    if [[ -f $file ]]; then files+=("$file"); fi
  done
  [[ ${#files[@]} -gt 0 ]] || die "no .env or .env.production found"

  env_json=$(awk 1 "${files[@]}" | jq -Rn -f .do/read-env.jq)
  for key in "${REQUIRED_ENV[@]}"; do
    printf '%s' "$env_json" | jq -e --arg key "$key" '(.[$key] // "") != ""' >/dev/null \
      || die "$key is missing from ${files[*]}"
  done
  printf '%s' "$env_json"
}

image_tag() {
  local sha
  sha=$(git rev-parse HEAD)
  if [[ -n $(git status --porcelain) ]]; then
    echo "deploy: warning, this image includes uncommitted changes" >&2
    sha="$sha-dirty-$(date +%Y%m%d%H%M%S)"
  fi
  echo "$sha"
}

# Takes the env vars on stdin so that secrets stay out of process arguments
render_spec() {
  jq --slurpfile env /dev/stdin --arg tag "$1" --argjson deployOnly "$DEPLOY_ONLY_ENV" '
    .services[0].image.tag = $tag
    | .services[0].envs = ($env[0] | to_entries
        | map(select(.value != "" and (.key | IN($deployOnly[]) | not))
        | {key, value, scope: "RUN_TIME", type: "SECRET"}))' "$SPEC_TEMPLATE"
}

push_image() {
  docker buildx build --platform linux/amd64 --pull --push -t "$1:$2" .
  # The spec has no registry credentials, so App Platform can only pull a public image
  curl -fsS "https://hub.docker.com/v2/repositories/$1/" | jq -e '.is_private == false' >/dev/null \
    || die "$1 isn't public on Docker Hub, so App Platform can't pull it"
}

# --wait alone doesn't prove the new image is serving, so check that directly.
# Uses the default URL because the domain's certificate can lag behind on a first deploy.
verify_live() {
  local app tag url
  app=$(doctl apps list -o json | jq -c --arg name "$1" '.[] | select(.spec.name == $name)')
  tag=$(jq -r '.active_deployment.spec.services[0].image.tag' <<<"$app")
  url=$(jq -r '.default_ingress' <<<"$app")
  [[ $tag == "$2" ]] || die "live deployment runs '$tag', expected '$2'"

  curl -fsS --retry 5 --retry-delay 5 --retry-all-errors -o /dev/null "$url/api/collections" \
    || die "$url/api/collections failed, the app may not be reaching the database"
  log "Live: $url and https://annagryceramics.com"
}
