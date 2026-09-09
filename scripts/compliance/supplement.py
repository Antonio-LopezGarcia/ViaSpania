"""Recover omitted notices from the upstream revision recorded by a package.
GitHub tree/blob evidence is retained; no guessed tag or current main branch.
"""
import hashlib
import json
from pathlib import Path
import re
import tarfile
import threading
import tomllib
import urllib.request
from urllib.parse import quote
TREE_LOCK = threading.Lock()


def recover(component, output, network):
    if component.get('notices') or not component.get('sources'):
        return component
    directory = output/component['id']
    evidence = directory/'UPSTREAM_NOTICES.json'
    if evidence.exists():
        record = json.loads(evidence.read_text())
        component['notices'].extend(record['notices'])
        component['noticeEvidence'] = record['evidence']
        return component
    if not network:
        return component
    repository, revision, folder = '', '', ''
    if component['id'].startswith('npm/'):
        metadata = json.loads((directory/'REGISTRY.json').read_text())
        repository = metadata.get('repository', '')
        if isinstance(repository, dict):
            folder = repository.get('directory', '')
            repository = repository.get('url', '')
        revision = metadata.get('gitHead', '')
    elif component['id'].startswith('cargo/'):
        with tarfile.open(output/component['sources'][0]['path']) as archive:
            for member in archive:
                if not member.isfile() or len(Path(member.name).parts) != 2:
                    continue
                if member.name.endswith('/Cargo.toml'):
                    repository = tomllib.loads(archive.extractfile(member).read().decode())['package'].get('repository', '')
                if member.name.endswith('/.cargo_vcs_info.json'):
                    vcs = json.load(archive.extractfile(member))
                    revision = vcs.get('git', {}).get('sha1', '')
                    folder = vcs.get('path_in_vcs', '')
    match = re.search(r'github.com[/:]([^/]+/[^/#]+)', repository)
    if not match or not re.fullmatch('[a-f0-9]{40}', revision):
        return component
    repo = match.group(1).removesuffix('.git')
    url = f'https://api.github.com/repos/{repo}/git/trees/{revision}?recursive=1'
    tree_file = output/'upstream-trees'/(hashlib.sha256(url.encode()).hexdigest()+'.json')
    with TREE_LOCK:
        if tree_file.exists():
            tree = json.loads(tree_file.read_text())
        else:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ViaSpania-license-audit'}), timeout=45) as response:
                tree = json.load(response)
            tree_file.parent.mkdir(parents=True, exist_ok=True)
            tree_file.write_text(json.dumps(tree))
    if tree.get('truncated'):
        return component
    parents = {''}
    path = Path(folder)
    if folder:
        parents.update(str(p) for p in [path, *path.parents] if str(p) != '.')
    notices = []
    for entry in tree.get('tree', []):
        file = Path(entry['path'])
        parent = str(file.parent) if str(file.parent) != '.' else ''
        if entry['type'] != 'blob' or parent not in parents or not re.match(r'^(licen[cs]e|copying|copyright|notice)([._-]|$)', file.name, re.I):
            continue
        if entry.get('size', 0) > 2_000_000:
            continue
        raw_url = f'https://raw.githubusercontent.com/{repo}/{revision}/'+quote(entry['path'])
        with urllib.request.urlopen(raw_url, timeout=45) as response:
            data = response.read(2_000_001)
        git_sha = hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
        if git_sha != entry['sha']:
            raise ValueError('El aviso no coincide con el blob Git: '+raw_url)
        target = directory/'upstream-notices'/(entry['sha']+'-'+file.name+'.txt')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        notices.append({'path': str(target.relative_to(output)), 'original': raw_url, 'sha256': hashlib.sha256(data).hexdigest(), 'gitBlob': git_sha})
    if notices:
        record = {'evidence': {'repository': repository, 'revisionRecordedByPackage': revision, 'treeUrl': url, 'packageArchiveSha256': component['sources'][0]['sha256']}, 'notices': notices}
        evidence.write_text(json.dumps(record, indent=2)+'\n')
        component['notices'].extend(notices)
        component['noticeEvidence'] = record['evidence']
    return component
