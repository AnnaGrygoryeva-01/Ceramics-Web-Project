#!/usr/bin/env bash
# Puts an image from Docker Hub live on App Platform. Run ./build-push.sh first.
#
#   ./deploy.sh                 deploy the newest image on Docker Hub
#   ./deploy.sh <tag>           deploy that image, which is also how to roll back
#   ./deploy.sh --check [tag]   validate everything, print the spec, change nothing
#
# .do/app.json holds the app's settings. Its env vars come from .env, with
# .env.production taking priority. Each deploy overwrites whatever is on App Platform
# with these, including changes made in the dashboard.
set -euo pipefail
cd "$(dirname "$0")"
source .do/common.sh

SPEC_TEMPLATE=.do/app.json
# Credentials for the scripts. Everything else in .env goes to the running app.
SCRIPT_ONLY_ENV='["DOCKERHUB_USERNAME","DOCKERHUB_TOKEN","DIGITALOCEAN_ACCESS_TOKEN"]'

# Uses DIGITALOCEAN_ACCESS_TOKEN from .env when it's set, otherwise doctl's own login
log_in() {
  local do_token
  do_token=$(env_value "$1" DIGITALOCEAN_ACCESS_TOKEN)
  if [[ -n $do_token ]]; then export DIGITALOCEAN_ACCESS_TOKEN=$do_token; fi
  doctl account get >/dev/null 2>&1 \
    || die "doctl can't log in, set DIGITALOCEAN_ACCESS_TOKEN in .env or run: doctl auth init"
}

# A real tag rather than a moving `latest`: App Platform only redeploys when the tag in
# the spec changes, and a real tag can be rolled back to
newest_tag() {
  curl -fsS "https://hub.docker.com/v2/repositories/$1/tags?page_size=1&ordering=last_updated" \
    | jq -r '.results[0].name // empty'
}

# Takes the env vars on stdin so that secrets stay out of process arguments
render_spec() {
  jq --slurpfile env /dev/stdin --arg tag "$1" --argjson scriptOnly "$SCRIPT_ONLY_ENV" '
    .services[0].image.tag = $tag
    | .services[0].envs = ($env[0] | to_entries
        | map(select(.value != "" and (.key | IN($scriptOnly[]) | not))
        | {key, value, scope: "RUN_TIME", type: "SECRET"}))' "$SPEC_TEMPLATE"
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

main() {
  local check=false tag="" name repo app_env spec
  while [[ $# -gt 0 ]]; do
    case $1 in
      --check) check=true ;;
      -*) die "usage: ./deploy.sh [--check] [tag]" ;;
      *) tag=$1 ;;
    esac
    shift
  done

  require_tools curl doctl jq
  name=$(jq -r .name "$SPEC_TEMPLATE")
  repo=$(image_repo)
  app_env=$(read_env)
  require_env "$app_env" DATABASE_URL DATABASE_TOKEN
  log_in "$app_env"

  if [[ -z $tag ]]; then tag=$(newest_tag "$repo"); fi
  [[ -n $tag ]] || die "$repo has no images yet, run ./build-push.sh first"
  curl -fsS -o /dev/null "https://hub.docker.com/v2/repositories/$repo/tags/$tag" 2>/dev/null \
    || die "$repo has no image tagged $tag"
  spec=$(printf '%s' "$app_env" | render_spec "$tag")

  log "Validating $repo:$tag for team $(doctl account get --format Team --no-header)"
  printf '%s' "$spec" | doctl apps spec validate - >/dev/null
  if $check; then
    printf '%s' "$spec" | jq '.services[0].envs[].value = "<redacted>"'
    exit 0
  fi

  log "Deploying $repo:$tag"
  printf '%s' "$spec" | doctl apps create --spec - --upsert --update-sources --wait
  verify_live "$name" "$tag"
}

main "$@"
