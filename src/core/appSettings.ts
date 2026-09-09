import type { ReportOptions } from '../services/report';
import type { NotificationSound } from './notificationSounds';
import type { ExternalMapLayer } from './externalMapLayers';
import type { ElevationSourceId } from './elevationSources';

export type BuiltInMapSourceId='osm'|'ign-topographic'|'pnoa'|'copernicus-vhr-2021'|'MTN50'|'MTN25'|'catastrones'|'Minutas'|'AMS_1956-1957'|'Interministerial_1973-1986';
export type PaletteId='grayscale'|'terrain'|'hypsometric'|'viridis'|'alpine';

export interface AppSettings {
  language?:'es'|'en';
  tutorialEnabled:boolean;
  showPointLabels:boolean;
  labelTextSizePx?:9|11|13|15|18;
  label3dOffsetM?:number;
  label3dLeaderLine?:boolean;
  showMunicipalBoundaries:boolean;
  showUrbanNames:boolean;
  showCrosshairs:boolean;
  showScales:boolean;
  showSelectionCoordinates:boolean;
  showMdtCursorInfo:boolean;
  showSelectionMarker:boolean;
  startupProject:'last'|'new'|'disabled';
  reportDefaults:ReportOptions;
  defaultPalette:PaletteId;
  defaultTerrain3dPalette:PaletteId;
  defaultHistoricalLayer:'MTN50'|'MTN25'|'catastrones'|'Minutas'|'AMS_1956-1957'|'Interministerial_1973-1986';
  defaultNavigationLayer:'osm'|'ign-topographic';
  defaultSelectionOrthophoto:'pnoa'|'copernicus-vhr-2021';
  defaultTerrain3dExaggeration:0|0.5|1|1.5|2|3|4|6|8;
  defaultTerrain3dHighestPoint:boolean;
  defaultTerrain3dShowScale:boolean;
  terrain3dDetached?:boolean;
  processingCellLimit:2_000_000|3_000_000|3_500_000|5_000_000;
  notificationSounds:boolean;
  notificationSound:NotificationSound;
  externalMapLayers:ExternalMapLayer[];
  enabledElevationModels:Record<ElevationSourceId,boolean>;
  enabledMapSources:Record<BuiltInMapSourceId,boolean>;
}

export const DEFAULT_APP_SETTINGS:AppSettings={tutorialEnabled:true,showPointLabels:true,showMunicipalBoundaries:false,showUrbanNames:false,showCrosshairs:true,showScales:true,showSelectionCoordinates:true,showMdtCursorInfo:false,showSelectionMarker:false,startupProject:'disabled',reportDefaults:{navigation:true,pnoaOverview:true,individualRoutePages:false,terrain3d:true,historical:true,pointList:true,barrierList:true,pageSize:'a4'},defaultPalette:'grayscale',defaultTerrain3dPalette:'grayscale',defaultHistoricalLayer:'MTN50',defaultNavigationLayer:'osm',defaultSelectionOrthophoto:'pnoa',defaultTerrain3dExaggeration:2,defaultTerrain3dHighestPoint:false,defaultTerrain3dShowScale:true,processingCellLimit:3_000_000,notificationSounds:true,notificationSound:'chime',externalMapLayers:[],enabledElevationModels:{mdt5:true,mdt25:true,mdt200:true,mds05:false,copernicus30:false},enabledMapSources:{osm:true,'ign-topographic':true,pnoa:true,'copernicus-vhr-2021':true,MTN50:true,MTN25:true,catastrones:true,Minutas:true,'AMS_1956-1957':true,'Interministerial_1973-1986':true}};

export function recommendedCellLimit(totalMemoryBytes?:number|null):AppSettings['processingCellLimit']{if(!totalMemoryBytes)return 3_000_000;const gib=totalMemoryBytes/1073741824;if(gib<=8)return 2_000_000;if(gib<=16)return 3_000_000;if(gib<=24)return 3_500_000;return 5_000_000}

export function normalizePointName(value:string){return Array.from(value.trimStart()).slice(0,20).join('')}
export function loadAppSettings():AppSettings{try{const stored=localStorage.getItem('viaspania.settings.v1');if(!stored)return DEFAULT_APP_SETTINGS;const parsed=JSON.parse(stored) as Partial<AppSettings>&{enabledSurfaceModels?:Partial<Record<'mds05'|'copernicus30',boolean>>};const oldSurfaces=parsed.enabledSurfaceModels;return{...DEFAULT_APP_SETTINGS,...parsed,reportDefaults:{...DEFAULT_APP_SETTINGS.reportDefaults,...parsed.reportDefaults},enabledElevationModels:{...DEFAULT_APP_SETTINGS.enabledElevationModels,...parsed.enabledElevationModels,mds05:parsed.enabledElevationModels?.mds05??oldSurfaces?.mds05??false,copernicus30:parsed.enabledElevationModels?.copernicus30??oldSurfaces?.copernicus30??false},enabledMapSources:{...DEFAULT_APP_SETTINGS.enabledMapSources,...parsed.enabledMapSources}}}catch{return DEFAULT_APP_SETTINGS}}
export function saveAppSettings(settings:AppSettings){localStorage.setItem('viaspania.settings.v1',JSON.stringify(settings))}
const LAST_PROJECT_KEY='viaspania.last-saved-project.v1';
export function saveLastProject(project:string){localStorage.setItem(LAST_PROJECT_KEY,project)}
export function loadLastProject(){return localStorage.getItem(LAST_PROJECT_KEY)}
