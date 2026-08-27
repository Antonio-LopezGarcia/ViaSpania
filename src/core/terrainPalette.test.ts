import {describe,expect,it} from 'vitest';
import {terrainPaletteRgb} from './terrainPalette';

describe('paletas compartidas del MDT y el terreno 3D',()=>{
 it('respeta exactamente las paradas de la paleta Terreno',()=>{
  expect(terrainPaletteRgb(1,0,3500,'terrain')).toEqual([55/255,145/255,75/255]);
  expect(terrainPaletteRgb(700,0,3500,'terrain')).toEqual([215/255,190/255,115/255]);
  expect(terrainPaletteRgb(3500,0,3500,'terrain')).toEqual([1,1,1]);
 });
 it('interpola por elevación absoluta y no por la extensión visible',()=>{
  expect(terrainPaletteRgb(300,250,350,'terrain')).toEqual(terrainPaletteRgb(300,0,3000,'terrain'));
 });
 it('mantiene la escala de grises ajustada al rango del MDT',()=>{
  expect(terrainPaletteRgb(150,100,200,'grayscale')).toEqual([.5,.5,.5]);
 });
});
