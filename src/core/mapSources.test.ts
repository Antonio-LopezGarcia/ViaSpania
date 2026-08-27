import {describe,expect,it} from 'vitest';
import {DEFAULT_APP_SETTINGS} from './appSettings';
import {BUILT_IN_MAP_SOURCES} from './mapSources';

describe('catálogo de cartografía',()=>{
  it('incluye enlaces oficiales y una preferencia para cada fuente',()=>{expect(new Set(BUILT_IN_MAP_SOURCES.map(source=>source.id)).size).toBe(BUILT_IN_MAP_SOURCES.length);for(const source of BUILT_IN_MAP_SOURCES){expect(source.url).toMatch(/^https:\/\//);expect(DEFAULT_APP_SETTINGS.enabledMapSources[source.id]).toBe(true)}});
});
