export interface BuildInfo {version:string;id:string;commit:string;dirty:boolean;builtAt:string;platform:string}
export const BUILD_INFO:BuildInfo={version:__VIASPANIA_VERSION__,id:__VIASPANIA_BUILD_ID__,commit:__VIASPANIA_BUILD_COMMIT__,dirty:__VIASPANIA_BUILD_DIRTY__,builtAt:__VIASPANIA_BUILD_TIME__,platform:__VIASPANIA_BUILD_PLATFORM__};
export function buildDateLabel(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toISOString().replace('T',' ').replace('.000Z',' UTC')}
