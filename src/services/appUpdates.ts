import { BUILD_INFO } from '../core/buildInfo';

export const RELEASES_URL = 'https://github.com/traxtiber/ViaSpania/releases';
const RELEASES_API = 'https://api.github.com/repos/traxtiber/ViaSpania/releases?per_page=100';

export interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  html_url: string;
  assets: { name: string }[];
}

export function isNewerVersion(candidate: string, installed: string): boolean {
  const parse = (version: string) => version.replace(/^v/i, '').split(/[+-]/, 1)[0].split('.').map(Number);
  const next = parse(candidate), current = parse(installed);
  if (!next.length || !current.length || [...next, ...current].some(value => !Number.isInteger(value) || value < 0)) return false;
  for (let i = 0; i < Math.max(next.length, current.length); i++) {
    if ((next[i] ?? 0) !== (current[i] ?? 0)) return (next[i] ?? 0) > (current[i] ?? 0);
  }
  return false;
}

export function supportsCurrentPlatform(release: GitHubRelease, platform = BUILD_INFO.platform): boolean {
  const names = release.assets.map(asset => asset.name.toLowerCase());
  if (!names.length) return false;
  if (/darwin|macos|mac\b/.test(platform)) return names.some(name => name.endsWith('.dmg') || name.endsWith('.app.tar.gz'));
  if (/win/.test(platform)) return names.some(name => name.endsWith('.msi') || name.endsWith('.exe'));
  if (/linux/.test(platform)) return names.some(name => name.endsWith('.appimage') || name.endsWith('.deb') || name.endsWith('.rpm'));
  return false;
}

export async function findAppUpdate(fetcher: typeof fetch = fetch): Promise<GitHubRelease | null> {
  const response = await fetcher(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`GitHub: ${response.status}`);
  const releases = await response.json() as GitHubRelease[];
  if (!Array.isArray(releases)) throw new Error('Respuesta no válida de GitHub.');
  return releases.find(release => !release.draft && !release.prerelease && isNewerVersion(release.tag_name, BUILD_INFO.version) && supportsCurrentPlatform(release)) ?? null;
}
