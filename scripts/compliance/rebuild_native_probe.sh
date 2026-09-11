#!/bin/bash
# Reproduce the partial source probes in an isolated directory, without installing into Homebrew.
# Requires Python 3.12+, CMake, clang and the installed native dependency tree.
set -euo pipefail
cd "$(dirname "$0")/../.."
probe_root="$PWD/release/reconstruction"
probe_python="${VIASPANIA_PYTHON:-/opt/homebrew/bin/python3}"
probe_jobs="${VIASPANIA_BUILD_JOBS:-4}"

"$probe_python" - <<'PY'
import hashlib, json, tarfile
from pathlib import Path
root = Path.cwd()
manifest = json.loads((root/'release/compliance/MANIFEST.json').read_text())
targets = {'native/proj-9.8.1': 'proj', 'native/apache-arrow-25.0.1_1': 'arrow',
           'native/gdal-3.13.2_1': 'gdal'}
archives = []
for identifier, destination in targets.items():
    component = next(c for c in manifest['components'] if c['id'] == identifier)
    source = component['sources'][0]
    archives.append((root/'release/compliance'/source['path'], source['sha256'], destination))
auxiliary = json.loads((root/'docs/corresponding-source-evidence/AUXILIARY_SOURCES.json').read_text())
for source in auxiliary['sources']:
    archives.append((root/source['archive'], source['sha256'], 'arrow'))
for archive, digest, destination in archives:
    if not archive.is_file() or hashlib.sha256(archive.read_bytes()).hexdigest() != digest:
        raise SystemExit('Fuente ausente o alterada: ' + str(archive))
    target = root/'release/reconstruction'/destination
    target.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive) as source:
        source.extractall(target, filter='data')
PY

cmake -S "$probe_root/proj/proj-9.8.1" -B "$probe_root/proj/build" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$probe_root/proj/install" \
  -DBUILD_TESTING=OFF -DNLOHMANN_JSON_ORIGIN=internal
cmake --build "$probe_root/proj/build" --parallel "$probe_jobs"
cmake --install "$probe_root/proj/build"

cmake -S "$probe_root/arrow/xsimd-14.2.0" -B "$probe_root/arrow/xsimd-build" \
  -DCMAKE_INSTALL_PREFIX="$probe_root/arrow/dependencies"
cmake --install "$probe_root/arrow/xsimd-build"
cmake -S "$probe_root/arrow/gflags-2.2.2" -B "$probe_root/arrow/gflags-build" \
  -DCMAKE_POLICY_VERSION_MINIMUM=3.5 -DREGISTER_INSTALL_PREFIX=OFF \
  -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX="$probe_root/arrow/dependencies"
cmake --build "$probe_root/arrow/gflags-build" --parallel "$probe_jobs"
cmake --install "$probe_root/arrow/gflags-build"

ARROW_MIMALLOC_URL="$PWD/release/compliance/native-aux/mimalloc-3.4.1/source-0.archive" \
cmake -S "$probe_root/arrow/apache-arrow-25.0.1/cpp" -B "$probe_root/arrow/build" \
  -DCMAKE_PREFIX_PATH="$probe_root/arrow/dependencies;/opt/homebrew" \
  -DRAPIDJSON_INCLUDE_DIR="$probe_root/arrow/rapidjson-232389d4f1012dddec4ef84861face2d2ba85709/include" \
  -DARROW_DEPENDENCY_SOURCE=SYSTEM -DLLVM_ROOT=/opt/homebrew/opt/llvm \
  -DARROW_ACERO=ON -DARROW_COMPUTE=ON -DARROW_CSV=ON -DARROW_DATASET=ON \
  -DARROW_FILESYSTEM=ON -DARROW_FLIGHT=ON -DARROW_FLIGHT_SQL=ON -DARROW_GANDIVA=ON \
  -DARROW_HDFS=ON -DARROW_JSON=ON -DARROW_ORC=OFF -DARROW_PARQUET=ON \
  -DARROW_PROTOBUF_USE_SHARED=ON -DARROW_S3=ON -DARROW_WITH_BZ2=ON \
  -DARROW_WITH_ZLIB=ON -DARROW_WITH_ZSTD=ON -DARROW_WITH_LZ4=ON \
  -DARROW_WITH_SNAPPY=ON -DARROW_WITH_BROTLI=ON -DARROW_WITH_UTF8PROC=ON
cmake --build "$probe_root/arrow/build" --parallel "$probe_jobs"
clang++ -std=c++20 docs/corresponding-source-evidence/arrow-smoke.cpp \
  -I"$probe_root/arrow/apache-arrow-25.0.1/cpp/src" -I"$probe_root/arrow/build/src" \
  -L"$probe_root/arrow/build/release" -Wl,-rpath,"$probe_root/arrow/build/release" \
  -larrow -o "$probe_root/arrow/smoke"
"$probe_root/arrow/smoke"

cmake -S "$probe_root/gdal/gdal-3.13.2" -B "$probe_root/gdal/build" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$probe_root/gdal/install" \
  -DCMAKE_PREFIX_PATH=/opt/homebrew -DCMAKE_IGNORE_PREFIX_PATH=/opt/miniconda3 \
  -DENABLE_PAM=ON -DBUILD_PYTHON_BINDINGS=OFF -DBUILD_JAVA_BINDINGS=OFF \
  -DBUILD_CSHARP_BINDINGS=OFF -DCMAKE_CXX_STANDARD=17 -DGDAL_USE_OPENMP=OFF -DBUILD_TESTING=OFF
cmake --build "$probe_root/gdal/build" --parallel "$probe_jobs"
