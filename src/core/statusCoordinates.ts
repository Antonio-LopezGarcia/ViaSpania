export interface Wgs84CursorCoordinate {lon:number;lat:number}

export function formatStatusCoordinates(coordinate:Wgs84CursorCoordinate|null):string{
  return coordinate?`${coordinate.lat.toFixed(6)}, ${coordinate.lon.toFixed(6)} · EPSG:4326`:'—.——————, —.—————— · EPSG:4326';
}
