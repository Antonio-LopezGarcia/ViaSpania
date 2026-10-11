import {describe,expect,it} from 'vitest';
import {setLanguage} from '../core/i18n';
import {translateInventoryText,translateMapLegendLabel} from './report';

describe('traducciones del inventario espacial de informes',()=>{
 const entries=['Elementos espaciales y configuración del análisis','CRS de coordenadas: EPSG:4326 (WGS 84)','Orden: longitud, latitud; grados decimales','Precisión exportada: 8 decimales','Cotas: no disponibles para los elementos de entrada.','Puntos seleccionados (2)','Facilitadores (3)','Barreras terrestres (1)','Máscara marítima (sí)','Máscara marítima (no)','Punto 4 «Site A»',' · función: origin',' · multiplicador 1,25',' · cota: no registrada',' · vértices -3.80000000, 40.40000000 (EPSG:4326)','Corredor abc · ancho 20 m · coste ×0,5','Cruce xyz · tipo bridge · obligatorio sí · barrera asociada none','Punto de interés poi · categoría source · modo discount · radio 20 m · atracción 0,5','Absoluta · vértices -3.8, 40.4','Permeable · penalización ×2'];
 it.each(['en','it'] as const)('traduce títulos, categorías y opciones al %s',language=>{
  setLanguage(language);
  const output=entries.map(translateInventoryText).join('\n').toLocaleLowerCase(language==='it'?'it-IT':'en-GB');
  for(const spanish of ['elementos espaciales','configuración del análisis','orden: longitud','puntos seleccionados','facilitadores (','barreras terrestres','barreras marítimas','función:','cota:','vértices','ancho','coste','obligatorio','barrera asociada','categoría','modo','radio','atracción','penalización','grados decimales','decimales'])expect(output).not.toContain(spanish);
  expect(output).toContain('epsg:4326');
  expect(output).toContain('-3.80000000, 40.40000000');
  expect(output).toContain(language==='it'?'maschera marina (sì)':'marine mask (yes)');
  expect(output).not.toContain('longitudee');
  expect(output).not.toContain('»');
  expect(output).toContain(language==='it'?'moltiplicatore':'multiplier');
  setLanguage('es');
 });
});

describe('traducción de elementos de la leyenda cartográfica',()=>{
 const cases=[
  {source:'Corridor preferente',es:'Corredor preferente',en:'Preferred corridor',it:'Corridoio preferenziale'},
  {source:'Barrier absolute',es:'Barrera absoluta',en:'Absolute barrier',it:'Barriera assoluta'},
  {source:'Route de aproximación 1',es:'Ruta de aproximación 1',en:'Approach route 1',it:'Percorso di avvicinamento 1'}
 ];
 it.each(['es','en','it'] as const)('normaliza las etiquetas en %s',language=>{
  setLanguage(language);
  for(const item of cases)expect(translateMapLegendLabel(item.source)).toBe(item[language]);
  setLanguage('es');
 });
});
