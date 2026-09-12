#!/usr/bin/env python3
"""Prepare a local source/notices dossier. Never grants legal approval or publishes."""
import argparse
import base64
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import tomllib
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timezone
from model import archive_name_safe, formula_sources, npm_lock_entries, release_problems, verify_integrity
from supplement import recover
from selections import apply_selections
from model import native_review_matches, data_review_matches, auxiliary_sources

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'release/compliance'
GEO = ROOT / 'src-tauri/resources/geospatial'
NATIVE = GEO / 'compliance/NATIVE.json'
PUBLIC = ROOT / 'public/compliance'
INPUTS = ['package.json', 'pnpm-lock.yaml', 'src-tauri/Cargo.toml', 'src-tauri/Cargo.lock', 'src-tauri/tauri.conf.json', 'src-tauri/tauri.compliance.conf.json', 'LICENSE', 'docs/ASSETS.md', 'docs/RELEASE_DECISIONS.json', 'scripts/prepare-geospatial-bundle.sh', 'scripts/compliance/release.py', 'scripts/compliance/model.py', 'scripts/compliance/supplement.py']


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


INPUTS += ['docs/LICENSE_SELECTIONS.json', 'scripts/compliance/selections.py']
INPUTS += ['docs/NATIVE_AUXILIARY_SOURCES.json']
INPUTS += ['docs/CORRESPONDING_SOURCE_REVIEW.md', 'scripts/compliance/audit_native_sources.py', 'scripts/compliance/rebuild_native_probe.sh']
INPUTS += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'docs/corresponding-source-evidence').rglob('*')) if p.is_file()]
INPUTS += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'docs/license-evidence').glob('*')) if p.is_file()]
INPUTS += ['docs/NATIVE_LICENSE_REVIEW.md', 'docs/DATA_LICENSE_REVIEW.md', 'docs/PROJ_DB_REVIEW.md']
INPUTS += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'docs/data-evidence').rglob('*')) if p.is_file()]
if (ROOT/'docs/data-evidence/REVIEW.json').is_file():
    INPUTS += list(json.loads((ROOT/'docs/data-evidence/REVIEW.json').read_text()).get('reviewedImplementation', {}))
INPUTS += [str(p.relative_to(ROOT)) for p in sorted((ROOT/'docs/native-evidence').rglob('*')) if p.is_file()]


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def run(*args):
    p = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if p.returncode:
        raise ValueError(f'Falló {args[0]} (código {p.returncode}): {p.stderr.strip()[:600]}')
    return p.stdout


def macho_uuid(path):
    match = re.search(r'\buuid ([A-F0-9-]+)', run('otool', '-l', str(path)))
    if not match:
        raise ValueError(f'No se pudo identificar el Mach-O: {path}')
    return match.group(1)


def record_native(paths_file=None):
    if sys.platform != 'darwin':
        raise ValueError('La procedencia nativa automatizada está implementada para macOS. Otros targets requieren su inventario propio.')
    candidates = []
    if paths_file:
        candidates = [Path(p) for p in Path(paths_file).read_text().splitlines() if p]
    else:
        for cellar in [Path('/opt/homebrew/Cellar'), Path('/usr/local/Cellar')]:
            for folder in cellar.glob('*/*'):
                for sub in ['bin', 'lib']:
                    candidates.extend(p for p in (folder/sub).glob('*') if p.is_file())
    by_name = {}
    for p in candidates:
        by_name.setdefault(p.name, []).append(p.resolve())
    files = sorted(p for folder in ['bin', 'lib'] for p in (GEO/folder).glob('*') if p.is_file())
    if not files:
        raise ValueError('No hay binarios geoespaciales preparados.')
    records, components = [], {}
    for p in files:
        uid = macho_uuid(p)
        possible = by_name.get(p.name, [])
        # install_name_tool can preserve a dependency alias different from realpath.
        if not possible and paths_file:
            possible = candidates
        matches = [q for q in possible if macho_uuid(q) == uid]
        if len(set(matches)) != 1:
            raise ValueError(f'Procedencia ambigua o ausente: {p.name}; no se puede empaquetar sin identificarla.')
        original = matches[0]
        parts = original.parts
        offset = parts.index('Cellar')
        name, version = parts[offset+1:offset+3]
        prefix = Path(*parts[:offset+3])
        key = name + '-' + version
        recipe = prefix / '.brew' / (name + '.rb')
        if not recipe.is_file():
            raise ValueError(f'Falta receta de la versión instalada: {key}')
        destination = GEO/'compliance/provenance'/key
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copy2(recipe, destination/recipe.name)
        shutil.copy2(prefix/'INSTALL_RECEIPT.json', destination/'INSTALL_RECEIPT.json')
        components[key] = {'id': 'native/'+key, 'name': name, 'version': version, 'recipe': str((destination/recipe.name).relative_to(ROOT)), 'prefix': str(prefix), 'sourceRequests': formula_sources(recipe.read_text())}
        records.append({'path': str(p.relative_to(GEO)), 'sha256': sha(p), 'uuid': uid, 'component': 'native/'+key, 'original': str(original), 'links': [line.strip().split(' (compatibility')[0] for line in run('otool', '-L', str(p)).splitlines()[1:]]})
    save_json(NATIVE, {'schema': 1, 'platform': 'macos', 'files': records, 'components': list(components.values())})
    print(f'Procedencia nativa registrada: {len(records)} binarios, {len(components)} componentes.', flush=True)


