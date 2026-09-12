// ViaSpania
// Copyright © 2026 Antonio López García, Universidad de Granada
// Este programa se distribuye bajo la licencia GPL-3.0-only.
import {expect,it} from 'vitest';
import {terrainAttribution} from './dataAttributions';

it('preserva el crédito externo y el origen del relieve sin atribuirlo al mapa base',()=>{
 expect(terrainAttribution('osm',{name:'Mapa',attribution:'© Autor · licencia propia'},'Relieve importado')).toBe('© Autor · licencia propia\nRelieve importado');
});
it('no inventa permisos para fuentes externas sin atribución',()=>{
 expect(terrainAttribution(undefined,{name:'Mapa'})).toContain('REQUIERE REVISIÓN');
 expect(terrainAttribution(undefined,undefined)).toBeUndefined();
});
it('incluye la dirección de atribución OSM en imágenes no interactivas',()=>{
 expect(terrainAttribution('osm',undefined)).toContain('https://www.openstreetmap.org/copyright');
});
