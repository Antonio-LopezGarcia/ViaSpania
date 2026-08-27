import type { GeoPoint, PointRole } from '../types';

function splitCsvLine(line:string,separator:string){const values:string[]=[],pattern=new RegExp(`(?:^|${separator})(?:"((?:[^"]|"")*)"|([^${separator}]*))`,'g');let match:RegExpExecArray|null;while((match=pattern.exec(line)))values.push((match[1]??match[2]??'').replaceAll('""','"').trim());return values}
function role(value:string):PointRole {return value==='inicio'||value==='final'||value==='multipunto'?value:'multipunto'}

export function parseCsv(text:string):GeoPoint[]{
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.length<2)return[];
  const sep=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?';':',';
  const headers=splitCsvLine(lines[0],sep).map(value=>value.toLowerCase());
  for(const required of ['id','nombre','longitud','latitud'])if(!headers.includes(required))throw new Error(`Falta la columna ${required}`);
  const seen=new Set<number>();return lines.slice(1).filter(Boolean).map((line,row)=>{const values=splitCsvLine(line,sep),get=(...names:string[])=>{const index=names.map(name=>headers.indexOf(name)).find(value=>value>=0);return index==null?'' : values[index]??''},id=Number(get('id')),name=get('nombre','name'),lon=Number(get('longitud','longitude','lon')),lat=Number(get('latitud','latitude','lat'));
    if(!Number.isInteger(id)||seen.has(id))throw new Error(`Identificador inválido o duplicado en fila ${row+2}`);if(!name||name.length>20)throw new Error(`El nombre de la fila ${row+2} debe tener entre 1 y 20 caracteres`);if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon < -180||lon>180||lat< -90||lat>90)throw new Error(`Coordenadas inválidas en fila ${row+2}`);seen.add(id);return{id,name,comments:get('comentarios','comments'),lon,lat,crs:'EPSG:4326',role:role(get('rol','role'))};
  });
}

export function parseGeoJson(text:string):GeoPoint[]{const data=JSON.parse(text),features=data.type==='FeatureCollection'?data.features:[data];let id=1;return features.flatMap((feature:any)=>{const geometry=feature.geometry;if(!geometry||!['Point','MultiPoint'].includes(geometry.type))return[];const coordinates=geometry.type==='Point'?[geometry.coordinates]:geometry.coordinates;return coordinates.map((coordinate:number[])=>{const pointId=Number.isInteger(feature.id)&&geometry.type==='Point'?feature.id:id,name=String(feature.properties?.name??feature.properties?.nombre??`Punto ${id}`).slice(0,20),pointRole=role(String(feature.properties?.role??feature.properties?.rol??'multipunto'));id=Math.max(id+1,pointId+1);if(!Array.isArray(coordinate)||!Number.isFinite(coordinate[0])||!Number.isFinite(coordinate[1])||coordinate[0] < -180||coordinate[0]>180||coordinate[1]< -90||coordinate[1]>90)throw new Error('El GeoJSON contiene coordenadas de punto inválidas');return{id:pointId,name,comments:String(feature.properties?.comments??feature.properties?.comentarios??''),lon:coordinate[0],lat:coordinate[1],crs:'EPSG:4326' as const,role:pointRole};});});}
export function csvTemplate(){return 'id,nombre,comentarios,rol,longitud,latitud,elevacion_m,crs\n1,Punto A,Ejemplo,multipunto,-3.703790,40.416775,650.25,EPSG:4326\n'}
