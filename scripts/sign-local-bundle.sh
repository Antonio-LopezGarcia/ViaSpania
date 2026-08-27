#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
app_path="$project_dir/src-tauri/target/release/bundle/macos/ViaSpania.app"

if [[ ! -d "$app_path" ]]; then
  echo "No se ha encontrado el bundle de ViaSpania en: $app_path" >&2
  exit 1
fi

# Sello ad hoc para desarrollo y distribución manual. Una publicación sin avisos
# de Gatekeeper debe sustituirlo por Developer ID y notarización de Apple.
codesign --force --deep --sign - "$app_path"
codesign --verify --deep --strict --verbose=2 "$app_path"

echo "Bundle sellado y verificado: $app_path"