def download(url, expected, destination, network):
    if destination.is_file() and verify_integrity(destination.read_bytes(), expected):
        return
    if not network:
        raise ValueError('Fuente no disponible en caché; vuelva a ejecutar prepare --network: '+url)
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Alternate official Apache archive retains the exact expected digest.
    urls = [url]
    if url.startswith('https://ftpmirror.gnu.org/gnu/'):
        urls.insert(0, url.replace('https://ftpmirror.gnu.org/gnu/', 'https://ftp.gnu.org/gnu/', 1))
    if 'apache.org/dyn/closer.lua?path=' in url:
        urls.insert(0, 'https://archive.apache.org/dist/'+url.split('?path=', 1)[1])
    errors = []
    for candidate in urls:
        temporary = destination.with_suffix(destination.suffix+'.partial')
        try:
            request = urllib.request.Request(candidate, headers={'User-Agent': 'ViaSpania-license-source-audit/1.0'})
            with urllib.request.urlopen(request, timeout=90) as response, open(temporary, 'wb') as output:
                shutil.copyfileobj(response, output, 1024*1024)
            if not verify_integrity(temporary.read_bytes(), expected):
                raise ValueError('Hash distinto del fijado')
            temporary.replace(destination)
            return
        except (OSError, ValueError) as error:
            errors.append(str(error))
            temporary.unlink(missing_ok=True)
    raise ValueError(f'No se pudo verificar {url}: {"; ".join(errors)}')


def archive_notices(archive):
    texts, metadata = {}, {}
    if zipfile.is_zipfile(archive):
        with zipfile.ZipFile(archive) as zf:
            for member in zf.infolist():
                if member.is_dir() or not archive_name_safe(member.filename) or member.file_size > 2_000_000:
                    continue
                if re.search(r'(^|[._-])(licen[cs]e|copying|notice|copyright)', Path(member.filename).name, re.I):
                    texts[member.filename] = zf.read(member).decode('utf-8', errors='replace')
        return texts, metadata
    try:
        with tarfile.open(archive, 'r:*') as tf:
            for member in tf:
                if not member.isfile() or not archive_name_safe(member.name) or member.size > 2_000_000:
                    continue
                name = Path(member.name).name
                if re.search(r'(^|[._-])(licen[cs]e|copying|notice|copyright)', name, re.I):
                    texts[member.name] = tf.extractfile(member).read().decode('utf-8', errors='replace')
                elif name in ['package.json', 'Cargo.toml'] and len(Path(member.name).parts) == 2:
                    metadata[name] = tf.extractfile(member).read().decode('utf-8', errors='replace')
    except tarfile.TarError:
        # Patches remain in the source packet, but are not mislabelled as licences.
        pass
    return texts, metadata


