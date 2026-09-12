// @vitest-environment jsdom
import {act,cleanup,render} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {LocalizationBoundary,setLanguage,translateText} from './i18n';
import {ELEVATION_SOURCES} from './elevationSources';
import {builtInMapAttribution} from './mapSources';
import {terrainAttribution} from './dataAttributions';
import {drawVideoAttribution} from './videoOverlays';
afterEach(()=>{cleanup();setLanguage('es')});
it('traduce créditos combinados de ortofoto y elevación y restaura el español',()=>{
 const credit=terrainAttribution('copernicus-vhr-2021',undefined,ELEVATION_SOURCES.mds05.attribution)!;
 setLanguage('es');const view=render(<LocalizationBoundary><span className="terrain-3d-attribution">{credit}</span></LocalizationBoundary>);
 act(()=>setLanguage('en'));expect(view.container.textContent).toContain('ViaSpania map composition');expect(view.container.textContent).toContain('Derived from MDS05');expect(view.container.textContent).toContain('CC-BY 4.0 scne.es');
 act(()=>setLanguage('es'));expect(view.container.textContent).toBe(credit);
});
it('traduce los avisos de MDT, Copernicus y cartografía sin perder autores o enlaces',()=>{
 setLanguage('en');
 for(const id of ['mdt5','mdt25','mdt200'] as const)expect(translateText(ELEVATION_SOURCES[id].attribution)).toBe('IGN/CNIG · WCS DTM of Spain · https://www.ign.es/web/politica-datos');
 const copernicus=translateText(ELEVATION_SOURCES.copernicus30.attribution);
 expect(copernicus).toContain('Conditions for subsequent users: https://documentation.dataspace.copernicus.eu/');expect(copernicus).toContain('accept no liability');expect(copernicus).toContain('© DLR e.V. 2010–2014');expect(copernicus).not.toContain('Las organizaciones');
 expect(translateText(builtInMapAttribution('AMS_1956-1957'))).toBe('© Instituto Geográfico Nacional de España · Historical PNOA · CC BY 4.0');
});
it('dibuja los créditos en inglés en las capturas y vídeos',()=>{
 setLanguage('en');const fillText=vi.fn(),context={save:vi.fn(),restore:vi.fn(),fillRect:vi.fn(),measureText:(text:string)=>({width:text.length*6}),fillText} as unknown as CanvasRenderingContext2D;
 drawVideoAttribution(context,1280,720,ELEVATION_SOURCES.mds05.attribution);
 expect(fillText.mock.calls.map(call=>call[0]).join('')).toBe('Derived from MDS05 · CC-BY 4.0 scne.es');
});
