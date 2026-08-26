#!/usr/bin/env bash
set -uo pipefail

# Optional ECS-only variables: BAIDU_TOKEN, INDEXNOW_KEY, and the matching
# public IndexNow key file. Keep all tokens out of Git and deployment logs.
SITE_ROOT="${SITE_ROOT:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
SITE_ORIGIN="${SITE_ORIGIN:-https://www.deshengtest.com}"
SITE_ORIGIN="${SITE_ORIGIN%/}"
SITEMAP_FILE="${SITEMAP_FILE:-${SITE_ROOT}/sitemap.xml}"
CURL_MAX_TIME="${CURL_MAX_TIME:-20}"

BAIDU_SITE="${BAIDU_SITE:-www.deshengtest.com}"
BAIDU_ENDPOINT="${BAIDU_ENDPOINT:-http://data.zz.baidu.com/urls}"
INDEXNOW_HOST="${INDEXNOW_HOST:-www.deshengtest.com}"
INDEXNOW_ENDPOINT="${INDEXNOW_ENDPOINT:-https://api.indexnow.org/indexnow}"

log() {
  printf '%s\n' "$*"
}

skip() {
  printf 'SEARCH_SUBMIT_SKIP %s\n' "$*"
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

[[ -f "${SITEMAP_FILE}" ]] || {
  skip "sitemap_missing"
  exit 0
}

mapfile -t URLS < <(sed -n 's:.*<loc>\(.*\)</loc>.*:\1:p' "${SITEMAP_FILE}" | sed '/^[[:space:]]*$/d')
if [[ "${#URLS[@]}" -eq 0 ]]; then
  skip "sitemap_has_no_urls"
  exit 0
fi
if [[ "${#URLS[@]}" -gt 10000 ]]; then
  log "SEARCH_SUBMIT_FAIL sitemap_url_limit"
  exit 1
fi

submit_baidu() {
  if [[ -z "${BAIDU_TOKEN:-}" ]]; then
    skip "baidu_token_missing"
    return 0
  fi

  local endpoint="${BAIDU_ENDPOINT}?site=${BAIDU_SITE}&token=${BAIDU_TOKEN}"
  local body_file
  local error_file
  local status
  body_file="$(mktemp)"
  error_file="$(mktemp)"

  if ! status="$(printf '%s\n' "${URLS[@]}" | curl -sS --max-time "${CURL_MAX_TIME}" \
    -X POST -H 'Content-Type: text/plain' --data-binary @- \
    -o "${body_file}" -w '%{http_code}' "${endpoint}" 2>"${error_file}")"; then
    rm -f "${body_file}" "${error_file}"
    log "BAIDU_SUBMIT_FAIL transport_error"
    return 1
  fi

  rm -f "${error_file}"
  if [[ "${status}" != 2* ]]; then
    rm -f "${body_file}"
    log "BAIDU_SUBMIT_FAIL status=${status}"
    return 1
  fi

  rm -f "${body_file}"
  log "BAIDU_SUBMIT_OK status=${status} urls=${#URLS[@]}"
  return 0
}

submit_indexnow() {
  if [[ -z "${INDEXNOW_KEY:-}" ]]; then
    skip "indexnow_key_missing"
    return 0
  fi

  local key_file="${INDEXNOW_KEY_FILE:-${SITE_ROOT}/${INDEXNOW_KEY}.txt}"
  local key_location="${INDEXNOW_KEY_LOCATION:-${SITE_ORIGIN}/${INDEXNOW_KEY}.txt}"
  local hosted_key
  local body
  local body_file
  local error_file
  local status
  local separator=""

  if [[ ! -f "${key_file}" ]]; then
    skip "indexnow_key_file_missing"
    return 0
  fi

  hosted_key="$(tr -d '\r\n' < "${key_file}")"
  if [[ "${hosted_key}" != "${INDEXNOW_KEY}" ]]; then
    log "INDEXNOW_SUBMIT_FAIL key_file_mismatch"
    return 1
  fi

  body="{\"host\":\"$(json_escape "${INDEXNOW_HOST}")\",\"key\":\"$(json_escape "${INDEXNOW_KEY}")\",\"keyLocation\":\"$(json_escape "${key_location}")\",\"urlList\":["
  for url in "${URLS[@]}"; do
    body+="${separator}\"$(json_escape "${url}")\""
    separator=","
  done
  body+=']}'

  body_file="$(mktemp)"
  error_file="$(mktemp)"
  if ! status="$(curl -sS --max-time "${CURL_MAX_TIME}" \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data-binary "${body}" -o "${body_file}" -w '%{http_code}' \
    "${INDEXNOW_ENDPOINT}" 2>"${error_file}")"; then
    rm -f "${body_file}" "${error_file}"
    log "INDEXNOW_SUBMIT_FAIL transport_error"
    return 1
  fi

  rm -f "${error_file}"
  if [[ "${status}" != 2* ]]; then
    rm -f "${body_file}"
    log "INDEXNOW_SUBMIT_FAIL status=${status}"
    return 1
  fi

  rm -f "${body_file}"
  log "INDEXNOW_SUBMIT_OK status=${status} urls=${#URLS[@]}"
  return 0
}

failures=0
submit_baidu || failures=1
submit_indexnow || failures=1

if [[ "${failures}" -ne 0 ]]; then
  exit 1
fi

log "SEARCH_SUBMIT_DONE urls=${#URLS[@]}"
