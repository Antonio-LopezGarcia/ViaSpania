"""Rebuild an explicitly reviewed subset of native CMake libraries in isolation.

This is a per-component source probe using installed dependencies, not a hermetic
rebuild of the release. No recipe is interpreted or executed as Ruby.
"""
import concurrent.futures
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[2]
# Options transcribed from the installed recipes captured in native provenance.
OPTIONS = {
    's2n': [], 'webp': [], 'gpgmepp': [], 'openjph': [],
    'openexr': [], 'aws-c-http': [], 'aws-c-io': [],
    'aws-c-auth': ['-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-dead_strip_dylibs'],
    'aws-c-event-stream': ['-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-dead_strip_dylibs'],
    'aws-c-mqtt': ['-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-dead_strip_dylibs'],
    'aws-c-s3': ['-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-dead_strip_dylibs'],
    'aws-crt-cpp': ['-DBUILD_DEPS=OFF', '-DCMAKE_MODULE_PATH=/opt/homebrew/opt/aws-c-common/lib/cmake',
                    '-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-dead_strip_dylibs'],
    're2': ['-DRE2_BUILD_TESTING=OFF'],
    'netcdf': ['-DNETCDF_ENABLE_TESTS=OFF', '-DNETCDF_ENABLE_HDF5=ON', '-DNETCDF_ENABLE_DOXYGEN=OFF'],
    'xerces-c': ['-DCMAKE_DISABLE_FIND_PACKAGE_ICU=ON'],
    'libkml': ['-DCMAKE_POLICY_VERSION_MINIMUM=3.5', '-DCMAKE_CXX_STANDARD=14'],
    'imath': [], 'liblerc': [], 'libaec': ['-DBUILD_TESTING=ON'],
    'aws-c-common': [], 'aws-c-cal': [], 'aws-c-compression': [],
    'aws-c-sdkutils': [], 'aws-checksums': [], 'libdeflate': [],
    'json-c': ['-DBUILD_APPS=OFF'],
    'qhull': ['-DCMAKE_POLICY_VERSION_MINIMUM=3.5'],
    'uriparser': ['-DURIPARSER_BUILD_TESTS=OFF', '-DURIPARSER_BUILD_DOCS=OFF'],
    'utf8proc': [],
    'snappy': ['-DSNAPPY_BUILD_TESTS=OFF', '-DSNAPPY_BUILD_BENCHMARKS=OFF'],
    'highway': ['-DHWY_ENABLE_TESTS=OFF', '-DHWY_ENABLE_EXAMPLES=OFF'],
    'libde265': ['-DENABLE_DECODER=OFF'], 'geos': [],
    'zstd': ['-DZSTD_PROGRAMS_LINK_SHARED=ON', '-DZSTD_BUILD_CONTRIB=ON',
             '-DZSTD_LEGACY_SUPPORT=ON', '-DZSTD_ZLIB_SUPPORT=ON',
             '-DZSTD_LZMA_SUPPORT=ON', '-DZSTD_LZ4_SUPPORT=ON', '-DCMAKE_CXX_STANDARD=11'],
}
CONFIGURE = {
    'libarchive': ['--without-lzo2', '--without-nettle', '--without-xml2', '--without-openssl', '--with-expat'],
    'libassuan': ['--disable-silent-rules', '--enable-static'],
    'freetype': ['--enable-freetype-config', '--without-harfbuzz'],
    'freexl': ['--disable-silent-rules'],
    'libgpg-error': ['--disable-silent-rules', '--enable-install-gpg-error-config', '--enable-static'],
    'gpgme': ['--disable-silent-rules', '--enable-static'],
    'little-cms2': [], 'xz': ['--disable-silent-rules', '--disable-nls'],
    'mpfr': ['--disable-silent-rules'],
    'unixodbc': ['--disable-debug', '--disable-dependency-tracking', '--enable-static', '--enable-gui=no'],
    'libxml2': ['--disable-silent-rules', '--with-history', '--with-legacy'],
    'libtool': ['--disable-silent-rules', '--enable-ltdl-install', '--program-prefix=g'],
    'libpng': ['--disable-silent-rules'],
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rebuild(component):
    name = component['name']
    base = ROOT / 'release/reconstruction/components' / component['id'].split('/')[-1]
    base.mkdir(parents=True, exist_ok=True)
    source = component['sources'][0]
    archive = ROOT / 'release/compliance' / source['path']
    result = {'id': component['id'], 'sourceSha256': source['sha256'],
              'recipeSha256': digest(ROOT / component['recipe']), 'commands': [],
              'scope': 'shared-library probe with installed dependencies; not full dependency closure'}

    def run(args, stage, cwd=None, env=None):
        result['commands'].append([str(x) for x in args])
        with (base / (stage + '.log')).open('w') as log:
            status = subprocess.run(args, cwd=cwd or base, env=env, stdout=log, stderr=subprocess.STDOUT).returncode
        if status:
            raise ValueError(f'Falló {stage}, código {status}: {base / (stage + ".log")}')

    try:
        if digest(archive) != source['sha256']:
            raise ValueError('Fuente alterada: ' + str(archive))
        unpack = base / 'source'
        unpack.mkdir(exist_ok=True)
        with tarfile.open(archive) as compressed:
            compressed.extractall(unpack, filter='data')
        roots = list(unpack.iterdir())
        tree = roots[0] if len(roots) == 1 and roots[0].is_dir() else unpack
        if name == 'zstd':
            tree = tree / 'build/cmake'
        install = base / 'install'
        build = base / 'build'
        if name in CONFIGURE:
            env = dict(os.environ, CPPFLAGS='-I/opt/homebrew/include', LDFLAGS='-L/opt/homebrew/lib',
                       PKG_CONFIG_PATH='/opt/homebrew/lib/pkgconfig', M4='/opt/homebrew/opt/m4/bin/m4')
            if name == 'libassuan':
                env['CFLAGS'] = '-O2 -std=gnu89'
            result['environment'] = {k: env[k] for k in ['CPPFLAGS', 'LDFLAGS', 'PKG_CONFIG_PATH', 'M4']}
            if name == 'libassuan':
                result['environment']['CFLAGS'] = env['CFLAGS']
            run([str(tree / 'configure'), '--prefix=' + str(install), '--sysconfdir=' + str(install / 'etc'),
                 *CONFIGURE[name]], 'configure', tree, env)
            run(['make', '-j' + os.environ.get('VIASPANIA_BUILD_JOBS', '3')], 'build', tree, env)
            if name in ['xz', 'mpfr', 'libpng']:
                run(['make', 'test' if name == 'libpng' else 'check'], 'test', tree, env)
            run(['make', 'install'], 'install', tree, env)
        else:
            run(['cmake', '-S', str(tree), '-B', str(build), '-DCMAKE_BUILD_TYPE=Release',
             '-DBUILD_SHARED_LIBS=ON', '-DBUILD_TESTING=OFF',
             '-DCMAKE_INSTALL_PREFIX=' + str(install), '-DCMAKE_INSTALL_RPATH=' + str(install / 'lib'),
             '-DCMAKE_PREFIX_PATH=/opt/homebrew', '-DCMAKE_IGNORE_PREFIX_PATH=/opt/miniconda3',
                 *OPTIONS[name]], 'configure')
            run(['cmake', '--build', str(build), '--parallel', os.environ.get('VIASPANIA_BUILD_JOBS', '3')], 'build')
            if name == 'libaec':
                run(['ctest', '--test-dir', str(build), '--output-on-failure'], 'test')
            run(['cmake', '--install', str(build)], 'install')
        libraries = {str(p.relative_to(install)): digest(p) for p in install.rglob('*.dylib') if not p.is_symlink()}
        if not libraries:
            raise ValueError('No se generaron bibliotecas dinámicas.')
        result.update(status='built', libraries=libraries)
    except (OSError, ValueError, tarfile.TarError) as error:
        result.update(status='failed', error=str(error))
    (base / 'RESULT.json').write_text(json.dumps(result, indent=2) + '\n')
    print(component['id'] + ': ' + result['status'], flush=True)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    supported = {**OPTIONS, **CONFIGURE}
    parser.add_argument('--only', nargs='+', choices=sorted(supported))
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'release/compliance/MANIFEST.json').read_text())
    selected = [c for c in manifest['components'] if c['id'].startswith('native/') and c['name'] in (args.only or supported)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(rebuild, selected))
    target = ROOT / 'docs/corresponding-source-evidence/CMAKE_REBUILDS.json'
    previous = json.loads(target.read_text())['components'] if target.exists() else []
    updated = {r['id']: r for r in previous}
    updated.update({r['id']: r for r in results})
    target.write_text(json.dumps({'schema': 1, 'components': list(updated.values())}, indent=2) + '\n')
    raise SystemExit(1 if any(r['status'] != 'built' for r in results) else 0)