def work_component(spec, network):
    component = {k:v for k,v in spec.items() if k != 'sourceRequests'}
    component.update(sources=[], notices=[], errors=[])
    destination = OUTPUT / spec['id']
    destination.mkdir(parents=True, exist_ok=True)
    if spec['id'].startswith('npm/'):
        metadata_file = destination/'REGISTRY.json'
        if metadata_file.is_file():
            npm = json.loads(metadata_file.read_text())
        elif network:
            url = 'https://registry.npmjs.org/'+spec['name']+'/'+spec['version']
            with urllib.request.urlopen(url, timeout=40) as response:
                npm = json.load(response)
            save_json(metadata_file, npm)
        else:
            raise ValueError('Faltan metadatos npm: '+spec['id'])
        if npm['name'] != spec['name'] or npm['version'] != spec['version']:
            raise ValueError('Identidad npm incorrecta: '+spec['id'])
        component['license'] = npm.get('license', 'REQUIERE REVISIÓN')
        requests = [{'url': npm['dist']['tarball'], 'integrity': spec['integrity']}]
    else:
        requests = spec['sourceRequests']
    for i, request in enumerate(requests):
        source = destination/f'source-{i}.archive'
        try:
            if spec['id'].startswith('cargo/') and not source.is_file():
                cached = list((Path.home()/'.cargo/registry/cache').glob('*/'+spec['name']+'-'+spec['version']+'.crate'))
                if cached and verify_integrity(cached[0].read_bytes(), request['integrity']):
                    shutil.copy2(cached[0], source)
            download(request['url'], request['integrity'], source, network)
            component['sources'].append({'path': str(source.relative_to(OUTPUT)), 'url': request['url'], 'sha256': sha(source)})
            texts, metadata = archive_notices(source)
            if 'Cargo.toml' in metadata:
                component['license'] = tomllib.loads(metadata['Cargo.toml'])['package'].get('license', 'REQUIERE REVISIÓN')
            for original, text in texts.items():
                target = destination/'notices'/f'{i}-{hashlib.sha256(original.encode()).hexdigest()[:12]}-{Path(original).name}.txt'
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(text)
                component['notices'].append({'path': str(target.relative_to(OUTPUT)), 'original': original, 'sha256': sha(target)})
        except (OSError, ValueError, urllib.error.URLError) as error:
            component['errors'].append(str(error))
    if not requests:
        component['errors'].append('Receta sin URL/hash literal de fuentes: REQUIERE REVISIÓN.')
    # Retain local vendor notices too, even if sources are not yet available.
    if spec.get('prefix'):
        for p in Path(spec['prefix']).rglob('*'):
            if p.is_file() and not p.is_symlink() and p.suffix not in ['.dylib', '.a', '.so', '.py'] and p.stat().st_size < 2_000_000 and re.search(r'(^|[._-])(licen[cs]e|copying|notice|copyright)', p.name, re.I):
                target = destination/'installed-notices'/str(p.relative_to(spec['prefix']))
                target.parent.mkdir(parents=True, exist_ok=True)
                target.unlink(missing_ok=True)
                shutil.copy2(p, target)
                component['notices'].append({'path': str(target.relative_to(OUTPUT)), 'original': 'installed/'+str(p.relative_to(spec['prefix'])), 'sha256': sha(target)})
    return component


def source_snapshot(destination):
    paths = run('git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0')
    hashes = {}
    with tarfile.open(destination, 'w:gz') as archive:
        for value in sorted(set(paths)):
            if not value:
                continue
            p = ROOT/value
            if Path(value).parts[0] in ['tmp', 'release', '.agents', '.codex'] or p.name == '.DS_Store' or p.suffix == '.bak' or p.name.startswith('.env'):
                continue
            if p.is_file() and not p.is_symlink():
                hashes[value] = sha(p)
                archive.add(p, arcname='ViaSpania/'+value, recursive=False)
    return hashes


