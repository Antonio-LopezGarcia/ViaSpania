// ViaSpania
// Copyright © 2026 Antonio López García, Universidad de Granada
// Este programa se distribuye bajo la licencia GPL-3.0-only.
import type { BuiltInMapSourceId } from './appSettings';
import { builtInMapAttribution } from './mapSources';

/** Keep supplied credits verbatim; a layer name is not a licence. */
export function terrainAttribution(base:BuiltInMapSourceId|undefined,external:{name:string;attribution?:string}|undefined,elevation?:string){
 const texture=external?(external.attribution?.trim()||`Fuente externa: ${external.name} · REQUIERE REVISIÓN: atribución y licencia no registradas`):base?builtInMapAttribution(base):undefined;
 return [...new Set([texture,elevation].filter((value):value is string=>Boolean(value)))].join('\n')||undefined;
}
