"""Pinned, source-built FFmpeg/libx264 runtime; no system FFmpeg fallback."""
import hashlib
import json
from pathlib import Path
import platform
import re
import shlex
import subprocess

ROOT = Path(__file__).resolve().parents[2]
RESOURCE = ROOT/'src-tauri/resources/video'
SPEC = ROOT/'docs/VIDEO_DEPENDENCIES.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inputs():
    paths = [SPEC, ROOT/'scripts/prepare-video.py', Path(__file__)]
    paths += sorted((ROOT/'docs/video-licenses').glob('*'))
    return {str(p.relative_to(ROOT)): sha(p) for p in paths if p.is_file()}


def validate_configuration(text, spec):
    line = next((line for line in text.splitlines() if line.startswith('configuration:')), '')
    flags = shlex.split(line.removeprefix('configuration:'))
    expected = spec['ffmpegConfigure']
    # Only the private build prefix is variable. Reject all unreviewed options.
    if [f for f in flags if not f.startswith('--prefix=')] != expected:
        raise ValueError('FFmpeg: configuración distinta de la revisada para GPL-3.0-only')
    if '--enable-nonfree' in flags or '--enable-gpl' not in flags or '--enable-libx264' not in flags:
        raise ValueError('FFmpeg: configuración de licencias no permitida')


def binary_identity(binary):
    """Allow only signature changes when inspecting a signed macOS application."""
    if platform.system() != 'Darwin':
        return None
    uuid = re.search(r'\buuid ([A-F0-9-]+)', subprocess.check_output(['otool', '-l', str(binary)], text=True))
    if not uuid:
        raise ValueError('FFmpeg: falta UUID Mach-O')
    links = subprocess.check_output(['otool', '-L', str(binary)], text=True).splitlines()[1:]
    return {'uuid': uuid[1], 'links': [line.strip() for line in links]}


def validate_windows_dlls(dlls):
    system = {'kernel32.dll', 'msvcrt.dll', 'ucrtbase.dll', 'advapi32.dll', 'bcrypt.dll',
              'user32.dll', 'winmm.dll', 'ws2_32.dll', 'secur32.dll', 'shell32.dll', 'ole32.dll'}
    external = sorted({name.lower() for name in dlls
                       if name.lower() not in system and not name.lower().startswith('api-ms-win-')})
    if external or not dlls:
        detail = ', '.join(external) if external else 'no se encontraron imports'
        raise ValueError('FFmpeg: DLL externa no inventariada: '+detail)


def verify(resource=RESOURCE, signed=False):
    spec = json.loads(SPEC.read_text())
    manifest = json.loads((resource/'BUILD.json').read_text())
    if manifest['inputs'] != inputs() or manifest['platform'] != platform.system() or manifest['machine'] != platform.machine():
        raise ValueError('FFmpeg: reconstruya el conversor para esta plataforma y receta')
    actual = {str(p.relative_to(resource)): sha(p) for p in resource.rglob('*') if p.is_file() and p.name not in ['BUILD.json', '.gitkeep']}
    expected = dict(manifest['files'])
    binary = resource/manifest['binary']
    if signed and platform.system() == 'Darwin' and binary.is_file():
        if binary_identity(binary) != manifest.get('identity'):
            raise ValueError('FFmpeg: UUID o enlaces del binario firmado no coinciden')
        # Existing release compliance uses the same UUID+links rule for signed Mach-O.
        expected[manifest['binary']] = actual[manifest['binary']]
    if actual != expected:
        raise ValueError('FFmpeg: binario, fuentes o avisos modificados/ausentes')
    version = subprocess.check_output([str(binary), '-version'], text=True)
    validate_configuration(version, spec)
    license_text = subprocess.check_output([str(binary), '-L'], text=True, stderr=subprocess.DEVNULL)
    if 'either version 3 of the License' not in license_text or 'any later version' not in license_text:
        raise ValueError('FFmpeg: no declara GPL versión 3 o posterior')
    encoders = subprocess.check_output([str(binary), '-hide_banner', '-encoders'], text=True)
    if 'libx264' not in encoders:
        raise ValueError('FFmpeg: falta libx264')
    if platform.system() == 'Darwin':
        links = subprocess.check_output(['otool', '-L', str(binary)], text=True).splitlines()[1:]
        if any(not line.strip().startswith(('/usr/lib/', '/System/Library/')) for line in links):
            raise ValueError('FFmpeg: dependencia dinámica externa no inventariada')
    elif platform.system() == 'Linux':
        links = subprocess.check_output(['ldd', str(binary)], text=True)
        allowed = ('linux-vdso', 'libc.so', 'libm.so', 'libpthread.so', 'libdl.so', 'librt.so', 'ld-linux')
        if any(not any(name in line for name in allowed) for line in links.splitlines() if line.strip()):
            raise ValueError('FFmpeg: dependencia dinámica externa no inventariada')
    elif platform.system() == 'Windows':
        headers = subprocess.check_output(['objdump', '-p', str(binary)], text=True)
        dlls = re.findall(r'DLL Name:\s*(\S+)', headers, re.I)
        validate_windows_dlls(dlls)
    else:
        raise ValueError('FFmpeg: falta revisión de dependencias dinámicas para esta plataforma')
    return manifest


def notices():
    spec = json.loads(SPEC.read_text())
    lines = ['FFmpeg/libx264 para exportación MP4 — selección GPL-3.0-only.',
             'This software is based in part on the work of the Independent JPEG Group.',
             'Fuentes upstream sin modificaciones; compilación mínima mediante scripts/prepare-video.py.',
             'Las fuentes exactas y la receta se incluyen en video/sources dentro del paquete.',
             'Licencias originales (se conservan las alternativas y los avisos permisivos):']
    for component in spec['components']:
        lines.append(f"{component['name']} {component['version']}: {component['license']}; distribución bajo {component['selectedLicense']}")
    for path in sorted((ROOT/'docs/video-licenses').glob('*')):
        if path.is_file():
            lines.extend(['\n===== '+path.name+' =====', path.read_text()])
    return '\n'.join(lines)+'\n'


def refresh_notices():
    """Idempotently update both app credits; full inventory is generated by release.py."""
    marker = '\n## Conversor MP4: FFmpeg/libx264\n'
    spec = json.loads(SPEC.read_text())
    summary = marker+'\n'+ '\n'.join(
        f"- {c['name']} {c['version']}: {c['license']}; opción utilizada GPL-3.0-only. Fuente: {c['sourceRequests'][0]['url']}"
        for c in spec['components'])+'\n\nCompilación mínima estática, sin componentes nonfree ni bibliotecas externas autodetectadas. This software is based in part on the work of the Independent JPEG Group. Textos: compliance/VIDEO_LICENSES.txt. Fuentes exactas y receta: video/sources en la distribución.\n'
    for name in ['THIRD_PARTY_NOTICES.md', 'public/THIRD_PARTY_NOTICES.txt']:
        path = ROOT/name
        path.write_text(path.read_text(encoding='utf-8').split(marker)[0].rstrip()+'\n'+summary,
                        encoding='utf-8')
    public = ROOT/'public/compliance'
    public.mkdir(parents=True, exist_ok=True)
    (public/'VIDEO_LICENSES.txt').write_text(notices(), encoding='utf-8')