def prepare(network):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if not NATIVE.exists():
        record_native()
    native = json.loads(NATIVE.read_text())
    for f in native['files']:
        if sha(GEO/f['path']) != f['sha256']:
            raise ValueError('Cambió el runtime; vuelva a registrar procedencia: '+f['path'])
    specs = []
    for p in npm_lock_entries((ROOT/'pnpm-lock.yaml').read_text()):
        specs.append(dict(p, id='npm/'+p['name'].replace('/', '__')+'-'+p['version']))
    for p in tomllib.loads((ROOT/'src-tauri/Cargo.lock').read_text())['package']:
        if p['name'] == 'viaspania':
            continue
        if not p.get('source', '').startswith('registry+') or not p.get('checksum'):
            raise ValueError('Origen Cargo no fijado por checksum; REQUIERE REVISIÓN: '+p['name'])
        specs.append({'id': 'cargo/'+p['name']+'-'+p['version'], 'name': p['name'], 'version': p['version'], 'sourceRequests': [{'url': f'https://static.crates.io/crates/{p["name"]}/{p["name"]}-{p["version"]}.crate', 'integrity': p['checksum']}]})
    specs.extend(native['components'])
    specs.extend(auxiliary_sources(json.loads((ROOT/'docs/NATIVE_AUXILIARY_SOURCES.json').read_text()), native['components']))
    components = []
    def job(spec):
        try:
            return work_component(spec, network)
        except Exception as error:
            return dict(spec, sources=[], notices=[], errors=[str(error)])
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i, result in enumerate(pool.map(job, specs)):
            components.append(result)
            if (i+1) % 40 == 0 or i+1 == len(specs):
                print(f'Fuentes y avisos: {i+1}/{len(specs)} componentes.', flush=True)
    findings = [f'{c["id"]}: {error}' for c in components for error in c.get('errors', [])]
    def recover_job(component):
        try:
            return recover(component, OUTPUT, network)
        except Exception as error:
            component['errors'].append('Aviso upstream pendiente: '+str(error))
            return component
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        components = list(pool.map(recover_job, components))
    components = apply_selections(components, ROOT, OUTPUT)
    findings = [f'{c["id"]}: {error}' for c in components for error in c.get('errors', [])]
    decisions = json.loads((ROOT/'docs/RELEASE_DECISIONS.json').read_text())
    required = {'rights', 'assets', 'native_scope', 'data', 'corresponding_source'}
    reviews = {item['id']: item for item in decisions.get('reviews', [])}
    for key in sorted(required):
        item = reviews.get(key, {})
        if item.get('status') != 'resolved' or not item.get('evidence'):
            findings.append('REQUIERE REVISIÓN: '+item.get('requirement', key))
        elif key == 'native_scope':
            review = json.loads((ROOT/'docs/native-evidence/REVIEW.json').read_text())
            if not native_review_matches(review, native):
                findings.append('REQUIERE REVISIÓN: cambió el runtime nativo respecto al cierre documentado de PB-2.')
        elif key == 'data':
            review_path = ROOT/'docs/data-evidence/REVIEW.json'
            review = json.loads(review_path.read_text()) if review_path.is_file() else {}
            data_files = {str(p.relative_to(GEO/'share')): sha(p) for p in (GEO/'share').rglob('*') if p.is_file()}
            implementation = {name: sha(ROOT/name) if (ROOT/name).is_file() else None for name in review.get('reviewedImplementation', {})}
            if not data_review_matches(review, data_files, implementation):
                findings.append('REQUIERE REVISIÓN: cambiaron los datos o la implementación respecto al cierre de datos/exportaciones.')
    PUBLIC.mkdir(parents=True, exist_ok=True)
    with open(PUBLIC/'THIRD_PARTY_LICENSES.txt', 'w') as output:
        output.write('ViaSpania — textos originales de dependencias inventariadas\nIncluye paquetes de build/otros targets para cobertura de fuentes; no afirma que todos se enlacen.\nLas once dependencias directas Rust usan MIT según THIRD_PARTY_NOTICES.txt. Se conservan además los textos alternativos originales sin exigir su uso conjunto cuando son OR.\n\n')
        for c in components:
            output.write('\n'+'='*72+'\n'+c['id']+'\nLicencia declarada: '+str(c.get('license', 'Véanse receta y textos; REQUIERE REVISIÓN'))+'\n')
            if c.get('selectedLicense'):
                output.write('Opción utilizada: '+c['selectedLicense']+'\nSe adjuntan declaraciones/avisos originales y el texto estándar SPDX, identificado separadamente. Los placeholders del texto estándar no asignan copyright.\n')
            if not c['notices']:
                output.write('REQUIERE REVISIÓN: no se encontró texto autónomo; fuentes y declaración no sustituyen los avisos de sus titulares.\n')
            seen = set()
            for n in c['notices']:
                if n['sha256'] in seen:
                    continue
                seen.add(n['sha256'])
                output.write('\nOrigen: '+n['original']+'\nTipo: '+n.get('kind', 'upstream-notice')+'\n'+(OUTPUT/n['path']).read_text(errors='replace')+'\n')
    # Retain the standard library notice separately from the compiler's complete licence inventory.
    rustroot = Path(run('rustc', '--print', 'sysroot').strip())
    stdnotice = rustroot/'share/doc/rustc/COPYRIGHT-library.html'
    if stdnotice.is_file():
        shutil.copy2(stdnotice, PUBLIC/'RUST_STANDARD_LIBRARY.html')
    else:
        findings.append('REQUIERE REVISIÓN: no se encontró COPYRIGHT-library.html del toolchain.')
    manifest = {'schema': 1, 'status': 'LOCAL_CANDIDATE_REQUIRES_REVIEW', 'createdAt': datetime.now(timezone.utc).isoformat(), 'platform': sys.platform, 'toolchain': run('rustc', '-Vv'), 'inputs': {p: sha(ROOT/p) for p in INPUTS}, 'native': native, 'components': components, 'findings': findings}
    save_json(OUTPUT/'MANIFEST.json', manifest)
    # Public inventory has no developer home paths or temporary-cache locations.
    public_inventory = {'schema': 1, 'status': manifest['status'], 'components': [{k:c.get(k) for k in ['id','name','version','license','selectedLicense']} for c in components], 'findings': findings}
    save_json(PUBLIC/'INVENTORY.json', public_inventory)
    shutil.copy2(ROOT/'LICENSE', PUBLIC/'GPL-3.0-only.txt')
    manifest['publicFiles'] = {str(p.relative_to(PUBLIC)): sha(p) for p in PUBLIC.rglob('*') if p.is_file()}
    manifest['dataFiles'] = {str(p.relative_to(GEO/'share')): sha(p) for p in (GEO/'share').rglob('*') if p.is_file()}
    save_json(OUTPUT/'MANIFEST.json', manifest)
    with open(OUTPUT/'STATUS.md', 'w') as output:
        output.write('# Estado del candidato local\n\nNo autorizado automáticamente para publicación.\n\n')
        for finding in release_problems(manifest, manifest['inputs']):
            output.write('- '+finding+'\n')
    print(f'Expediente preparado: {len(components)} componentes. Errores de obtención: {sum(bool(c.get("errors")) for c in components)}. Revisiones legales/documentales pendientes.', flush=True)


