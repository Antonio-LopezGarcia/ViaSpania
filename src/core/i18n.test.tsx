// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {useState} from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {LocalizationBoundary,setLanguage,translateText} from './i18n';
afterEach(()=>cleanup());
describe('localización',()=>{
  it('indica el panel de selección para añadir puntos en ambos idiomas',()=>{const message='No hay puntos seleccionados. Añádalos en el panel de selección.';setLanguage('es');expect(translateText(message)).toBe(message);setLanguage('en');expect(translateText(message)).toBe('No points are selected. Add them in the selection panel.');expect(translateText('Exportar vídeo')).toBe('Export video');expect(translateText('Exportar animación GIF')).toBe('Export GIF animation');setLanguage('es')});
  it('traduce la interfaz y permite volver al español',()=>{setLanguage('es');render(<LocalizationBoundary><button aria-label="Configuración">Nuevo proyecto</button></LocalizationBoundary>);act(()=>setLanguage('en'));expect(screen.getByRole('button',{name:'Settings'}).textContent).toBe('New project');act(()=>setLanguage('es'));expect(screen.getByRole('button',{name:'Configuración'}).textContent).toBe('Nuevo proyecto')});
  it('traduce nodos y atributos que React actualiza después del montaje',async()=>{function Dynamic(){const[done,setDone]=useState(false);return <button aria-label={done?'Cerrar ayuda':'Configuración'} onClick={()=>setDone(true)}>{done?'Calcular matriz multipunto':'Nuevo proyecto'}</button>}setLanguage('en');render(<LocalizationBoundary><Dynamic/></LocalizationBoundary>);expect(screen.getByRole('button',{name:'Settings'}).textContent).toBe('New project');fireEvent.click(screen.getByRole('button'));await screen.findByRole('button',{name:'Close help'});expect(screen.getByRole('button').textContent).toBe('Calculate multipoint matrix');setLanguage('es')});
  it('traduce texto técnico dinámico sin producir frases híbridas',()=>{setLanguage('en');expect(translateText('Coste acumulado: 12 J · Página 1 de 2')).toBe('Accumulated cost: 12 J · Page 1 of 2');expect(translateText('Ruta de vuelta · Tobler')).toBe('Return route · Tobler');expect(translateText('48.0 GB de memoria detectada')).toBe('48.0 GB of memory detected');expect(translateText('Límite recomendado: 5.000.000 celdas')).toBe('Recommended limit: 5.000.000 cells');expect(translateText('Informe de Ruta simple')).toBe('Simple route report');expect(translateText('Visor 3D preparado: 200 × 150 vértices.')).toBe('3D viewer ready: 200 × 150 vertices.');expect(translateText('MDT05 cargado y reproyectado a EPSG:25830: 12 MB')).toBe('MDT05 loaded and reprojected to EPSG:25830: 12 MB');expect(translateText('Ruta subóptima ida · rango 2 · +8.0 % · 65 % compartido')).toBe('Outbound sub-optimal route · rank 2 · +8.0 % · 65 % shared');expect(translateText('Itinerario subóptimo completo · rango 3')).toBe('Complete sub-optimal itinerary · rank 3');expect(translateText('Pasillo LCP calculado: 1,250 celdas · umbral 20 % · superficie preparada')).toBe('LCP corridor calculated: 1,250 cells · threshold 20 % · prepared surface');expect(translateText('Perfil: Tobler por caminos')).toBe('Profile: Tobler on paths');expect(translateText('Curvas · intervalo 20 m')).toBe('Contours · interval 20 m');expect(translateText('3.000.000 · recomendado · 9–16 GB')).toBe('3,000,000 · recommended · 9–16 GB');setLanguage('es')});
});

