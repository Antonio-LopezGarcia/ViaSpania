#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
bundle_dir="$root_dir/src-tauri/resources/geospatial"
bin_dir="$bundle_dir/bin"
lib_dir="$bundle_dir/lib"
share_dir="$bundle_dir/share"
license_dir="$bundle_dir/licenses"
commands=(gdalinfo gdalwarp gdal_translate gdaldem gdalsrsinfo gdaltransform gdallocationinfo ogr2ogr proj)

for tool in gdal-config projinfo ldd patchelf; do
  command -v "$tool" >/dev/null || { echo "Falta la herramienta requerida en Linux: $tool" >&2; exit 1; }
done

rm -rf "$bundle_dir"
mkdir -p "$bin_dir" "$lib_dir" "$share_dir/gdal" "$share_dir/proj" "$license_dir"
touch "$bundle_dir/.gitkeep"
for name in "${commands[@]}"; do
  source_path="$(command -v "$name" || true)"
  test -n "$source_path" || { echo "Falta la utilidad requerida: $name" >&2; exit 1; }
  cp "$(realpath "$source_path")" "$bin_dir/$name"
done

cp -R "$(gdal-config --datadir)/." "$share_dir/gdal/"
proj_data="$(projinfo --searchpaths | tail -n 1)"
test -d "$proj_data" || { echo "No se encontró el directorio de datos de PROJ." >&2; exit 1; }
cp -R "$proj_data/." "$share_dir/proj/"

queue_file="$(mktemp)"
next_file="$(mktemp)"
trap 'rm -f "$queue_file" "$next_file"' EXIT
for executable in "$bin_dir"/*; do
  ldd "$executable" | awk '/=> \// {print $3}' >> "$queue_file"
done
while test -s "$queue_file"; do
  : > "$next_file"
  while IFS= read -r dependency; do
    test -f "$dependency" || continue
    target="$lib_dir/$(basename "$dependency")"
    test -f "$target" && continue
    cp -L "$dependency" "$target"
    ldd "$target" 2>/dev/null | awk '/=> \// {print $3}' >> "$next_file" || true
  done < "$queue_file"
  sort -u "$next_file" > "$queue_file"
done
for executable in "$bin_dir"/*; do patchelf --set-rpath '$ORIGIN/../lib' "$executable"; done
for library in "$lib_dir"/*; do patchelf --set-rpath '$ORIGIN' "$library" 2>/dev/null || true; done

for source in /usr/share/doc/gdal*/copyright /usr/share/doc/proj*/copyright; do
  test -f "$source" && cp "$source" "$license_dir/$(basename "$(dirname "$source")")-copyright"
done
echo "Recursos geoespaciales preparados para Linux: $(du -sh "$bundle_dir" | awk '{print $1}')"
