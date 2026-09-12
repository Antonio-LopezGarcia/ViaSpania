import type {Barrier,EnabledCrossing,GeoPoint,PointOfInterest,PreferredCorridor,PlaceProvenance} from '../types';
import type {GeoPackageLayer} from './resultExports';
export interface ImportedElements {points:GeoPoint[];barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];pointsOfInterest:PointOfInterest[]}
const object=(value:unknown):Record<string,unknown>=>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Objeto GeoPackage no válido.');return value as Record<string,unknown>};
const str=(value:unknown)=>{if(typeof value!=='string')throw Error('Atributo de texto no válido.');return value};
const num=(value:unknown,min:number,max=Infinity)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('Atributo numérico fuera de rango.');return value};
const choice=<T extends string>(value:unknown,values:readonly T[]):T=>{if(!values.includes(value as T))throw Error('Tipo de elemento no válido.');return value as T};
const coordinate=(value:unknown):[number,number]=>{if(!Array.isArray(value)||value.length<2)throw Error('Coordenadas no válidas.');return[num(value[0],-180,180),num(value[1],-90,90)]};
export function parseElementLayers(layers:readonly GeoPackageLayer[]):ImportedElements {
 const result:ImportedElements={points:[],barriers:[],corridors:[],crossings:[],pointsOfInterest:[]};
 const seen=new Set<string>();
 for(const layer of layers){
  if(!['puntos','barreras','corredores','puentes','puntos_interes'].includes(layer.name))continue;
  try{
   if(seen.has(layer.name))throw Error('Capa duplicada.');seen.add(layer.name);
   const collection=object(JSON.parse(layer.geoJson));if(collection.type!=='FeatureCollection'||!Array.isArray(collection.features))throw Error('Colección no válida.');
   const ids=new Set<string>();
   for(const [index,value] of collection.features.entries()){
    const feature=object(value),p=object(feature.properties),g=object(feature.geometry),name=str(p.nombre),id=String(p.elemento_id??feature.id??index+1);
    if(feature.type!=='Feature'||ids.has(id))throw Error('Elemento duplicado o no válido.');ids.add(id);
    const point=layer.name==='puntos'||layer.name==='puntos_interes';if(g.type!==(point?'Point':'LineString'))throw Error('Geometría incompatible con la capa.');
    const c=point?coordinate(g.coordinates):null;
    const line=()=>{if(!Array.isArray(g.coordinates)||g.coordinates.length<2)throw Error('La línea necesita dos vértices.');return g.coordinates.map(coordinate)};
    if(layer.name==='puntos'){
     const role=choice(p.rol,['inicio','final','multipunto']);if(role!=='multipunto'&&result.points.some(item=>item.role===role))throw Error('Hay más de un punto de inicio o final.');
     let provenance:PlaceProvenance|undefined;
     if(p.provenance!=null){const v=object(JSON.parse(str(p.provenance))),projected=object(v.projected);if(v.originalCrs!=='EPSG:4326')throw Error('Procedencia no válida.');const xy=projected.coordinate;if(!Array.isArray(xy)||xy.length!==2)throw Error('Procedencia no válida.');provenance={source:str(v.source),sourceId:str(v.sourceId),displayName:str(v.displayName),original:coordinate(v.original),originalCrs:'EPSG:4326',projected:{crs:str(projected.crs),coordinate:[num(xy[0],-Infinity),num(xy[1],-Infinity)]}}}
     const numericId=Number(id);if(!Number.isSafeInteger(numericId)||numericId<1||result.points.some(item=>item.id===numericId))throw Error('Identificador de punto no válido.');
     result.points.push({id:numericId,name,comments:p.comentarios==null?'':str(p.comentarios),role,lon:c![0],lat:c![1],crs:'EPSG:4326',provenance});
    }else if(layer.name==='barreras')result.barriers.push({name,coordinates:line(),kind:choice(p.tipo,['absolute','penalty']),value:num(p.valor,1)});
    else if(layer.name==='corredores')result.corridors.push({id,name,coordinates:line(),widthM:num(p.anchura_m,Number.MIN_VALUE),costMultiplier:num(p.multiplicador_coste,Number.MIN_VALUE,1)});
    else if(layer.name==='puentes'){
     if(p.paso_obligatorio!=null&&![true,false,0,1].includes(p.paso_obligatorio as boolean))throw Error('Paso obligatorio no válido.');
     result.crossings.push({id,name,coordinates:line(),kind:choice(p.tipo,['bridge','ford','tunnel']),crossingCostMultiplier:num(p.multiplicador_coste,Number.MIN_VALUE),required:p.paso_obligatorio===true||p.paso_obligatorio===1,barrierId:p.barrera_id==null?undefined:str(p.barrera_id)});
    }else result.pointsOfInterest.push({id,name,coordinate:c!,category:str(p.categoria),influenceRadiusM:num(p.radio_influencia_m,Number.MIN_VALUE),attraction:num(p.atraccion,0,1),mode:choice(p.modo,['influence','single-visit','waypoint'])});
   }
  }catch(error){throw Error(`No se pudo importar la capa ${layer.name}: ${error instanceof Error?error.message:'Datos no válidos.'}`)}
 }
 if(!Object.values(result).some(items=>items.length))throw Error('El GeoPackage no contiene puntos, barreras ni facilitadores compatibles.');
 return result;
}
