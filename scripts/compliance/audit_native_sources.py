"""Read-only source audit. Candidate downloads are not evidence they were built."""
import hashlib
import json
from pathlib import Path
import re
import tarfile

ROOT = Path(__file__).resolve().parents[2]


def build_dependencies(recipe):
    return sorted(set(re.findall(r'^\s*depends_on "([^"\n]+)"\s*=>[^\n]*:build', recipe, re.M)))


def download_markers(text):
    pattern = r'FetchContent_Declare|ExternalProject_Add\s*\(|\[submodule|\[wrap-file\]|file\s*\(\s*DOWNLOAD'
    return [{'line': n, 'text': line.strip()[:500]} for n, line in enumerate(text.splitlines(), 1)
            if re.search(pattern, line, re.I)]


def audit(root=ROOT):
    dossier = root / 'release/compliance'
    manifest = json.loads((dossier / 'MANIFEST.json').read_text())
    native = [c for c in manifest['components'] if c['id'].startswith('native/')]
    names = {c['name'] for c in native}
    result = []
    for component in native:
        recipe = root / component['recipe']
        deps = build_dependencies(recipe.read_text())
        sources, markers = [], []
        for source in component['sources']:
            path = dossier / source['path']
            actual = hashlib.sha256(path.read_bytes()).hexdigest()
            if actual != source['sha256']:
                raise ValueError('Fuente alterada: ' + source['path'])
            sources.append({'path': source['path'], 'sha256': actual})
            try:
                with tarfile.open(path) as archive:
                    for member in archive:
                        if not member.isfile() or member.size > 1_000_000:
                            continue
                        if not member.name.endswith(('.cmake', 'CMakeLists.txt', '.wrap', '.gitmodules')):
                            continue
                        hits = download_markers(archive.extractfile(member).read().decode(errors='replace'))
                        if hits:
                            markers.append({'source': source['path'], 'file': member.name, 'markers': hits})
            except tarfile.ReadError:
                # ZIP resources and patches are hash-checked but not scanned here.
                markers.append({'source': source['path'], 'scan': 'not-a-tar-archive'})
        result.append({'id': component['id'], 'recipe': component['recipe'],
                       'recipeSha256': hashlib.sha256(recipe.read_bytes()).hexdigest(),
                       'sources': sources, 'declaredBuildDependencies': deps,
                       'buildDependenciesOutsideRuntimeInventory': [d for d in deps if d not in names],
                       'downloadCandidates': markers, 'reconstruction': 'pending'})
        print(component['id'], flush=True)
    return {'schema': 1, 'scope': 'macOS runtime; static candidate scan, not dependency closure',
            'limitations': ['Ruby conditions are not evaluated; HEAD/Linux-only dependencies may appear.',
                           'CMake markers may be disabled by the recipe. Shell/Python downloads are not covered.',
                           'No build success or legal clearance is inferred from source availability.'],
            'components': result}


if __name__ == '__main__':
    target = ROOT / 'docs/corresponding-source-evidence/INVENTORY.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(audit(), indent=2, ensure_ascii=False) + '\n')
    print('Inventario escrito: ' + str(target))
