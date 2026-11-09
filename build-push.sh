#!/usr/bin/env bash
# Runs the tests, builds the site's image and pushes it to Docker Hub, logging in with
# DOCKERHUB_USERNAME and DOCKERHUB_TOKEN from .env. The live site doesn't change until
# ./deploy.sh runs.
set -euo pipefail
cd "$(dirname "$0")"
source .do/common.sh

# `docker login` replaces the account saved on this machine, so the credentials only go
# into a throwaway Docker config, which is deleted when the script exits
use_docker_credentials() {
  local host config
  host=$(docker context inspect --format '{{.Endpoints.docker.Host}}')
  config=$(mktemp -d)
  trap "rm -rf '$config'" EXIT
  ln -s "$HOME/.docker/cli-plugins" "$config/cli-plugins"
  # The empty entry stops Docker falling back to the macOS keychain
  echo '{"auths":{"https://index.docker.io/v1/":{}}}' >"$config/config.json"
  export DOCKER_CONFIG=$config DOCKER_HOST=$host
  printf '%s' "$2" | docker login --username "$1" --password-stdin >/dev/null 2>&1 \
    || die "Docker Hub rejected DOCKERHUB_USERNAME or DOCKERHUB_TOKEN"
}

image_tag() {
  local sha
  sha=$(git rev-parse HEAD)
  if [[ -n $(git status --porcelain) ]]; then
    echo "build-push.sh: warning, this image includes uncommitted changes" >&2
    sha="$sha-dirty-$(date +%Y%m%d%H%M%S)"
  fi
  echo "$sha"
}

main() {
  local app_env repo tag
  require_tools curl docker git jq npm
  [[ -d node_modules ]] || die "dependencies aren't installed, run: npm ci"
  docker info >/dev/null 2>&1 || die "Docker isn't running, start Docker Desktop"
  app_env=$(read_env)
  require_env "$app_env" DOCKERHUB_USERNAME DOCKERHUB_TOKEN

  log "Running the tests"
  npm test

  use_docker_credentials "$(env_value "$app_env" DOCKERHUB_USERNAME)" \
    "$(env_value "$app_env" DOCKERHUB_TOKEN)"
  repo=$(image_repo)
  tag=$(image_tag)
  log "Building and pushing $repo:$tag"
  docker buildx build --platform linux/amd64 --pull --push -t "$repo:$tag" .

  # The app spec has no registry credentials, so App Platform can only pull a public image
  curl -fsS "https://hub.docker.com/v2/repositories/$repo/" | jq -e '.is_private == false' >/dev/null \
    || die "$repo isn't public on Docker Hub, so App Platform can't pull it"
  log "Pushed $repo:$tag"
}

main
