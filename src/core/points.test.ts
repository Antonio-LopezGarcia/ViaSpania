import {describe,it,expect} from 'vitest';
import {appendPoint,movePoint,projectPoints,sequentialValidation,selectedOrigins,pointColor} from './points';
import {directedPairs,sequentialPairs} from './multiroute';
import {parseCsv,parseGeoJson} from './importers';
import {exportPointsCsv,exportPointsGeoJson} from './geospatialExports';
import type {GeoPoint} from '../types';
const a:GeoPoint={id:8,name:'A',comments:'memoria',lon:0,lat:1,crs:'EPSG:4326',role:'final',provenance:{source:'geonames',sourceId:'1',displayName:'A',original:[0,1],originalCrs:'EPSG:4326',projected:{crs:'EPSG:32631',coordinate:[1,2]}}},b:GeoPoint={...a,id:2,name:'B',role:'inicio'},c:GeoPoint={...a,id:19,name:'C',role:'multipunto'};
const names=(points:readonly GeoPoint[])=>sequentialPairs(points).map(pair=>pair.map(point=>point.name));
describe('lista ordenada de cálculo',()=>{
 it('añade tres y un cuarto punto sin sustituciones ni colisiones',()=>{let points:GeoPoint[]=[];for(let i=0;i<3;i++)points=appendPoint(points,{lon:i,lat:1});expect(points).toHaveLength(3);const next=appendPoint(points,{lon:3,lat:1});expect(next.slice(0,3)).toEqual(points);expect(next[3]).toMatchObject({id:4,name:'Punto 4'});expect(appendPoint([a,b,c],{lon:0,lat:1}).at(-1)?.id).toBe(20)});
 it('reordena C A B y conserva los objetos y metadatos',()=>{const points=movePoint([a,b,c],c.id,-2);expect(names(points)).toEqual([['C','A'],['A','B']]);expect(points[1]).toBe(a);expect(movePoint(points,c.id,-1)).toEqual(points)});
 it('al eliminar B conecta A C y con dos puntos produce un tramo',()=>{expect(names([a,b,c].filter(point=>point.id!==b.id))).toEqual([['A','C']]);expect(sequentialPairs([a,b])).toHaveLength(1)});
 it('valida cantidad, coordenadas, área y elevación',()=>{expect(sequentialValidation([a],[-2,-2,2,2],true)).toMatch(/al menos dos puntos/);expect(sequentialValidation([a,{...b,lat:NaN}],[-2,-2,2,2],true)).toMatch(/coordenadas/);expect(sequentialValidation([a,b],null,true)).toMatch(/área/);expect(sequentialValidation([a,b],[2,2,3,3],true)).toMatch(/dentro/);expect(sequentialValidation([a,b],[-2,-2,2,2],false)).toMatch(/elevación/);expect(sequentialValidation([a,b],[-2,-2,2,2],true)).toBeNull()});
 it('migra roles antiguos solo una vez sin perder puntos',()=>{expect(projectPoints([a,c,b],undefined)).toEqual([b,c,a]);expect(projectPoints([a,c,b],'array')).toEqual([a,c,b]);expect(projectPoints([c,a],undefined)).toEqual([c,a]);expect(projectPoints([c,b],undefined)).toEqual([b,c])});
 it.each(['CSV','GeoJSON'])('%s conserva orden, roles, comentarios y procedencia',format=>{const points=[a,c,b].map(point=>({...point,elevationM:null}));const result=format==='CSV'?parseCsv(exportPointsCsv(points)):parseGeoJson(exportPointsGeoJson(points));expect(result).toEqual([a,c,b])});
 it('elige orígenes por identificador sin semántica de rol',()=>{expect(selectedOrigins([a,b,c],'19')).toEqual([c]);expect(selectedOrigins([a,b,c],'todos')).toEqual([a,b,c]);expect(selectedOrigins([a,b,c],'999')).toEqual([])});
 it('asigna colores diferentes por posición',()=>expect(new Set(Array.from({length:30},(_,index)=>pointColor(index))).size).toBe(30));
});

it('la matriz incluye todos los puntos, incluso después del octavo, e ignora roles',()=>{const points=Array.from({length:10},(_,index)=>({...a,id:index}));const pairs=directedPairs(points);expect(pairs).toHaveLength(90);expect(pairs.filter(pair=>pair.from.id===9)).toHaveLength(9);expect(directedPairs([a,b,c]).map(pair=>[pair.from.name,pair.to.name])).toEqual([['A','B'],['A','C'],['B','A'],['B','C'],['C','A'],['C','B']])});
