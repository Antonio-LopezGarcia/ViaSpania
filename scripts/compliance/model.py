"""Pure inventory checks; no inference of legal clearance from an SPDX label."""
import base64
import hashlib
import re
import shutil
from pathlib import PurePosixPath


def archive_name_safe(name):
    p = PurePosixPath(name)
    return not p.is_absolute() and '..' not in p.parts and '\\' not in name


def verify_integrity(data, expected):
    """Accept the exact pinned SHA-256 or npm SRI; never accept missing hashes."""
    if re.fullmatch('[a-f0-9]{64}', expected or ''):
        return hashlib.sha256(data).hexdigest() == expected
    for value in (expected or '').split():
        if '-' not in value:
            continue
        algorithm, encoded = value.split('-', 1)
        if algorithm not in ('sha512', 'sha384', 'sha256'):
            continue
        if base64.b64encode(hashlib.new(algorithm, data).digest()).decode() == encoded:
            return True
    return False


def restore_pinned_source_cache(component_id, index, expected, cache_root, destination):
    """Restore an explicitly vendored source archive only when its pin matches."""
    safe_id = component_id.replace('/', '__')
    cached = cache_root / f'{safe_id}-source-{index}.archive'
    if not cached.is_file():
        return False
    if not verify_integrity(cached.read_bytes(), expected):
        raise ValueError(f'El archivo de fuente en caché no coincide con su hash: {cached.name}')
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(cached, destination)
    return True


def npm_lock_entries(text):
    # Newer pnpm lockfiles may contain a small leading YAML document for
    # packageManagerDependencies (pnpm itself) before the project lock data.
    # Read the final packages section so optional platform packages used by
    # the project are not omitted from the release compliance inventory.
    sections = text.rsplit('\npackages:\n', 1)
    if len(sections) != 2:
        raise ValueError('No se encontró la sección packages de pnpm-lock.yaml')
    block = sections[1].split('\nsnapshots:\n', 1)[0]
    result = []
    for match in re.finditer(r'^  (\S[^\n]*):\n(.*?)(?=^  \S|\Z)', block, re.M | re.S):
        key, body = match.groups()
        name, version = key.strip("'").rsplit('@', 1)
        integrity = re.search(r'integrity: ([^,}\s]+)', body)
        if not integrity:
            raise ValueError(f'Falta integridad fijada para npm {name}@{version}')
        result.append({'name': name, 'version': version, 'integrity': integrity.group(1)})
    if not result:
        raise ValueError('No se encontraron paquetes en pnpm-lock.yaml')
    return result


def formula_sources(recipe):
    """Literal URL/hash pairs only; Ruby is retained, never evaluated."""
    pairs = re.findall(r'^\s*url "([^"\n]+)"[^\n]*\n(?:[^\n]*\n){0,5}?\s*sha256 "([a-f0-9]{64})"', recipe, re.M)
    return [{'url': u, 'integrity': h} for u, h in dict.fromkeys(pairs) if '#{' not in u]


def formula_license(recipe):
    """Read the literal Homebrew license declaration without evaluating Ruby."""
    simple = re.search(r'^\s*license\s+"([^"]+)"\s*(?:#.*)?$', recipe, re.M)
    if simple:
        return simple.group(1)
    block = re.search(r'^\s*license\s+(all_of|any_of):\s*\[(.*?)^\s*\]', recipe, re.M | re.S)
    if not block:
        return None
    operator, body = block.groups()
    body = re.sub(r'#[^\n]*', '', body)
    tokens = re.findall(r'"([^"]+)"|:([A-Za-z_][A-Za-z_0-9]*)', body)
    values = [text or ("LicenseRef-Homebrew-public-domain" if symbol == 'public_domain' else '')
              for text, symbol in tokens]
    if not values or any(not value for value in values):
        return None
    return (' AND ' if operator == 'all_of' else ' OR ').join(values)


def auxiliary_sources(document, native_components):
    """Bind supplemental sources to the exact inventoried parent source."""
    if document.get('schema') != 1:
        raise ValueError('Versión desconocida del inventario de fuentes auxiliares.')
    owners = {c['id']: c for c in native_components}
    result, seen = [], set(owners)
    for component in document.get('components', []):
        owner_id = component.get('owner')
        owner = owners.get(owner_id)
        expected = component.get('ownerSourceSha256')
        # Homebrew revisions can change the native component ID without changing
        # its upstream archive. Keep the recorded ID as the preferred binding,
        # but allow a renamed/revisioned parent only when its pinned source hash
        # still identifies exactly one current native component.
        matching_owners = [c for c in native_components
                           if expected and expected in {s.get('integrity') for s in c.get('sourceRequests', [])}]
        if owner and expected in {s.get('integrity') for s in owner.get('sourceRequests', [])}:
            pass
        elif len(matching_owners) == 1:
            owner = matching_owners[0]
        else:
            raise ValueError('Cambió o falta el componente padre de la fuente auxiliar: ' + component.get('id', '?'))
        identifier = component.get('id', '')
        if not re.fullmatch(r'native-aux/[A-Za-z0-9._+-]+', identifier) or identifier in seen:
            raise ValueError('Identificador auxiliar inválido o duplicado: ' + identifier)
        sources = component.get('sourceRequests', [])
        if not sources or any(not s.get('url', '').startswith('https://') or
                              not re.fullmatch(r'[a-f0-9]{64}', s.get('integrity', '')) for s in sources):
            raise ValueError('Fuente auxiliar sin URL HTTPS/hash fijado: ' + identifier)
        seen.add(identifier)
        result.append(component)
    return result


def release_problems(manifest, current_hashes):
    problems = list(manifest.get('findings', []))
    if manifest.get('schema') != 1:
        problems.append('Expediente de licencias ausente o versión desconocida.')
    for path, expected in manifest.get('inputs', {}).items():
        if current_hashes.get(path) != expected:
            problems.append(f'Expediente obsoleto: cambió {path}')
    if not manifest.get('components'):
        problems.append('Inventario de componentes vacío.')
    for component in manifest.get('components', []):
        label = component['id']
        if not component.get('sources'):
            problems.append(f'{label}: faltan fuentes verificadas.')
        if not component.get('notices'):
            problems.append(f'{label}: faltan textos de licencia; REQUIERE REVISIÓN.')
    return problems


def native_review_matches(review, native):
    expected = review.get('reviewedRuntime', {})
    actual = {item['path']: item['sha256'] for item in native.get('files', [])}
    return bool(expected) and actual == expected and native.get('platform') == 'macos'


def data_review_matches(review, data_files, implementation_files):
    return bool(review.get('reviewedData')) and bool(review.get('reviewedImplementation')) and review['reviewedData'] == data_files and review['reviewedImplementation'] == implementation_files
