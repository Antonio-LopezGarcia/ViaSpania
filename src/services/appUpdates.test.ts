import { describe, expect, it } from 'vitest';
import { isNewerVersion, supportsCurrentPlatform } from './appUpdates';

describe('comprobación de actualizaciones', () => {
  it('compara versiones numéricas y admite prefijo v', () => {
    expect(isNewerVersion('v0.3.0', '0.2.9')).toBe(true);
    expect(isNewerVersion('0.2.3', '0.2.3')).toBe(false);
    expect(isNewerVersion('0.2.2', '0.2.3')).toBe(false);
  });
  it('requiere un instalador para la plataforma', () => {
    const release = { tag_name: 'v1', draft: false, prerelease: false, html_url: '', assets: [{ name: 'viaspania_amd64.deb' }] };
    expect(supportsCurrentPlatform(release, 'linux')).toBe(true);
    expect(supportsCurrentPlatform(release, 'darwin')).toBe(false);
  });
});
