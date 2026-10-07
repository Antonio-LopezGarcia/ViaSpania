#!/bin/bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
bundle_dir="$root_dir/src-tauri/resources/geospatial"
host_arch="$(uname -m)"
commands=(gdal gdalinfo gdalwarp gdal_translate gdaldem gdalsrsinfo gdaltransform gdallocationinfo ogr2ogr proj)

for tool in file lipo; do
  command -v "$tool" >/dev/null || { echo "Falta la herramienta de macOS: $tool" >&2; exit 1; }
done

for name in "${commands[@]}"; do
  executable="$bundle_dir/bin/$name"
  test -f "$executable" || { echo "Falta el ejecutable geoespacial incluido: $executable" >&2; exit 1; }
  file_description="$(file -b "$executable")"
  case "$file_description" in
    *Mach-O*) ;;
    *) echo "El ejecutable incluido $name no es Mach-O de macOS: $file_description" >&2; exit 1 ;;
  esac
  lipo "$executable" -verify_arch "$host_arch" >/dev/null 2>&1 || {
    echo "El ejecutable incluido $name no soporta macOS $host_arch: $executable" >&2
    exit 1
  }
done

# Check every bundled dynamic library too. Checking only the command line tools
# would allow stale Linux .so files to be copied into a macOS app unnoticed.
for library in "$bundle_dir"/lib/*; do
  test -f "$library" || continue
  file_description="$(file -b "$library")"
  case "$file_description" in
    *Mach-O*) ;;
    *) echo "La biblioteca incluida no es Mach-O de macOS: $library ($file_description)" >&2; exit 1 ;;
  esac
  lipo "$library" -verify_arch "$host_arch" >/dev/null 2>&1 || {
    echo "La biblioteca incluida no soporta macOS $host_arch: $library" >&2
    exit 1
  }
done

echo "Bundle GDAL/PROJ válido para macOS $host_arch."
