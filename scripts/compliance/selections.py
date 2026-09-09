"""Explicit, version-bound licence elections; never override upstream permissions."""
import hashlib
import json
from pathlib import Path
import shutil


def validate_selection(component, selection):
    if component['id'] != selection['id'] or component.get('license') != selection['declared']:
        raise ValueError('Cambió la declaración de licencia: '+selection['id'])
    if not component.get('sources') or component['sources'][0]['sha256'] != selection['archiveSha256']:
        raise ValueError('Cambió el archivo de origen de la selección: '+selection['id'])
    declaration = selection['declared']
    # Legacy Cargo spelling, corroborated by the winapi source headers.
    if declaration == 'MIT/Apache-2.0' and component['name'].startswith('winapi-'):
        declaration = 'MIT OR Apache-2.0'
    if selection['selected'] not in declaration.split(' OR '):
        raise ValueError('La licencia elegida no está ofrecida por el titular: '+selection['id'])


def apply_selections(components, root, output):
    selections = json.loads((root/'docs/LICENSE_SELECTIONS.json').read_text())['components']
    by_id = {c['id']: c for c in components}
    for selection in selections:
        component = by_id[selection['id']]
        validate_selection(component, selection)
        evidence = root/selection['declarationEvidence']
        if hashlib.sha256(evidence.read_bytes()).hexdigest() != selection['evidenceSha256']:
            raise ValueError('Cambió la evidencia de licencia: '+str(evidence))
        for source, kind in [(evidence, 'original-package-declarations-and-notices'), (root/'docs/license-evidence'/(selection['selected']+'.txt'), 'standard-SPDX-license-text')]:
            target = output/component['id']/'selected-notices'/source.name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            component['notices'].append({'path': str(target.relative_to(output)), 'original': str(source.relative_to(root)), 'kind': kind, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
        component['selectedLicense'] = selection['selected']
        component['selectionEvidence'] = selection
    return components
