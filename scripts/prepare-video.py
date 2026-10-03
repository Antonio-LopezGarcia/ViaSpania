#!/usr/bin/env python3
"""Build the reviewed MP4 converter from checksum-pinned source archives.

Requires Python >= 3.11, a C compiler, make and pkg-config (Unix or MSYS2).
No download unless --network is explicitly passed. Never uses a system FFmpeg.
"""
import argparse
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tarfile
import urllib.request

sys.path.insert(0, str(Path(__file__).resolve().parent/'compliance'))
from video import ROOT, RESOURCE, SPEC, inputs, sha, verify, notices, refresh_notices, binary_identity


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--network', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if sys.version_info < (3, 11):
        raise ValueError('Se necesita Python 3.11 o posterior para preparar el conversor MP4')
    if args.check:
        verify()
        print('FFmpeg/libx264: binario, configuración GPL, fuentes y avisos verificados.')
        return
    if (RESOURCE/'BUILD.json').exists():
        try:
            verify()
            refresh_notices()
            return
        except (ValueError, OSError, subprocess.CalledProcessError):
            pass
    spec = json.loads(SPEC.read_text())
    work = ROOT/'release/video'
    source_cache = work/'sources'
    source_cache.mkdir(parents=True, exist_ok=True)
    build = work/'build'
    if build.exists():
        shutil.rmtree(build)
    build.mkdir()
    source_dirs = []
    for component in spec['components']:
        archive = source_cache/component['archive']
        request = component['sourceRequests'][0]
        if not archive.exists():
            if not args.network:
                raise ValueError('Faltan fuentes: ejecute pnpm video:prepare --network')
            with urllib.request.urlopen(request['url'], timeout=90) as response:
                archive.write_bytes(response.read())
        if sha(archive) != request['integrity']:
            raise ValueError('Checksum de fuentes incorrecto: '+component['name'])
        target = build/component['name']
        target.mkdir()
        with tarfile.open(archive) as tar:
            tar.extractall(target, filter='data')
        source_dirs.append(next(target.iterdir()))
    ffmpeg, x264 = source_dirs
    prefix = build/'prefix'
    env = os.environ.copy()
    # Native pkgconf needs a Windows path; configure/make run inside MSYS2
    # and need its POSIX spelling instead of Python's backslash paths.
    env['PKG_CONFIG_LIBDIR'] = (prefix/'lib/pkgconfig').as_posix()
    env['PKG_CONFIG_PATH'] = (prefix/'lib/pkgconfig').as_posix()
    if os.name == 'nt':
        # Do not make the bundled converter depend on DLLs from the MSYS2
        # build environment. The app ships ffmpeg.exe, not the MinGW runtime.
        env['LDFLAGS'] = (env.get('LDFLAGS', '')+' -static -static-libgcc').strip()
    configure_prefix = (subprocess.check_output(['cygpath', '-u', str(prefix)], text=True).strip()
                        if os.name == 'nt' else str(prefix))
    jobs = str(min(os.cpu_count() or 2, 8))
    def run(command, cwd):
        subprocess.run(command, cwd=cwd, env=env, check=True)
    run(['sh', './configure', '--prefix='+configure_prefix, *spec['x264Configure']], x264)
    run(['make', '-j'+jobs], x264)
    run(['make', 'install-lib-static', 'install-lib-dev'], x264)
    run(['sh', './configure', '--prefix='+configure_prefix, *spec['ffmpegConfigure']], ffmpeg)
    run(['make', '-j'+jobs], ffmpeg)
    binary = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
    RESOURCE.mkdir(parents=True, exist_ok=True)
    # Replace only this generated resource directory, leaving no stale libraries.
    for path in RESOURCE.iterdir():
        if path.name == '.gitkeep':
            continue
        shutil.rmtree(path) if path.is_dir() else path.unlink()
    shutil.copy2(ffmpeg/binary, RESOURCE/binary)
    sources = RESOURCE/'sources'
    sources.mkdir()
    for component in spec['components']:
        shutil.copy2(source_cache/component['archive'], sources/component['archive'])
    for path in [SPEC, Path(__file__), ROOT/'scripts/compliance/video.py']:
        shutil.copy2(path, sources/path.name)
    (sources/'BUILD_COMMAND.txt').write_text('From the ViaSpania source tree: python3 scripts/prepare-video.py\nPlace the two archives in release/video/sources first.\nCompiler: '+subprocess.check_output([env.get('CC', 'cc'), '--version'], text=True))
    (RESOURCE/'LICENSES.txt').write_text(notices())
    manifest = {'schema': 1, 'binary': binary, 'platform': platform.system(), 'machine': platform.machine(), 'inputs': inputs(),
                'identity': binary_identity(RESOURCE/binary),
                'files': {str(p.relative_to(RESOURCE)): sha(p) for p in RESOURCE.rglob('*') if p.is_file() and p.name != '.gitkeep'}}
    (RESOURCE/'BUILD.json').write_text(json.dumps(manifest, indent=2)+'\n')
    verify()
    refresh_notices()
    print('Conversor MP4 preparado y verificado.')


if __name__ == '__main__':
    main()
