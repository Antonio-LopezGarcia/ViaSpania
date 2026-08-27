import type { SelectionStats } from '../types';
export function selectionStats(widthM:number,heightM:number,resolutionM:number):SelectionStats{const columns=Math.ceil(widthM/resolutionM),rows=Math.ceil(heightM/resolutionM),cells=columns*rows;return{widthM,heightM,rows,columns,areaKm2:widthM*heightM/1e6,cells,diskMb:cells*4/1048576,memoryMb:cells*28/1048576};}
export function utmEpsg(lon:number,lat:number){if(lat<0||lat>84||lon< -180||lon>180)throw new Error('Coordenadas fuera del dominio UTM');const zone=Math.floor((lon+180)/6)+1;return lat>=0?25800+zone:32700+zone;}
