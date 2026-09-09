"""Pure inventory checks; no inference of legal clearance from an SPDX label."""
import base64
import hashlib
import re
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


def npm_lock_entries(text):
    block = text.split('\npackages:\n', 1)[1].split('\nsnapshots:\n', 1)[0]
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
