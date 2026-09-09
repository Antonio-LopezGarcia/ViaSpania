import base64
import hashlib
import unittest
import tempfile
import zipfile
from pathlib import Path
from release import archive_notices
from selections import validate_selection
from model import archive_name_safe, formula_sources, npm_lock_entries, release_problems, verify_integrity


class ComplianceTests(unittest.TestCase):
    def test_licence_election_requires_permission_and_exact_archive(self):
        component = {'id':'cargo/example-1', 'name':'example', 'license':'MIT OR Apache-2.0', 'sources':[{'sha256':'abc'}]}
        selection = {'id':component['id'], 'declared':component['license'], 'selected':'MIT', 'archiveSha256':'abc'}
        validate_selection(component, selection)
        with self.assertRaises(ValueError):
            validate_selection(component, dict(selection, selected='GPL-3.0-only'))
        with self.assertRaises(ValueError):
            validate_selection(component, dict(selection, archiveSha256='changed'))
        component['license'] = 'MIT AND BSD-3-Clause'
        with self.assertRaises(ValueError):
            validate_selection(component, dict(selection, declared=component['license']))

    def test_zip_retains_notices_without_reading_traversal_entries(self):
        with tempfile.TemporaryDirectory() as folder:
            archive = Path(folder)/'data.zip'
            with zipfile.ZipFile(archive, 'w') as output:
                output.writestr('data/LICENSE.txt', 'original terms')
                output.writestr('../LICENSE.txt', 'outside')
                output.writestr('data/payload.sh', 'do not execute')
            texts, _ = archive_notices(archive)
            self.assertEqual(texts, {'data/LICENSE.txt': 'original terms'})
            self.assertEqual(list(Path(folder).iterdir()), [archive])

    def test_integrity_rejects_missing_or_changed_content(self):
        content = b'licence and source'
        sri = 'sha512-' + base64.b64encode(hashlib.sha512(content).digest()).decode()
        self.assertTrue(verify_integrity(content, sri))
        self.assertTrue(verify_integrity(content, hashlib.sha256(content).hexdigest()))
        self.assertFalse(verify_integrity(content + b'changed', sri))
        self.assertFalse(verify_integrity(content, ''))

    def test_archive_paths_cannot_escape(self):
        for path in ['/etc/file', '../file', 'src/../../file', 'src\\..\\file']:
            self.assertFalse(archive_name_safe(path))
        self.assertTrue(archive_name_safe('package/LICENSE'))

    def test_lockfile_scoped_names_and_exact_integrity(self):
        text = "\npackages:\n\n  '@scope/name@1.2.3':\n    resolution: {integrity: sha512-abc}\n    peerDependencies:\n      react: '*'\n\n  plain@2.0.0:\n    resolution: {integrity: sha512-def}\n\nsnapshots:\n"
        entries = npm_lock_entries(text)
        self.assertEqual([(p['name'], p['version']) for p in entries], [('@scope/name', '1.2.3'), ('plain', '2.0.0')])

    def test_recipe_does_not_execute_ruby_or_guess_interpolations(self):
        h = 'a' * 64
        self.assertEqual(len(formula_sources(f'  url "https://example.org/source.tar.gz"\n  sha256 "{h}"\n')), 1)
        self.assertEqual(formula_sources(f'  url "https://example.org/#{{version}}"\n  sha256 "{h}"\n'), [])

    def test_gpl_does_not_block_by_name_but_missing_evidence_does(self):
        record = {'schema': 1, 'inputs': {'Cargo.lock': 'abc'}, 'findings': [], 'components': [{'id': 'poppler', 'license': 'GPL-3.0-only', 'sources': ['source'], 'notices': ['COPYING3']}]}
        self.assertEqual(release_problems(record, {'Cargo.lock': 'abc'}), [])
        self.assertTrue(release_problems(record, {'Cargo.lock': 'changed'}))
        record['findings'] = ['REQUIERE REVISIÓN: titularidad']
        record['components'][0]['notices'] = []
        self.assertEqual(len(release_problems(record, {'Cargo.lock': 'abc'})), 2)


if __name__ == '__main__':
    unittest.main()
