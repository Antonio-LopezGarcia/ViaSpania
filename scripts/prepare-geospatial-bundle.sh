#!/bin/bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
bundle_dir="$root_dir/src-tauri/resources/geospatial"
bin_dir="$bundle_dir/bin"
lib_dir="$bundle_dir/lib"
share_dir="$bundle_dir/share"
license_dir="$bundle_dir/licenses"
commands=(gdalinfo gdalwarp gdal_translate gdaldem gdalsrsinfo gdaltransform gdallocationinfo ogr2ogr proj)

for tool in otool install_name_tool codesign brew node; do
  command -v "$tool" >/dev/null || { echo "Falta la herramienta de macOS: $tool" >&2; exit 1; }
done
command -v gdal-config >/dev/null || { echo "GDAL no está instalado; instálelo antes de crear el bundle." >&2; exit 1; }
command -v projinfo >/dev/null || { echo "PROJ no está instalado; instálelo antes de crear el bundle." >&2; exit 1; }

rm -rf "$bundle_dir"
mkdir -p "$bin_dir" "$lib_dir" "$share_dir/gdal" "$share_dir/proj" "$license_dir"
touch "$bundle_dir/.gitkeep"

for name in "${commands[@]}"; do
  source_path="$(command -v "$name" || true)"
  test -n "$source_path" || { echo "Falta la utilidad requerida: $name" >&2; exit 1; }
  cp "$(realpath "$source_path")" "$bin_dir/$name"
  chmod 755 "$bin_dir/$name"
done

cp -R "$(gdal-config --datadir)/." "$share_dir/gdal/"
rm -f "$share_dir/gdal"/GDALLogo*.svg "$share_dir/gdal/gdalicon.png"
proj_data="$(projinfo --searchpaths | tail -n 1)"
test -d "$proj_data" || { echo "No se encontró el directorio de datos de PROJ." >&2; exit 1; }
cp -R "$proj_data/." "$share_dir/proj/"

resolve_dependency(){
  local dependency="$1" candidate
  case "$dependency" in
    /System/*|/usr/lib/*) return 1 ;;
    /opt/homebrew/*) realpath "$dependency"; return 0 ;;
    @rpath/*|@loader_path/*|@executable_path/*)
      candidate="/opt/homebrew/lib/$(basename "$dependency")"
      test -e "$candidate" && { realpath "$candidate"; return 0; }
      ;;
  esac
  return 1
}

queue_file="$(mktemp)"
next_file="$(mktemp)"
source_manifest="$(mktemp)"
formula_file="$(mktemp)"
trap 'rm -f "$queue_file" "$next_file" "$source_manifest" "$formula_file"' EXIT
for name in "${commands[@]}"; do realpath "$(command -v "$name")" >> "$source_manifest"; done
for executable in "$bin_dir"/*; do
  otool -L "$executable" | tail -n +2 | awk '{print $1}' >> "$queue_file"
done

while test -s "$queue_file"; do
  : > "$next_file"
  while IFS= read -r dependency; do
    resolved="$(resolve_dependency "$dependency" || true)"
    test -n "$resolved" || continue
    target="$lib_dir/$(basename "$dependency")"
    test -f "$target" && continue
    cp "$resolved" "$target"
    chmod 755 "$target"
    echo "$resolved" >> "$source_manifest"
    chmod u+w "$target"
    otool -L "$target" | tail -n +2 | awk '{print $1}' >> "$next_file"
  done < "$queue_file"
  sort -u "$next_file" > "$queue_file"
done

awk -F/ '$2=="opt" && $3=="homebrew" && $4=="Cellar" {print $5}' "$source_manifest" | sort -u > "$formula_file"
# Las licencias GPL no se rechazan por su nombre. La publicación se controla
# mediante fuentes, avisos e inventario verificados (compliance:check --strict).

patch_binary(){
  local file="$1" dependency replacement
  chmod u+w "$file"
  while IFS= read -r dependency; do
    case "$dependency" in
      /System/*|/usr/lib/*) continue ;;
    esac
    if test -f "$lib_dir/$(basename "$dependency")"; then
      replacement="@rpath/$(basename "$dependency")"
      install_name_tool -change "$dependency" "$replacement" "$file" 2>/dev/null
    fi
  done < <(otool -L "$file" | tail -n +2 | awk '{print $1}')
}

for executable in "$bin_dir"/*; do
  patch_binary "$executable"
  install_name_tool -add_rpath '@executable_path/../lib' "$executable" 2>/dev/null || true
  codesign --force --sign - "$executable" >/dev/null 2>&1
done
for library in "$lib_dir"/*; do
  patch_binary "$library"
  install_name_tool -id "@rpath/$(basename "$library")" "$library" 2>/dev/null
  install_name_tool -add_rpath '@loader_path' "$library" 2>/dev/null || true
  codesign --force --sign - "$library" >/dev/null 2>&1
done

gdal_prefix="$(cd "$(dirname "$(realpath "$(command -v gdalinfo)")")/.." && pwd)"
proj_prefix="$(cd "$(dirname "$(realpath "$(command -v proj)")")/.." && pwd)"
for source in "$gdal_prefix/LICENSE.TXT" "$gdal_prefix/LICENSE" "$proj_prefix/COPYING" "$proj_prefix/LICENSE"; do
  test -f "$source" && cp "$source" "$license_dir/$(basename "$(dirname "$source")")-$(basename "$source")"
done

manifest="$bundle_dir/THIRD_PARTY_MANIFEST.txt"
{
  echo "ViaSpania bundled geospatial runtime — macOS"
  echo "Generated from the files copied into this release; system libraries are excluded."
  echo
  echo "Executables:"
  for file in "$bin_dir"/*; do echo "- $(basename "$file")"; done
  echo
  echo "Dynamic libraries:"
  for file in "$lib_dir"/*; do echo "- $(basename "$file")"; done
  echo
  echo "Homebrew formulae supplying bundled files:"
  while IFS= read -r formula; do echo "- $formula"; done < "$formula_file"
  echo
  echo "Licence files included:"
  for file in "$license_dir"/*; do echo "- $(basename "$file")"; done
} > "$manifest"
test "$(find "$license_dir" -type f | wc -l | tr -d ' ')" -ge 2 || { echo "El paquete geoespacial no contiene los avisos mínimos de GDAL y PROJ." >&2; exit 1; }

echo "Recursos geoespaciales preparados: $(du -sh "$bundle_dir" | awk '{print $1}')"

node "$root_dir/scripts/release-compliance.mjs" record-native "$source_manifest"