def check(strict=False):
    path = OUTPUT/'MANIFEST.json'
    if not path.exists():
        raise ValueError('Falta expediente. Ejecute pnpm compliance:prepare --network.')
    manifest = json.loads(path.read_text())
    current = {p: sha(ROOT/p) for p in manifest['inputs'] if (ROOT/p).is_file()}
    problems = release_problems(manifest, current)
    for field, base in [('publicFiles', PUBLIC), ('dataFiles', GEO/'share')]:
        actual = {str(p.relative_to(base)): sha(p) for p in base.rglob('*') if p.is_file()}
        if not manifest.get(field) or actual != manifest[field]:
            raise ValueError('Faltan o cambiaron avisos/datos: '+field+'; regenere el expediente.')
    for c in manifest['components']:
        for item in c.get('sources', []) + c.get('notices', []):
            if not (OUTPUT/item['path']).is_file() or sha(OUTPUT/item['path']) != item['sha256']:
                raise ValueError('Falta o cambió una fuente/aviso: '+item['path'])
    for f in manifest['native']['files']:
        if not (GEO/f['path']).is_file() or sha(GEO/f['path']) != f['sha256']:
            raise ValueError('El runtime no coincide con el expediente: '+f['path'])
    stale = [p for p in problems if p.startswith('Expediente obsoleto')]
    if stale:
        raise ValueError('\n'.join(stale))
    if strict and problems:
        raise ValueError('Publicación bloqueada por revisiones pendientes:\n'+'\n'.join(problems))
    print(f'Integridad comprobada. {len(problems)} revisiones pendientes; candidato local, no certificación GPL.', flush=True)
    return manifest


def build_inputs():
    paths = run('git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0')
    result = {}
    for value in sorted(set(paths)):
        if not value:
            continue
        p = ROOT/value
        if Path(value).parts[0] not in ['src', 'src-tauri', 'scripts', 'public'] and value not in INPUTS and not value.startswith(('tsconfig', 'vite.config')):
            continue
        if p.is_file() and not p.is_symlink() and p.suffix not in ['.bak', '.tsbuildinfo'] and p.name != '.DS_Store':
            result[value] = sha(p)
    return result


def record_build():
    check()
    save_json(ROOT/'release/BUILD_INPUTS.json', build_inputs())
    print('Entradas de la compilación nativa registradas.')


