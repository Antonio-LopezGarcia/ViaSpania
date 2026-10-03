import json
from pathlib import Path
import platform
import tempfile
import unittest
from unittest.mock import patch
from video import SPEC, validate_configuration, validate_windows_dlls, notices, verify


class VideoComplianceTests(unittest.TestCase):
    def setUp(self):
        self.spec = json.loads(SPEC.read_text())

    def version(self, flags):
        return 'configuration: --prefix=/tmp/private-build '+' '.join(flags)

    def test_exact_reviewed_recipe(self):
        validate_configuration(self.version(self.spec['ffmpegConfigure']), self.spec)

    def test_reject_unreviewed_or_incompatible_build(self):
        original = self.spec['ffmpegConfigure']
        for extra in ['--enable-nonfree', '--enable-libfdk-aac', '--enable-openssl', '--enable-shared']:
            with self.assertRaises(ValueError):
                validate_configuration(self.version(original+[extra]), self.spec)
        for required in ['--enable-gpl', '--enable-version3', '--enable-libx264', '--disable-autodetect']:
            with self.assertRaises(ValueError):
                validate_configuration(self.version([f for f in original if f != required]), self.spec)

    def test_sources_are_pinned_and_licenses_retained(self):
        for component in self.spec['components']:
            self.assertEqual(component['selectedLicense'], 'GPL-3.0-only')
            self.assertRegex(component['sourceRequests'][0]['integrity'], r'^[0-9a-f]{64}$')
        text = notices()
        for credit in ['Independent JPEG Group', 'x264 project', 'GNU GENERAL PUBLIC LICENSE', 'GNU LESSER GENERAL PUBLIC LICENSE']:
            self.assertIn(credit, text)

    def test_windows_runtime_dlls_must_be_system_provided(self):
        validate_windows_dlls(['KERNEL32.dll', 'api-ms-win-crt-runtime-l1-1-0.dll'])
        with self.assertRaisesRegex(ValueError, 'libwinpthread-1.dll'):
            validate_windows_dlls(['KERNEL32.dll', 'libwinpthread-1.dll'])
        with self.assertRaisesRegex(ValueError, 'no se encontraron imports'):
            validate_windows_dlls([])

    def test_binary_or_source_tampering_fails_before_execution(self):
        with tempfile.TemporaryDirectory() as directory:
            resource = Path(directory)
            (resource/'ffmpeg').write_bytes(b'modified binary')
            manifest = {'inputs': {}, 'platform': platform.system(), 'machine': platform.machine(),
                        'binary': 'ffmpeg', 'files': {'ffmpeg': '0'*64}}
            (resource/'BUILD.json').write_text(json.dumps(manifest))
            with patch('video.inputs', return_value={}), patch('video.subprocess.check_output') as execute:
                with self.assertRaisesRegex(ValueError, 'modificados/ausentes'):
                    verify(resource)
                execute.assert_not_called()


if __name__ == '__main__':
    unittest.main()
