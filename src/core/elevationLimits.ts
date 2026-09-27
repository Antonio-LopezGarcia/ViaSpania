/** Shared ceiling for elevation downloads, local imports and route grids. */
export const MAX_ELEVATION_CELLS=67_928_064;
export function elevationSizeAllowed(columns:number,rows:number):boolean{
 return Number.isSafeInteger(columns)&&Number.isSafeInteger(rows)&&columns>0&&rows>0&&columns<=MAX_ELEVATION_CELLS/rows;
}