def package():
    manifest = check()
    receipt = ROOT/'release/BUILD_INPUTS.json'
    if not receipt.is_file() or json.loads(receipt.read_text()) != build_inputs():
        raise ValueError('El código cambió después de la compilación o falta su recibo. Recompile antes de generar las fuentes correspondientes.')
    snapshot = OUTPUT/'ViaSpania-source.tar.gz'
    source_hashes = source_snapshot(snapshot)
    save_json(OUTPUT/'SOURCE_FILES.json', source_hashes)
    # Include actual data, licence texts, recipes and provenance alongside the exact source archives.
    version = json.loads((ROOT/'package.json').read_text())['version']
    bundle = ROOT/f'release/ViaSpania-{version}-source-candidate.tar.gz'
    with tarfile.open(bundle, 'w:gz') as archive:
        archive.add(OUTPUT, arcname='ViaSpania-source', filter=lambda item: None if item.name.endswith('.partial') else item)
        archive.add(GEO/'compliance', arcname='ViaSpania-source/native-provenance')
        archive.add(GEO/'share', arcname='ViaSpania-source/geospatial-data')
        archive.add(ROOT/'docs/RELEASE_COMPLIANCE.md', arcname='ViaSpania-source/README.md')
    save_json(ROOT/'release/SOURCE_ARTIFACT.json', {'file': bundle.name, 'sha256': sha(bundle), 'status': manifest['status'], 'sourceFiles': source_hashes})
    print(f'Paquete de fuentes candidato: {bundle}', flush=True)


def inspect_app(path):
    path = Path(path).resolve()
    check()
    geo = path/'Contents/Resources/geospatial'
    manifest = json.loads(NATIVE.read_text())
    failures = []
    for f in manifest['files']:
        file = geo/f['path']
        # Bundlers may re-sign Mach-O; verify UUID + links, record the actual hash.
        if not file.is_file() or macho_uuid(file) != f['uuid']:
            failures.append('Binario nativo no coincide: '+f['path'])
        elif [line.strip().split(' (compatibility')[0] for line in run('otool', '-L', str(file)).splitlines()[1:]] != f['links']:
            failures.append('Enlaces nativos modificados: '+f['path'])
    actual = {str(p.relative_to(geo)) for folder in ['bin','lib'] for p in (geo/folder).glob('*') if p.is_file()}
    expected = {f['path'] for f in manifest['files']}
    if actual != expected:
        failures.append('Ficheros nativos extra/ausentes: '+str(actual ^ expected))
    expected_data = {str(p.relative_to(GEO/'share')): sha(p) for p in (GEO/'share').rglob('*') if p.is_file()}
    actual_data = {str(p.relative_to(geo/'share')): sha(p) for p in (geo/'share').rglob('*') if p.is_file()}
    if expected_data != actual_data:
        failures.append('Los datos empaquetados no coinciden con el inventario revisado.')
    compliance = path/'Contents/Resources/compliance'
    for p in PUBLIC.rglob('*'):
        if p.is_file() and (not (compliance/p.relative_to(PUBLIC)).is_file() or sha(p) != sha(compliance/p.relative_to(PUBLIC))):
            failures.append('Aviso no coincide: '+str(p.relative_to(PUBLIC)))
    source_notice = path/'Contents/Resources/SOURCE_CODE.txt'
    if not source_notice.is_file() or sha(source_notice) != sha(ROOT/'public/SOURCE_CODE.txt'):
        failures.append('Falta o cambió el aviso de acceso a fuentes.')
    artifacts = [{'path': str(p.relative_to(path)), 'sha256': sha(p)} for p in path.rglob('*') if p.is_file() and not p.is_symlink()]
    executables = list((path/'Contents/MacOS').glob('*'))
    links = {p.name: run('otool', '-L', str(p)) for p in executables if p.is_file()}
    save_json(ROOT/'release/APP_INSPECTION.json', {'path': str(path), 'status': 'LOCAL_CANDIDATE_REQUIRES_REVIEW', 'failures': failures, 'executableLinks': links, 'files': artifacts})
    if failures:
        raise ValueError('\n'.join(failures))
    print(f'.app inspeccionada: {len(artifacts)} archivos; inventario y avisos presentes. No es autorización de publicación.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['record-native','prepare','check','package','inspect-app','record-build'])
    parser.add_argument('path', nargs='?')
    parser.add_argument('--network', action='store_true')
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args()
    try:
        if args.command == 'record-native': record_native(args.path)
        elif args.command == 'prepare': prepare(args.network)
        elif args.command == 'check': check(args.strict)
        elif args.command == 'package': package()
        elif args.command == 'record-build': record_build()
        elif args.command == 'inspect-app': inspect_app(args.path or ROOT/'src-tauri/target/release/bundle/macos/ViaSpania.app')
    except Exception as error:
        print('No se pudo completar el expediente de licencias: '+str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
