#!/usr/bin/env bash
# Upload an allure-results directory to the qaa-allure portal (Allure 3).
# The directory contents are zipped into a single `allure-results.zip`
# (the server transparently extracts it before running the Allure CLI).
#
# Required env:
#   QAA_ALLURE_API_KEY  — API key sent as `x-api-key`
#   QAA_ALLURE_PATH     — path to the allure-results directory
#   QAA_ALLURE_NAME     — human-readable run name
#
# Optional env:
#   QAA_ALLURE_HOST     — server base URL (default: https://allure-new.aws.sbx.ldg-tech.com)
#   QAA_ALLURE_TAGS     — JSON array of tag strings, e.g. '["desktop","smoke"]'
#   QAA_ALLURE_HISTORY  — historyLevel, 1–200 (default: 50)
#   GITHUB_OUTPUT       — when set, writes report_id / report_url / view_url
#
# Exits 0 with a warning when the API key is empty or the path has no files,
# so the composite stays safe to run before the secret is provisioned.

set -euo pipefail

: "${QAA_ALLURE_PATH:?QAA_ALLURE_PATH is required}"
: "${QAA_ALLURE_NAME:?QAA_ALLURE_NAME is required}"
QAA_ALLURE_API_KEY="${QAA_ALLURE_API_KEY:-}"
QAA_ALLURE_HOST="${QAA_ALLURE_HOST:-https://allure-new.aws.sbx.ldg-tech.com}"
QAA_ALLURE_TAGS="${QAA_ALLURE_TAGS:-}"
QAA_ALLURE_HISTORY="${QAA_ALLURE_HISTORY:-50}"

warn() { echo "::warning title=qaa-allure::$*"; }
fail() { echo "::error title=qaa-allure::$*"; exit 1; }

if [ -z "${QAA_ALLURE_API_KEY}" ]; then
  warn "QAA_ALLURE_API_KEY is empty — skipping upload (experimental)"
  exit 0
fi
if [ ! -d "${QAA_ALLURE_PATH}" ]; then
  warn "path '${QAA_ALLURE_PATH}' not found — skipping upload"
  exit 0
fi

file_count=$(find "${QAA_ALLURE_PATH}" -type f | wc -l | tr -d ' ')
if [ "${file_count}" -eq 0 ]; then
  warn "path '${QAA_ALLURE_PATH}' has no files — skipping upload"
  exit 0
fi

command -v zip >/dev/null || fail "'zip' is required but not installed"
command -v jq  >/dev/null || fail "'jq' is required but not installed"

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/qaa-allure-upload.XXXXXX")
trap 'rm -rf "${tmp_dir}"' EXIT
zip_path="${tmp_dir}/allure-results.zip"

# Zip *contents* of the directory (entries relative to it) so the server
# extracts files directly into its results dir, not into a nested folder.
(cd "${QAA_ALLURE_PATH}" && zip -r -q "${zip_path}" .)
zip_size=$(wc -c < "${zip_path}" | tr -d ' ')
echo "Zipped ${file_count} files from ${QAA_ALLURE_PATH} → ${zip_path} (${zip_size} bytes)"

curl_args=(
  --silent --show-error --fail-with-body
  -X POST "${QAA_ALLURE_HOST}/api/v1/reports"
  -H "x-api-key: ${QAA_ALLURE_API_KEY}"
  -F "name=${QAA_ALLURE_NAME}"
  -F "historyLevel=${QAA_ALLURE_HISTORY}"
  -F "files=@${zip_path}"
)
if [ -n "${QAA_ALLURE_TAGS}" ]; then
  curl_args+=(-F "tags=${QAA_ALLURE_TAGS}")
fi

response=$(curl "${curl_args[@]}")
echo "qaa-allure response: ${response}"

report_id=$(echo "${response}" | jq -r '.data.id // empty')
if [ -z "${report_id}" ]; then
  fail "Upload succeeded but no report id was returned"
fi

report_url="${QAA_ALLURE_HOST}/reports/${report_id}"
view_url="${QAA_ALLURE_HOST}/api/v1/reports/${report_id}/view"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "report_id=${report_id}"
    echo "report_url=${report_url}"
    echo "view_url=${view_url}"
  } >> "${GITHUB_OUTPUT}"
fi

echo "::notice title=qaa-allure report::${report_url}"
