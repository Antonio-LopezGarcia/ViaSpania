export type ElevationSourceId='mdt5'|'mdt25'|'mdt200'|'mds05'|'copernicus30';
export type SurfaceModelId='mds05'|'copernicus30';

export interface ElevationSource {
  id:ElevationSourceId;
  kind:'terrain'|'surface';
  label:string;
  shortLabel:string;
  resolutionM:number;
  coverage:string;
  access:'mdt-wcs'|'mds-wcs'|'copernicus-cog';
  coverageId?:string;
  attribution:string;
}

export const SURFACE_WARNING='Los MDS contienen edificios y vegetación y están destinados a análisis específicos de superficie. No son adecuados para calcular rutas o pendientes del terreno. Los resultados de esos cálculos pueden diferir en gran medida de la realidad.';

export const ELEVATION_SOURCES:Record<ElevationSourceId,ElevationSource>={
  mdt5:{id:'mdt5',kind:'terrain',label:'MDT05 · 5 m',shortLabel:'MDT05',resolutionM:5,coverage:'España',access:'mdt-wcs',coverageId:'Elevacion4258_5',attribution:'IGN/CNIG · WCS MDT de España'},
  mdt25:{id:'mdt25',kind:'terrain',label:'MDT25 · 25 m',shortLabel:'MDT25',resolutionM:25,coverage:'España',access:'mdt-wcs',coverageId:'Elevacion4258_25',attribution:'IGN/CNIG · WCS MDT de España'},
  mdt200:{id:'mdt200',kind:'terrain',label:'MDT200 · 200 m',shortLabel:'MDT200',resolutionM:200,coverage:'España',access:'mdt-wcs',coverageId:'Elevacion4258_200',attribution:'IGN/CNIG · WCS MDT de España'},
  mds05:{id:'mds05',kind:'surface',label:'MDS05 · 1.ª cobertura',shortLabel:'MDS05',resolutionM:5,coverage:'1.ª cobertura',access:'mds-wcs',coverageId:'mds05',attribution:'Obra derivada de MDS05 · CC-BY 4.0 scne.es'},
  copernicus30:{id:'copernicus30',kind:'surface',label:'Copernicus DEM GLO-30 · MDS global',shortLabel:'Copernicus GLO-30',resolutionM:30,coverage:'Global · GLO-30 Public',access:'copernicus-cog',attribution:'Produced using Copernicus WorldDEM-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved'},
};

export function enabledElevationSources(enabled:Record<ElevationSourceId,boolean>){return (Object.values(ELEVATION_SOURCES) as ElevationSource[]).filter(source=>enabled[source.id])}
export function isSurfaceSource(id:ElevationSourceId){return ELEVATION_SOURCES[id].kind==='surface'}

function degreeCode(value:number,positive:string,negative:string,digits:number){const rounded=Math.floor(value),prefix=rounded<0?negative:positive;return`${prefix}${Math.abs(rounded).toString().padStart(digits,'0')}_00`}
export function copernicusGlo30TileUrls([west,south,east,north]:[number,number,number,number]){
  if(![west,south,east,north].every(Number.isFinite)||west>=east||south>=north||west < -180||east > 180||south < -90||north > 90)throw new Error('La extensión de Copernicus GLO-30 no es válida');
  const urls:string[]=[];
  for(let lat=Math.floor(south);lat<Math.ceil(north);lat++)for(let lon=Math.floor(west);lon<Math.ceil(east);lon++){
    const tile=`Copernicus_DSM_COG_10_${degreeCode(lat,'N','S',2)}_${degreeCode(lon,'E','W',3)}_DEM`;
    urls.push(`https://copernicus-dem-30m.s3.amazonaws.com/${tile}/${tile}.tif`);
  }
  return urls;
}
