import unittest
import tempfile
import json
from pathlib import Path
from audit_native_sources import audit, build_dependencies, download_markers
from model import auxiliary_sources


class NativeSourceAuditTests(unittest.TestCase):
    def test_auxiliary_source_requires_exact_owner_and_digest(self):
        parent = {'id': 'native/arrow-1', 'sourceRequests': [{'integrity': 'a' * 64}]}
        component = {'id': 'native-aux/mimalloc-1', 'owner': parent['id'],
                     'ownerSourceSha256': 'a' * 64,
                     'sourceRequests': [{'url': 'https://example.com/source', 'integrity': 'b' * 64}]}
        document = {'schema': 1, 'components': [component]}
        self.assertEqual(auxiliary_sources(document, [parent]), [component])
        for parents in [[], [dict(parent, sourceRequests=[{'integrity': 'c' * 64}])]]:
            with self.assertRaises(ValueError):
                auxiliary_sources(document, parents)
        with self.assertRaises(ValueError):
            auxiliary_sources(dict(document, components=[component, component]), [parent])
        with self.assertRaises(ValueError):
            auxiliary_sources(dict(document, components=[dict(component, sourceRequests=[])]), [parent])

    def test_tampered_source_is_rejected_before_scanning(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            dossier = root / 'release/compliance'
            dossier.mkdir(parents=True)
            (root / 'recipe.rb').write_text('depends_on "cmake" => :build')
            (dossier / 'source.archive').write_bytes(b'altered source')
            (dossier / 'MANIFEST.json').write_text(json.dumps({'components': [{
                'id': 'native/example-1', 'name': 'example', 'recipe': 'recipe.rb',
                'sources': [{'path': 'source.archive', 'sha256': '0' * 64}]}]}))
            with self.assertRaisesRegex(ValueError, 'Fuente alterada'):
                audit(root)

    def test_build_dependencies_include_mixed_roles_and_deduplicate(self):
        self.assertEqual(build_dependencies('''depends_on "cmake" => :build
depends_on "pkgconf" => [:build, :test]
depends_on "cmake" => :build
depends_on "proj"
depends_on "test-only" => :test'''), ['cmake', 'pkgconf'])

    def test_download_candidates_keep_source_line_numbers(self):
        self.assertEqual([x['line'] for x in download_markers('''# configuration
FetchContent_Declare(foo)
file(DOWNLOAD "https://example.com" target)
[submodule "foo"]
find_package(TIFF)''')], [2, 3, 4])
