export type ReportFileKind='route-simple'|'route-comparison'|'multipoint'|'multiroute'|'corridor'|'isochrones'|'viewshed'|'contours';
const REPORT_CODES:Record<ReportFileKind,string>={'route-simple':'RSimple','route-comparison':'RComp',multipoint:'MultiPn',multiroute:'MultiRt',corridor:'Pas',isochrones:'Isoc',viewshed:'Vis',contours:'Curvas'};

export function normalizeProjectName(value:string){return value.trim().replace(/[\\/:*?"<>|]+/g,'_').replace(/\s+/g,'_').replace(/^_+|_+$/g,'')}
export function projectNameFromPath(path:string){const filename=path.split(/[\\/]/).at(-1)??'';return normalizeProjectName(filename.replace(/\.json$/i,''))||'Proyecto'}
export function reportFileName(kind:ReportFileKind,projectName:string,sequence:number){const project=normalizeProjectName(projectName)||'Proyecto',suffix=sequence>1?`_${sequence}`:'';return`Informe_${REPORT_CODES[kind]}_${project}${suffix}.pdf`}
export function projectStudyExtent(value:unknown):[number,number,number,number]|null{
  if(!Array.isArray(value)||value.length!==4||!value.every(item=>typeof item==='number'&&Number.isFinite(item)))return null;
  const [west,south,east,north]=value;
  return west>=-180&&east<=180&&south>=-90&&north<=90&&west<east&&south<north?[west,south,east,north]:null;
}
