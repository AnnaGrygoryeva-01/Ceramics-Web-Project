#!/usr/bin/env bash
# Builds the site's image, pushes it to Docker Hub and rolls it out to App Platform.
#
#   ./deploy.sh          deploy
#   ./deploy.sh --check  validate everything, print the spec, build and deploy nothing
#
# .do/app.json holds the app's settings. Its env vars come from .env, with
# .env.production taking priority. Each deploy overwrites whatever is on App Platform
# with these, including changes made in the dashboard.
set -euo pipefail
cd "$(dirname "$0")"

SPEC_TEMPLATE=.do/app.json
REQUIRED_ENV=(DATABASE_URL DATABASE_TOKEN)

source .do/deploy-lib.sh

main() {
  local name repo tag app_env spec
  check_tools
  name=$(jq -r .name "$SPEC_TEMPLATE")
  repo=$(jq -r '.services[0].image | "\(.registry)/\(.repository)"' "$SPEC_TEMPLATE")
  app_env=$(read_env)
  log_in "$app_env"
  tag=$(image_tag)
  spec=$(printf '%s' "$app_env" | render_spec "$tag")

  log "Validating the app spec for team $(doctl account get --format Team --no-header)"
  printf '%s' "$spec" | doctl apps spec validate - >/dev/null
  if [[ ${1:-} == --check ]]; then
    printf '%s' "$spec" | jq '.services[0].envs[].value = "<redacted>"'
    exit 0
  fi

  log "Building and pushing $repo:$tag"
  push_image "$repo" "$tag"
  log "Deploying $name"
  printf '%s' "$spec" | doctl apps create --spec - --upsert --update-sources --wait
  verify_live "$name" "$tag"
}

case "${1:-}" in
  "" | --check) main "$@" ;;
  *) die "usage: ./deploy.sh [--check]" ;;
esac