describe('regresiones de la revisión inglesa',()=>{
 afterEach(()=>setLanguage('es'));
 it.each([
  ['Calculando 3 rutas subóptimas ida…','Calculating 3 sub-optimal routes · outbound…'],
  ['3 ruta(s) subóptima(s) vuelta; los costes se han evaluado sobre la superficie original.','3 sub-optimal route(s) · return; costs have been evaluated on the original surface.'],
  ['6 conexiones dirigidas calculadas y representadas para 3 puntos.','6 directed connections calculated and displayed for 3 points.'],
  ['GeoNames no está disponible (HTTP 503).','GeoNames is unavailable (HTTP 503).'],
  ['Error de archivo: El archivo no existe','File error: The file does not exist'],
  ['GDAL no pudo procesar el archivo: gdalwarp no está instalado','GDAL could not process the file: gdalwarp is not installed'],
  ['El MDT contiene 6000000 celdas; el límite de procesado configurado es 3000000. Reduzca el área, utilice MDT25/MDT200 o cambie las Opciones de procesado.','The DTM contains 6000000 cells; the configured processing limit is 3000000. Reduce the area, use MDT25/MDT200 or change the Processing options.'],
  ['Descripción: Velocidad de marcha según pendiente firmada.','Description: Walking speed based on signed slope.'],
  ['Límite del pasillo · +20%','Corridor limit · +20%'],
 ])('traduce el mensaje completo: %s',(source,expected)=>{setLanguage('en');expect(translateText(source)).toBe(expected)});
 it('traduce texto SVG, grupos de opciones y atributos accesibles y restaura español',()=>{
  setLanguage('es');render(<LocalizationBoundary><svg><text>Cota (m)</text></svg><img alt="Superficie del pasillo LCP"/><select aria-label="Tipo"><optgroup label="Terreno"><option>MDT</option></optgroup></select><input placeholder="Sin categoría" aria-label="Nombre del corredor"/></LocalizationBoundary>);
  act(()=>setLanguage('en'));
  expect(screen.getByText('Elevation (m)')).toBeTruthy();expect(screen.getByAltText('LCP corridor surface')).toBeTruthy();expect(document.querySelector('optgroup')?.label).toBe('Terrain');expect(screen.getByPlaceholderText('Uncategorised')).toBeTruthy();
  act(()=>setLanguage('es'));expect(screen.getByText('Cota (m)')).toBeTruthy();expect(screen.getByAltText('Superficie del pasillo LCP')).toBeTruthy();
 });
 it('preserva los nombres propios, datos escritos y símbolos institucionales',()=>{
  setLanguage('en');render(<LocalizationBoundary><span translate="no">Ruta de España</span><textarea defaultValue="Ruta de España"/><span>© Instituto Geográfico Nacional de España</span></LocalizationBoundary>);
  expect(screen.getByText('Ruta de España',{selector:'span'})).toBeTruthy();expect(screen.getByDisplayValue('Ruta de España')).toBeTruthy();expect(screen.getByText('© Instituto Geográfico Nacional de España')).toBeTruthy();
  expect(translateText('así')).toBe('así');
 });
});

describe('mensajes de exportación 3D',()=>{
 afterEach(()=>setLanguage('es'));
 it.each([
  ['Exportar fotograma PNG','Export frame'],
  ['Creando AVI · 25 %','Creating AVI · 25 %'],
  ['Creando GIF · 100 %','Creating GIF · 100 %'],
  ['Guardado · 1920 × 1080 px · 20.0 s · 1× · AVI','Saved · 1920 × 1080 px · 20.0 s · 1× · AVI'],
  ['Guardado · 1280 × 720 px · 20.0 s · 1× · GIF','Saved · 1280 × 720 px · 20.0 s · 1× · GIF'],
  ['Guardado · 854 × 480 px · 10.5 s · 2× · AVI','Saved · 854 × 480 px · 10.5 s · 2× · AVI'],
  ['Fotograma PNG guardado · 1920 × 1080 px','PNG frame saved · 1920 × 1080 px'],
  ['Preparando fotograma PNG…','Preparing PNG frame…'],
  ['Cargando capa base…','Loading base layer…'],
  ['Guardado cancelado.','Save cancelled.'],
  ['Exportación cancelada.','Export cancelled.'],
  ['Exportación cancelada; recursos liberados.','Export cancelled; resources released.'],
  ['No se pudo codificar el fotograma.','The frame could not be encoded.'],
 ])('traduce sin alterar los datos: %s',(source,expected)=>{
  setLanguage('en');expect(translateText(source)).toBe(expected);
  setLanguage('es');expect(translateText(source)).toBe(source);
 });
});
